import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { useExit } from "./motion";

export type Tone = "dark" | "light";

const BgMesh: React.FC<{ tone: Tone }> = ({ tone }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 60;
  const d2 = Math.cos(frame / 70) * 50;
  const dark = tone === "dark";
  return (
    <AbsoluteFill style={{ background: dark ? theme.colors.ink : theme.colors.paper }}>
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          top: -520,
          left: -420 + d1,
          filter: "blur(60px)",
          background: `radial-gradient(circle, ${theme.colors.brand}${dark ? "26" : "55"}, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          bottom: -460,
          right: -380 - d2,
          filter: "blur(80px)",
          background: dark
            ? `radial-gradient(circle, rgba(255,255,255,0.08), transparent 65%)`
            : `radial-gradient(circle, ${theme.colors.white}, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Grade: React.FC<{ tone: Tone }> = ({ tone }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{ backgroundColor: theme.colors.brand, mixBlendMode: "soft-light", opacity: tone === "dark" ? 0.12 : 0.08 }}
    />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.10), transparent 28%, transparent 72%, rgba(0,0,0,0.18))",
      }}
    />
  </AbsoluteFill>
);

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

const Grain: React.FC<{ tone: Tone }> = ({ tone }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: GRAIN,
        backgroundSize: "220px",
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: tone === "dark" ? 0.09 : 0.05,
        mixBlendMode: tone === "dark" ? "overlay" : "multiply",
      }}
    />
  );
};

const Vignette: React.FC<{ tone: Tone }> = ({ tone }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center, transparent 56%, rgba(0,0,0,${tone === "dark" ? 0.45 : 0.12}) 100%)`,
    }}
  />
);

export const SceneShell: React.FC<{ tone: Tone; exitAt: number; children: React.ReactNode }> = ({
  tone,
  exitAt,
  children,
}) => {
  const exit = useExit(exitAt, 8);
  return (
    <AbsoluteFill>
      <BgMesh tone={tone} />
      <AbsoluteFill style={exit}>{children}</AbsoluteFill>
      <Grade tone={tone} />
      <Grain tone={tone} />
      <Vignette tone={tone} />
    </AbsoluteFill>
  );
};

export const Pill: React.FC<{ tone: Tone; children: React.ReactNode; style?: React.CSSProperties }> = ({
  tone,
  children,
  style,
}) => (
  <div
    style={{
      padding: "18px 30px",
      borderRadius: 999,
      fontFamily: theme.fonts.body,
      fontWeight: 600,
      fontSize: 30,
      letterSpacing: "0.06em",
      whiteSpace: "nowrap",
      ...(tone === "dark"
        ? { background: theme.colors.glass, border: `1px solid ${theme.colors.glassEdge}`, color: theme.colors.text }
        : {
            background: theme.colors.white,
            color: theme.colors.inkText,
            boxShadow: "0 18px 40px -18px rgba(0,0,0,0.28)",
          }),
      ...style,
    }}
  >
    {children}
  </div>
);
