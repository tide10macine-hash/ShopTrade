import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, EASE, FONT, SPRING } from "../theme";
import { clamp, pop } from "./motion";

export type Stroke = { w: number; color: string };
/** Default sticker-style treatment from the reference: colour fill, black outline, white outer outline. */
export const STROKES: Stroke[] = [
  { w: 30, color: C.white },
  { w: 15, color: C.black },
];

/** Multi-layer outlined headline text (each stroke is its own layer, largest first). */
export const Outlined: React.FC<{
  text: string;
  size: number;
  fill?: string;
  strokes?: Stroke[];
  font?: string;
  spacing?: number;
  style?: React.CSSProperties;
}> = ({ text, size, fill = C.red, strokes = STROKES, font = FONT.display, spacing = 0.01, style }) => {
  const base: React.CSSProperties = {
    fontFamily: font,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${spacing}em`,
    whiteSpace: "pre",
    textTransform: "uppercase",
  };
  return (
    <div style={{ position: "relative", display: "inline-block", ...base, ...style }}>
      {strokes.map((s, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            color: s.color,
            WebkitTextStroke: `${s.w}px ${s.color}`,
            filter: i === 0 ? "drop-shadow(0 8px 4px rgba(0,0,0,0.30))" : undefined,
          }}
        >
          {text}
        </span>
      ))}
      <span style={{ position: "relative", color: fill }}>{text}</span>
    </div>
  );
};

/** Letters bounce in one after another (the reference's signature title animation). */
export const BounceText: React.FC<{
  text: string;
  at: number;
  size: number;
  fill?: string;
  strokes?: Stroke[];
  stagger?: number;
  exit?: number;
  font?: string;
}> = ({ text, at, size, fill, strokes, stagger = 2, exit, font }) => {
  const f = useCurrentFrame();
  const chars = text.split("");
  const ex = exit === undefined ? 0 : interpolate(f, [exit, exit + 8], [0, 1], { ...clamp, easing: EASE.in });
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", opacity: 1 - ex, transform: `scale(${1 - 0.3 * ex})` }}>
      {chars.map((ch, i) => {
        const t0 = at + i * stagger;
        const p = pop(f, t0, SPRING.pop);
        const o = interpolate(f, [t0, t0 + 4], [0, 1], clamp);
        const wob = Math.sin((f - t0) / 9 + i) * 2 * Math.min(1, Math.max(0, (f - t0) / 20));
        return (
          <div
            key={i}
            style={{
              opacity: o,
              transform: `translateY(${(1 - p) * 70 + wob}px) rotate(${(1 - p) * (i % 2 ? 18 : -18)}deg) scale(${0.4 + 0.6 * p})`,
              transformOrigin: "50% 80%",
              marginRight: ch === " " ? size * 0.22 : 0,
            }}
          >
            {ch === " " ? null : <Outlined text={ch} size={size} fill={fill} strokes={strokes} font={font} />}
          </div>
        );
      })}
    </div>
  );
};

/** Whole line pops in (scale + rise + fade) — for supporting copy. */
export const LinePop: React.FC<{
  text: string;
  at: number;
  size: number;
  fill?: string;
  strokes?: Stroke[];
  exit?: number;
  font?: string;
  rot?: number;
}> = ({ text, at, size, fill, strokes, exit, font, rot = 0 }) => {
  const f = useCurrentFrame();
  const p = pop(f, at, SPRING.pop);
  const o = interpolate(f, [at, at + 5], [0, 1], clamp);
  const ex = exit === undefined ? 0 : interpolate(f, [exit, exit + 8], [0, 1], { ...clamp, easing: EASE.in });
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        opacity: o * (1 - ex),
        transform: `translateY(${(1 - p) * 50}px) scale(${(0.5 + 0.5 * p) * (1 - 0.3 * ex)}) rotate(${rot}deg)`,
      }}
    >
      <Outlined text={text} size={size} fill={fill} strokes={strokes} font={font} />
    </div>
  );
};

export const Center: React.FC<{ y: number; children: React.ReactNode; z?: number }> = ({ y, children, z = 5 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", zIndex: z }}>
    {children}
  </div>
);
