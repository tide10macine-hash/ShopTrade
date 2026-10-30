import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { Pill, SceneShell } from "../../components/layers";
import { clamp, Entrance, useSec } from "../../components/motion";
import { Footnote, Sneaker, TipHeader } from "../parts";

const BOX_W = 620;
const BOX_H = 330;

export const BoxesTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.boxes;

  const lid = interpolate(frame, [sec(0.8), sec(1.2)], [0, 1], { ...clamp, easing: theme.ease.out });
  const walls = interpolate(frame, [sec(1.1), sec(1.5)], [0, 1], { ...clamp, easing: theme.ease.in });
  const snug = interpolate(frame, [sec(1.5), sec(2.2)], [0, 1], { ...clamp, easing: theme.ease.inOut });

  const parcelW = interpolate(snug, [0, 1], [BOX_W + 60, 520]);
  const parcelH = interpolate(snug, [0, 1], [BOX_H + 120, 300]);

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <TipHeader tone="dark" title={copy.title} support={copy.support} delay={2} />

        <div style={{ position: "absolute", top: 700, width: 900, height: 620, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Entrance delay={sec(0.15)}>
            <div style={{ position: "relative", width: BOX_W, height: BOX_H + 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div
                style={{
                  position: "absolute",
                  width: parcelW,
                  height: parcelH,
                  borderRadius: 26,
                  border: `3px dashed ${snug > 0 ? theme.colors.brand : theme.colors.glassEdge}`,
                  opacity: walls,
                  boxShadow: snug >= 1 ? `0 0 40px ${theme.colors.glow}` : undefined,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 60,
                  width: BOX_W,
                  height: BOX_H,
                  borderRadius: 14,
                  background: "linear-gradient(180deg, #B98A5A, #9C7046)",
                  opacity: 1 - walls,
                  transform: `translateY(${walls * 160}px) scale(${1 - walls * 0.1})`,
                }}
              />
              <div style={{ position: "relative", display: "flex", gap: 10, marginTop: 30 }}>
                <Sneaker width={250} tone="dark" />
                <div style={{ transform: "scaleX(-1)" }}>
                  <Sneaker width={250} tone="dark" />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  width: BOX_W + 30,
                  height: 70,
                  borderRadius: 14,
                  background: "linear-gradient(180deg, #C99A68, #AE7F52)",
                  opacity: 1 - lid,
                  transform: `translateY(${-lid * 260}px) rotate(${-lid * 14}deg)`,
                }}
              />
            </div>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 1360 }}>
          <Entrance delay={sec(2.2)} config={theme.spring.bouncy}>
            <Pill tone="dark" style={{ color: theme.colors.brand }}>
              {copy.chip}
            </Pill>
          </Entrance>
        </div>

        <Footnote tone="dark" text={copy.footnote} delay={sec(2.4)} top={1500} />
      </AbsoluteFill>
    </SceneShell>
  );
};
