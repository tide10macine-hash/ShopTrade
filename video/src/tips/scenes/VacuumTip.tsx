import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { clamp, Entrance, useSec } from "../../components/motion";
import { Label, Parcel, TipHeader } from "../parts";

const SHIRTS = ["#2B3A55", "#8D939B", "#D8CBB3", "#5E6B4E"];
const SHIRT_H = 74;

const VacuumBag: React.FC<{ squeeze: number }> = ({ squeeze }) => {
  const stackScale = interpolate(squeeze, [0, 1], [1, 0.48]);
  const innerH = SHIRTS.length * (SHIRT_H + 8) * stackScale;
  return (
    <div
      style={{
        width: 600,
        height: innerH + 120,
        borderRadius: 40,
        background: "rgba(225, 232, 238, 0.55)",
        border: `2px solid ${theme.colors.uiStrong}`,
        boxShadow: "inset 0 0 40px rgba(255,255,255,0.9), 0 30px 60px -30px rgba(0,0,0,0.3)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 30,
      }}
    >
      <div style={{ position: "absolute", top: 18, left: 30, right: 30, height: 12, borderRadius: 6, background: theme.colors.uiStrong }} />
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 40,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: `6px solid ${theme.colors.inkDim}`,
          background: theme.colors.white,
        }}
      />
      {[0.25, 0.5, 0.75].map((x) => (
        <div
          key={x}
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            top: 70,
            bottom: 20,
            width: 2,
            background: "rgba(255,255,255,0.9)",
            opacity: squeeze * 0.9,
            transform: `rotate(${(x - 0.5) * 18}deg)`,
          }}
        />
      ))}
      {SHIRTS.map((color, i) => (
        <div
          key={color}
          style={{
            width: 470,
            height: SHIRT_H * stackScale,
            marginTop: 8 * stackScale,
            borderRadius: 18,
            background: color,
            boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.12)",
            position: "relative",
            zIndex: i,
          }}
        >
          <div style={{ position: "absolute", left: 40, right: 40, top: "45%", height: 3, background: "rgba(255,255,255,0.18)" }} />
        </div>
      ))}
    </div>
  );
};

export const VacuumTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.vacuum;

  const squeeze = interpolate(frame, [sec(0.9), sec(1.6)], [0, 1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <TipHeader tone="light" title={copy.title} support={copy.support} delay={2} />

        <div style={{ position: "absolute", top: 600 }}>
          <Entrance delay={sec(0.2)} config={theme.spring.smooth}>
            <VacuumBag squeeze={squeeze} />
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 1110, display: "flex", alignItems: "flex-end", gap: 70 }}>
          <Entrance delay={sec(1.8)} from="left" distance={80}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <Parcel width={330} />
              <Label tone="light">{copy.before}</Label>
            </div>
          </Entrance>
          <Entrance delay={sec(1.95)} from="left" distance={30}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 150 }}>
              <path d="M4 12h15M13 6l6 6-6 6" stroke={theme.colors.inkDim} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Entrance>
          <Entrance delay={sec(2.1)} from="right" distance={80} config={theme.spring.bouncy}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <Parcel width={210} />
              <Label tone="light" style={{ color: theme.colors.inkText }}>
                {copy.after}
              </Label>
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
