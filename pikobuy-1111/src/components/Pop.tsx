import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE, SPRING } from "../theme";
import { clamp, idle, pop } from "./motion";

type From = "pop" | "left" | "right" | "top" | "bottom" | "slam";
export const Pop: React.FC<{
  at: number;
  x: number; // centre x (px)
  y: number; // centre y (px)
  rot?: number;
  scale?: number;
  from?: From;
  exit?: number;
  seed?: number;
  shadow?: boolean;
  z?: number;
  children: React.ReactNode;
}> = ({ at, x, y, rot = 0, scale = 1, from = "pop", exit, seed = 0, shadow = true, z = 1, children }) => {
  const f = useCurrentFrame();
  if (f < at - 1) return null;
  const p = pop(f, at, from === "slam" ? SPRING.slam : from === "pop" ? SPRING.pop : SPRING.slam);
  const lin = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: EASE.out });
  let tx = 0, ty = 0, s = 1, r = rot, blur = 0;
  const d = 1 - p;
  switch (from) {
    case "pop":
      s = p; r = rot - 22 * d; break;
    case "slam":
      s = 1 + 2.2 * d; blur = Math.max(0, d) * 10; break;
    case "left": tx = -1300 * d; r = rot - 14 * d; blur = Math.abs(d) * 26; break;
    case "right": tx = 1300 * d; r = rot + 14 * d; blur = Math.abs(d) * 26; break;
    case "top": ty = -1500 * d; r = rot + 10 * d; blur = Math.abs(d) * 22; break;
    case "bottom": ty = 1500 * d; r = rot - 10 * d; blur = Math.abs(d) * 22; break;
  }
  const i = idle(f - at, seed, lin);
  let o = from === "slam" ? lin : Math.min(1, lin * 3);
  if (exit !== undefined) {
    const e = interpolate(f, [exit, exit + 9], [0, 1], { ...clamp, easing: EASE.in });
    s *= 1 - 0.85 * e; o *= 1 - e; r += 20 * e;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: z,
        opacity: o,
        transform: `translate(-50%,-50%) translate(${tx}px, ${ty + i.y}px) rotate(${r + i.r}deg) scale(${s * scale * i.s})`,
        filter: `${blur > 0.3 ? `blur(${blur}px) ` : ""}${shadow ? "drop-shadow(0 14px 10px rgba(0,0,0,0.28)) drop-shadow(0 3px 2px rgba(0,0,0,0.25))" : ""}`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
