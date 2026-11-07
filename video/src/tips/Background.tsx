import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, useCurrentFrame } from "remotion";
import { SECTIONS, sectionAt } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const BLEND = 14; // frames for the colour cross-fade at a section change

/** current theme colours, cross-faded across section changes */
export const useTheme = () => {
  const f = useCurrentFrame();
  const i = sectionAt(f);
  const cur = SECTIONS[i].theme;
  const prev = SECTIONS[Math.max(0, i - 1)].theme;
  const p = i === 0 ? 1 : interpolate(f - SECTIONS[i].from, [0, BLEND], [0, 1], clamp);
  const mix = (k: "glow" | "mid" | "edge" | "accent") => interpolateColors(p, [0, 1], [prev[k], cur[k]]);
  return { glow: mix("glow"), mid: mix("mid"), edge: mix("edge"), accent: mix("accent") };
};

/** dark neon backdrop: radial glow, faint grid, scanlines, grain, vignette */
export const NeonBackground: React.FC = () => {
  const f = useCurrentFrame();
  const t = useTheme();
  const pulse = 0.9 + 0.1 * Math.sin(f / 22);
  const seed = Math.floor(f / 2);
  return (
    <AbsoluteFill style={{ background: t.edge, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 50% at 50% 50%, ${t.glow} 0%, ${t.mid} 38%, ${t.edge} 85%)`,
          opacity: pulse,
        }}
      />
      {/* faint grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.05) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${(f * 0.6) % 90}px`,
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, black 30%, transparent 80%)",
        }}
      />
      {/* scanlines */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 5px)" }} />
      {/* drifting dust */}
      {Array.from({ length: 26 }, (_, i) => {
        const x = random(`dx${i}`) * 1080;
        const y = (random(`dy${i}`) * 1920 - f * (0.4 + random(`ds${i}`) * 0.8)) % 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y < 0 ? y + 1920 : y, width: 4, height: 4, borderRadius: 2,
              background: "rgba(255,255,255,0.5)", opacity: 0.25 + 0.5 * random(`do${i}`),
            }}
          />
        );
      })}
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`tg${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#tg${seed})`} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

/** RGB-split + jitter glitch over section changes. Renders children once, or as 3 channel copies while glitching. */
export const Glitch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  let g = 0;
  for (const s of SECTIONS.slice(1)) {
    const d = f - s.from;
    if (d >= -4 && d <= 10) g = Math.max(g, d < 0 ? (d + 4) / 4 : Math.exp(-d / 3.5));
  }
  if (g < 0.04) return <AbsoluteFill>{children}</AbsoluteFill>;
  const off = 26 * g;
  const jx = (random(`gx${f}`) - 0.5) * 40 * g;
  const bars = Array.from({ length: 5 }, (_, i) => ({
    y: random(`gb${f}-${i}`) * 1920,
    h: 6 + random(`gh${f}-${i}`) * 50,
    o: random(`go${f}-${i}`) * 0.5 * g,
  }));
  const ch = (id: string, dx: number) => (
    <AbsoluteFill style={{ transform: `translateX(${jx + dx}px)`, filter: `url(#${id})`, mixBlendMode: "screen" }}>{children}</AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="onlyR"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id="onlyG"><feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id="onlyB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" /></filter>
      </svg>
      {ch("onlyR", off)}
      {ch("onlyG", 0)}
      {ch("onlyB", -off)}
      {bars.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: b.y, height: b.h, background: "rgba(255,255,255,0.9)", opacity: b.o, mixBlendMode: "overlay" }} />
      ))}
      <AbsoluteFill style={{ background: "#fff", opacity: 0.18 * g }} />
    </AbsoluteFill>
  );
};
