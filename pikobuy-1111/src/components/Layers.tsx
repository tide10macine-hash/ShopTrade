import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { EASE, TOTAL } from "../theme";
import { asset } from "./Graphics";
import { clamp } from "./motion";

/** Crumpled paper (cleaned plate from the reference) with a slow drift so it never feels frozen. */
export const Paper: React.FC = () => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, TOTAL], [1.04, 1.12], { ...clamp, easing: EASE.inOut });
  const x = Math.sin(f / 140) * 10;
  return (
    <AbsoluteFill style={{ background: "#ECECEE", overflow: "hidden" }}>
      <Img src={asset("backgrounds/crumpled-paper.png")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s}) translateX(${x}px)` }} />
    </AbsoluteFill>
  );
};

/** Subtle warm grade + vignette + animated film grain — sits above everything. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 100 }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,214,120,0.05), rgba(255,120,80,0.04))", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.20) 100%)" }} />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Whip-pan wrapper: scene content whips in from the right and out to the left with motion blur. */
export const Whip: React.FC<{ dur: number; children: React.ReactNode; inFrom?: "right" | "bottom" | "zoom" | "none"; noOut?: boolean }> = ({ dur, children, inFrom = "right", noOut }) => {
  const f = useCurrentFrame();
  const i = inFrom === "none" ? 0 : interpolate(f, [0, 8], [1, 0], { ...clamp, easing: EASE.out });
  const o = noOut ? 0 : interpolate(f, [dur - 7, dur], [0, 1], { ...clamp, easing: EASE.in });
  let t = "";
  if (inFrom === "right") t = `translateX(${i * 1100}px)`;
  if (inFrom === "bottom") t = `translateY(${i * 1700}px)`;
  if (inFrom === "zoom") t = `scale(${1 + i * 1.6})`;
  const blur = (i + o) * 30;
  return (
    <AbsoluteFill style={{ transform: `${t} translateX(${-o * 1100}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined, opacity: inFrom === "zoom" ? 1 - i * 0.8 : 1 }}>
      {children}
    </AbsoluteFill>
  );
};
