import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { C, EASE, FONT, SPRING } from "../theme";
import { Outlined } from "./core";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Red price tag with string and a white down arrow. */
export const PriceTag: React.FC<{ w?: number; text?: string; color?: string }> = ({ w = 260, text = "LOW\nPRICE", color = C.red }) => {
  const h = w * 1.25;
  return (
    <div style={{ position: "relative", width: w, height: h + w * 0.5 }}>
      <svg width={w} height={h + w * 0.5} style={{ position: "absolute" }}>
        <line x1={w / 2} y1={0} x2={w / 2} y2={w * 0.62} stroke="#d98a36" strokeWidth={6} />
        <path
          d={`M ${w * 0.5} ${w * 0.45} L ${w * 0.92} ${w * 0.8} V ${h + w * 0.42} Q ${w * 0.92} ${h + w * 0.48} ${w * 0.86} ${h + w * 0.48}
              H ${w * 0.14} Q ${w * 0.08} ${h + w * 0.48} ${w * 0.08} ${h + w * 0.42} V ${w * 0.8} Z`}
          fill={color} stroke={C.black} strokeWidth={8} strokeLinejoin="round"
        />
        <circle cx={w / 2} cy={w * 0.68} r={w * 0.07} fill="#f4efe9" stroke={C.black} strokeWidth={5} />
        <path
          d={`M ${w * 0.5} ${h + w * 0.3} l ${-w * 0.2} ${-w * 0.2} h ${w * 0.12} v ${-w * 0.22} h ${w * 0.16} v ${w * 0.22} h ${w * 0.12} Z`}
          fill={C.white} stroke={C.black} strokeWidth={5} strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute", top: w * 0.86, width: w, textAlign: "center", whiteSpace: "pre",
          fontFamily: FONT.display, fontWeight: 900, fontSize: w * 0.19, lineHeight: 0.95, color: C.white,
          WebkitTextStroke: `1px ${C.black}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** White cut-out board with an icon and a two-tone label (scene 5). */
export const BenefitBoard: React.FC<{
  icon: React.ReactNode; top: string; bottom: string; w?: number; topSize?: number; bottomSize?: number;
}> = ({ icon, top, bottom, w = 860, topSize = 70, bottomSize = 70 }) => (
  <div
    style={{
      width: w, height: 230, background: C.white, border: `8px solid ${C.black}`, borderRadius: 34,
      display: "flex", alignItems: "center", gap: 26, padding: "0 30px", boxSizing: "border-box",
      boxShadow: `10px 12px 0 ${C.black}`,
    }}
  >
    <div style={{ width: 230, height: 190, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Outlined text={top} size={topSize} color={C.red} />
      <Outlined text={bottom} size={bottomSize} color={C.black} stroke={1} />
    </div>
  </div>
);

/** Round red badge in the style of the reference's discount circle. */
export const RoundBadge: React.FC<{ d: number; top: string; big: string }> = ({ d, top, big }) => (
  <div
    style={{
      width: d, height: d, borderRadius: "50%", background: C.red, border: `9px solid ${C.white}`,
      boxShadow: `0 0 0 6px ${C.black}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}
  >
    <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: d * 0.17, color: C.white, lineHeight: 1 }}>{top}</div>
    <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: d * 0.44, color: C.white, lineHeight: 0.95, letterSpacing: "-0.04em" }}>{big}</div>
  </div>
);

/** Hand-drawn marker circle that draws itself on. */
export const MarkerCircle: React.FC<{ w: number; h: number; delay: number; color?: string }> = ({ w, h, delay, color = C.red }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 16], [0, 1], { ...clamp, easing: EASE.out });
  const len = 2400;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <path
        d={`M ${w * 0.55} ${h * 0.04} C ${w * 1.05} ${h * 0.02}, ${w * 1.04} ${h * 0.98}, ${w * 0.48} ${h * 0.97}
            C ${-w * 0.04} ${h * 0.96}, ${-w * 0.02} ${h * 0.08}, ${w * 0.6} ${h * 0.1}`}
        fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - p)}
      />
    </svg>
  );
};

/** Chip showing campaign status */
export const StatusChip: React.FC<{ text: string; live?: boolean }> = ({ text, live }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blink = 0.55 + 0.45 * Math.abs(Math.sin((frame / fps) * Math.PI * 2));
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 18, background: C.black, color: C.white, borderRadius: 60,
        padding: "16px 34px", fontFamily: FONT.display, fontWeight: 900, fontSize: 48, border: `6px solid ${C.white}`,
      }}
    >
      <div style={{ width: 26, height: 26, borderRadius: 13, background: live ? C.green : C.red, opacity: blink }} />
      {text}
    </div>
  );
};

/** Animated number that ticks up (used for the 80% reveal). */
export const useCount = (from: number, to: number, start: number, dur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: SPRING.soft, durationInFrames: dur });
  return Math.round(interpolate(s, [0, 1], [from, to], clamp));
};
