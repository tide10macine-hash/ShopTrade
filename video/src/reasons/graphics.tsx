import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE, FONT, SHADOW } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Magnifying glass that sweeps over the parcel (inspection). */
export const Magnifier: React.FC<{ size?: number }> = ({ size = 260 }) => (
  <svg width={size * 1.5} height={size * 1.5} viewBox="0 0 150 150" style={{ overflow: "visible", filter: SHADOW.sticker }}>
    <line x1="88" y1="88" x2="140" y2="140" stroke={C.black} strokeWidth="22" strokeLinecap="round" />
    <line x1="88" y1="88" x2="138" y2="138" stroke={C.red} strokeWidth="12" strokeLinecap="round" />
    <circle cx="55" cy="55" r="46" fill="rgba(190,235,255,0.35)" stroke={C.black} strokeWidth="12" />
    <circle cx="55" cy="55" r="46" fill="none" stroke={C.white} strokeWidth="3" strokeDasharray="30 260" strokeDashoffset="-150" />
    <path d="M 30 40 Q 38 26 54 24" fill="none" stroke={C.white} strokeWidth="7" strokeLinecap="round" />
  </svg>
);

/** Tear-off day calendar that flips 1 -> `to`, one page every `every` frames. */
export const FlipCalendar: React.FC<{ start: number; to: number; every: number; w?: number }> = ({ start, to, every, w = 340 }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - start);
  const n = Math.min(to, 1 + Math.floor(f / every));
  const local = n < to ? f % every : f - (to - 1) * every;
  const flip = interpolate(local, [0, 5], [-70, 0], { ...clamp, easing: EASE.out });
  const pop = n === to ? 1 + 0.18 * Math.exp(-local / 6) : 1;
  const h = w * 1.12;
  return (
    <div style={{ width: w, height: h, position: "relative", filter: SHADOW.sticker }}>
      <div style={{ position: "absolute", inset: 0, background: C.white, border: `9px solid ${C.black}`, borderRadius: 30, overflow: "hidden" }}>
        <div
          style={{
            height: h * 0.27, background: C.red, borderBottom: `8px solid ${C.black}`, display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: w * 0.17, color: C.white, letterSpacing: "0.08em",
          }}
        >
          {n === 1 ? "DAY" : "DAYS"}
        </div>
        <div style={{ perspective: 600, display: "flex", justifyContent: "center", alignItems: "center", height: h * 0.73 - 18 }}>
          <div
            style={{
              fontFamily: FONT.display, fontWeight: 900, fontSize: w * 0.62, lineHeight: 1, color: n === to ? C.red : C.black,
              transform: `rotateX(${flip}deg) scale(${pop})`, transformOrigin: "50% 0%",
            }}
          >
            {n}
          </div>
        </div>
      </div>
      {[0.28, 0.72].map((x) => (
        <div key={x} style={{ position: "absolute", top: -26, left: w * x - 14, width: 28, height: 56, borderRadius: 14, background: "#cfd4da", border: `6px solid ${C.black}` }} />
      ))}
    </div>
  );
};

/** Phone with the creator's link-in-bio page (official screenshot, unedited). */
export const Phone: React.FC<{ w: number; src: string }> = ({ w, src }) => (
  <div style={{ position: "relative", width: w, padding: w * 0.03, background: C.black, borderRadius: w * 0.12, boxShadow: "0 30px 40px rgba(30,20,20,0.35)" }}>
    <Img src={staticFile(src)} style={{ width: "100%", display: "block", borderRadius: w * 0.095 }} />
    <div style={{ position: "absolute", top: w * 0.05, left: "50%", transform: "translateX(-50%)", width: w * 0.28, height: w * 0.055, borderRadius: 40, background: C.black }} />
  </div>
);

/** Bouncing red arrow (pointing left) in the sticker style. */
export const PointArrow: React.FC<{ w?: number; delay: number }> = ({ w = 230, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  if (f < 0) return null;
  const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 240, mass: 0.6 } });
  const bob = 16 * Math.abs(Math.sin((f / fps) * Math.PI * 2));
  return (
    <svg width={w} height={w * 0.6} viewBox="0 0 200 120" style={{ transform: `translateX(${(1 - s) * 400 + bob}px)`, filter: SHADOW.sticker, overflow: "visible" }}>
      <path d="M 8 60 L 78 8 L 78 38 L 192 38 L 192 82 L 78 82 L 78 112 Z" fill={C.red} stroke={C.black} strokeWidth="10" strokeLinejoin="round" />
      <path d="M 8 60 L 78 8 L 78 38 L 192 38 L 192 82 L 78 82 L 78 112 Z" fill="none" stroke={C.white} strokeWidth="3" strokeLinejoin="round" transform="translate(3,3) scale(0.97)" opacity="0.6" />
    </svg>
  );
};

/** Small black chip, e.g. "REASON #1". */
export const Chip: React.FC<{ text: string; size?: number; bg?: string; color?: string }> = ({ text, size = 46, bg = C.black, color = C.white }) => (
  <div
    style={{
      background: bg, color, borderRadius: 60, padding: `${size * 0.32}px ${size * 0.7}px`, border: `6px solid ${C.white}`,
      fontFamily: FONT.display, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: "0.04em", whiteSpace: "pre",
      boxShadow: "0 8px 0 rgba(0,0,0,0.85)",
    }}
  >
    {text}
  </div>
);

/** Small readable qualifier line on a light pill. */
export const FinePrint: React.FC<{ text: string; y: number; opacity?: number }> = ({ text, y, opacity = 1 }) => (
  <div
    style={{
      position: "absolute", left: 90, right: 90, top: y, opacity, textAlign: "center", fontFamily: FONT.display, fontWeight: 700,
      fontSize: 28, lineHeight: 1.25, color: C.black, background: "rgba(255,255,255,0.88)", borderRadius: 14, padding: "8px 18px",
    }}
  >
    {text}
  </div>
);
