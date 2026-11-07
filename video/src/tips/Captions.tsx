import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BLOCKS, Block, T, TE, W, blockStart } from "./timeline";
import { useTheme } from "./Background";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SERIF = "'Instrument Serif', serif";
const BOLD = "'Montserrat', sans-serif";
const PRE = 3; // words appear this many frames before they are spoken

const range = (r?: [number, number]) => (r ? Array.from({ length: r[1] - r[0] + 1 }, (_, k) => r[0] + k) : []);

/** italic serif words that fade/rise in as each word is spoken */
const SerifLine: React.FC<{ idx: number[]; size: number; opacity?: number }> = ({ idx, size, opacity = 0.92 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.26, maxWidth: 940 }}>
      {idx.map((i) => {
        const d = f - (T(i) - PRE);
        const p = interpolate(d, [0, 7], [0, 1], clamp);
        return (
          <span
            key={i}
            style={{
              fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1.12, color: "#fff", opacity: p * opacity,
              transform: `translateY(${(1 - p) * 14}px)`, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
              textShadow: "0 3px 14px rgba(0,0,0,0.55)",
            }}
          >
            {W[i].w.toLowerCase()}
          </span>
        );
      })}
    </div>
  );
};

/** bold neon key phrase, typed letter by letter across each word's spoken duration */
const KeyLine: React.FC<{ idx: number[]; text?: string; color: string }> = ({ idx, text, color }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text ? [text] : idx.map((i) => W[i].w.toUpperCase());
  const timing = text ? [[T(idx[0]) - PRE, TE(idx[idx.length - 1])]] : idx.map((i) => [T(i) - PRE, Math.max(TE(i), T(i) + 8)]);
  const total = words.join(" ").length;
  const size = total > 22 ? 70 : total > 14 ? 84 : 104;
  const s = spring({ frame: f - timing[0][0], fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  return (
    <div
      style={{
        display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.28, maxWidth: 980,
        transform: `scale(${0.9 + 0.1 * s})`, margin: "6px 0",
      }}
    >
      {words.map((wd, k) => {
        const [a, b] = timing[k];
        const n = Math.round(interpolate(f, [a, Math.max(a + 1, a + (b - a) * 0.7)], [0, wd.length], clamp));
        if (n <= 0) return null;
        return (
          <span
            key={k}
            style={{
              fontFamily: BOLD, fontWeight: 900, fontSize: size, lineHeight: 1.04, color, letterSpacing: "-0.01em", whiteSpace: "pre",
              textShadow: `0 0 18px ${color}, 0 0 42px ${color}, 0 4px 0 rgba(0,0,0,0.45)`,
            }}
          >
            {wd.slice(0, n)}
            <span style={{ opacity: 0 }}>{wd.slice(n)}</span>
          </span>
        );
      })}
    </div>
  );
};

const CaptionBlock: React.FC<{ b: Block; until: number }> = ({ b, until }) => {
  const f = useCurrentFrame();
  const t = useTheme();
  const out = interpolate(f, [until - 6, until], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute", top: 210, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center",
        opacity: out, transform: `translateY(${(1 - out) * -20}px)`,
      }}
    >
      {b.lead && <SerifLine idx={range(b.lead)} size={64} />}
      {b.key && <KeyLine idx={range(b.key)} text={b.keyText} color={t.accent} />}
      {b.tail && <SerifLine idx={range(b.tail)} size={52} opacity={0.8} />}
    </div>
  );
};

/** the top caption stack: current block only */
export const TopCaptions: React.FC = () => {
  const f = useCurrentFrame();
  let cur = -1;
  for (let k = 0; k < BLOCKS.length; k++) if (f >= T(blockStart(BLOCKS[k])) - PRE) cur = k;
  if (cur < 0) return null;
  const until = cur + 1 < BLOCKS.length ? T(blockStart(BLOCKS[cur + 1])) - PRE : Number.MAX_SAFE_INTEGER;
  return <CaptionBlock key={cur} b={BLOCKS[cur]} until={until} />;
};

// bottom auto-captions: chunks of up to 3 words, broken at punctuation
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

export const BottomCaptions: React.FC = () => {
  const f = useCurrentFrame();
  let k = -1;
  for (let c = 0; c < CHUNKS.length; c++) if (f >= T(CHUNKS[c][0]) - 2) k = c;
  if (k < 0) return null;
  const chunk = CHUNKS[k];
  const endF = TE(chunk[chunk.length - 1]) + 18;
  const next = k + 1 < CHUNKS.length ? T(CHUNKS[k + 1][0]) - 2 : endF;
  if (f > Math.min(endF, next + 1) && f >= next) return null;
  if (f > endF) return null;
  const d = f - (T(chunk[0]) - 2);
  const p = interpolate(d, [0, 5], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", top: 1400, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: BOLD, fontWeight: 800, fontSize: 40, letterSpacing: "0.04em", color: "#fff", textTransform: "uppercase",
          opacity: p, transform: `scale(${0.92 + 0.08 * p})`, textShadow: "0 3px 10px rgba(0,0,0,0.8)",
        }}
      >
        {chunk.map((i) => W[i].w).join(" ")}
      </div>
    </div>
  );
};
