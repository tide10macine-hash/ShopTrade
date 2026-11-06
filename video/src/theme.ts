import { Easing } from "remotion";

// One source of truth for colour, type, motion. Never inline these in scenes.
export const C = {
  red: "#E8202A",
  redDark: "#B5121B",
  yellow: "#FFD21F",
  yellowDeep: "#F7B500",
  white: "#FFFFFF",
  black: "#111111",
  cyan: "#00B6D4", // PIKOBUY brand cyan (logo / official coupon)
  green: "#1DA83C",
  greenDark: "#0E7A2A",
  paperShadow: "rgba(40,30,30,0.32)",
};

export const FONT = {
  display: "'Montserrat', 'Poppins', sans-serif", // headline: geometric heavy sans like the reference
  heavy: 900,
};

export const SPRING = {
  pop: { damping: 10, stiffness: 240, mass: 0.6 }, // sticker pop with elastic overshoot
  slam: { damping: 14, stiffness: 320, mass: 0.9 }, // heavy slam-in
  soft: { damping: 18, stiffness: 140, mass: 0.8 },
  letter: { damping: 9, stiffness: 300, mass: 0.5 },
};

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
};

export const SHADOW = {
  sticker: "drop-shadow(0px 14px 10px rgba(40,30,30,0.30)) drop-shadow(0px 2px 2px rgba(0,0,0,0.25))",
  text: "drop-shadow(0px 10px 8px rgba(40,30,30,0.30))",
};

// Mobile-safe zone for 1080x1920 (TikTok / Reels / Shorts UI overlays)
export const SAFE = { top: 220, bottom: 1520, left: 80, right: 960 };
