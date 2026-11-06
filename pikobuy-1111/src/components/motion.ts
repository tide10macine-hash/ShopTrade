import { interpolate, spring } from "remotion";
import { EASE, FPS, SPRING } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** eased 0->1 between two frames */
export const ramp = (f: number, a: number, b: number, ease = EASE.out) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });

export const pop = (f: number, at: number, cfg = SPRING.pop) =>
  spring({ frame: f - at, fps: FPS, config: cfg });

/** camera shake: decaying offset after each impact frame */
export const shake = (f: number, hits: number[], amp = 16, len = 14) => {
  let x = 0, y = 0, r = 0;
  for (const h of hits) {
    const d = f - h;
    if (d < 0 || d > len) continue;
    const k = Math.pow(1 - d / len, 2) * amp;
    x += Math.sin(d * 2.9 + h) * k;
    y += Math.cos(d * 3.7 + h * 0.5) * k * 0.8;
    r += Math.sin(d * 2.1 + h) * k * 0.06;
  }
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
};

/** idle "breathing" for anything that stays on screen */
export const idle = (f: number, seed = 0, amt = 1) => ({
  y: Math.sin((f + seed * 37) / 17) * 5 * amt,
  r: Math.sin((f + seed * 53) / 23) * 1.4 * amt,
  s: 1 + Math.sin((f + seed * 11) / 29) * 0.012 * amt,
});
