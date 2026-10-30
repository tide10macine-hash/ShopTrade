import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { Card, Parcel } from "../parts";

export const OfferTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.offer;

  const float = useSpring(sec(0.1), theme.spring.smooth);
  const count = useSpring(sec(0.6), theme.spring.counter);
  const spin = Math.sin(frame / 28) * 14;
  const sheen = ((frame / 70) % 1) * 180 - 40;

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 330,
            opacity: Math.min(1, float * 1.5),
            transform: `translateY(${interpolate(float, [0, 1], [200, 0]) + Math.sin(frame / 22) * 8}px) perspective(1000px) rotateY(${spin}deg) rotateZ(${spin * 0.2}deg)`,
          }}
        >
          <div style={{ position: "relative" }}>
            <Parcel width={400} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                mixBlendMode: "overlay",
                background: `linear-gradient(115deg, transparent ${sheen}%, rgba(255,255,255,0.5) ${sheen + 12}%, transparent ${sheen + 24}%)`,
                WebkitMaskImage: `url(${staticFile("img/box.png")})`,
                WebkitMaskSize: "100% 100%",
              }}
            />
          </div>
        </div>

        {copy.showRate ? (
          <div style={{ position: "absolute", top: 830, width: 920, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Entrance delay={sec(0.5)} config={theme.spring.snappy}>
              <div style={{ ...display(250, theme.colors.text), fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                ${Math.round(interpolate(count, [0, 1], [0, copy.price]))}
              </div>
            </Entrance>
            <WordReveal text={copy.weight} delay={sec(0.9)} style={{ ...display(110, theme.colors.text), marginTop: 6 }} />
            <Entrance delay={sec(1.6)} distance={30} style={{ marginTop: 40 }}>
              <Card tone="dark" style={{ padding: "22px 34px" }}>
                <div style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 36, color: theme.colors.brand, textAlign: "center" }}>
                  {copy.support}
                </div>
              </Card>
            </Entrance>
            <Entrance delay={sec(2.2)} distance={16} style={{ marginTop: 28 }}>
              <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 28, color: theme.colors.textDim, textAlign: "center", maxWidth: 820 }}>
                {copy.fine}
              </div>
            </Entrance>
          </div>
        ) : (
          <div style={{ position: "absolute", top: 900, width: 920 }}>
            <WordReveal text={copy.fallback} delay={sec(0.5)} style={display(104, theme.colors.text)} />
          </div>
        )}
      </AbsoluteFill>
    </SceneShell>
  );
};
