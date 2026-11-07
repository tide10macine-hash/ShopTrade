import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { T, TE, W } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// subtitle chunks: up to 3 words, broken at punctuation
const CHUNKS: number[][] = (() => {
  const out: number[][] = [];
  let cur: number[] = [];
  W.forEach((w, i) => {
    cur.push(i);
    if (cur.length === 3 || /[.,:!?]$/.test(w.w)) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
})();

/** bottom subtitles: white words with a black outline; the word being spoken turns red */
export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  let k = -1;
  for (let c = 0; c < CHUNKS.length; c++) if (f >= T(CHUNKS[c][0]) - 2) k = c;
  if (k < 0) return null;
  const chunk = CHUNKS[k];
  if (f > TE(chunk[chunk.length - 1]) + 18) return null;
  const s = spring({ frame: f - (T(chunk[0]) - 2), fps, config: { damping: 12, stiffness: 300, mass: 0.5 } });
  return (
    <div style={{ position: "absolute", top: 1430, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 34 }}>
      {chunk.map((i) => {
        const active = f >= T(i) - 2 && f <= TE(i) + 2;
        const txt = W[i].w.replace(/[.,:!?]$/, "").toUpperCase();
        return (
          <span
            key={i}
            style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 54, letterSpacing: "-0.01em",
              color: active ? "#E8202A" : "#fff", WebkitTextStroke: "12px #111", paintOrder: "stroke fill",
              transform: `scale(${(0.85 + 0.15 * s) * (active ? 1.08 : 1)})`, display: "inline-block",
              opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
              filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.25))",
            }}
          >
            {txt}
          </span>
        );
      })}
    </div>
  );
};
