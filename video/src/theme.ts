// theme.ts — single source of truth for every Remotion project.
// NEVER inline colors, easings, or spring configs in components.
import { Easing } from "remotion";

export const theme = {
  colors: {
    ink: "#050506",
    inkRaised: "#141417",
    paper: "#F2F6F6",
    white: "#FFFFFF",
    brand: "#7EFCF8", // Pikobuy cyan, sampled from the logo. THE hero color.
    text: "#F5F5F7",
    textDim: "#9C9CA3",
    inkText: "#0B0B0C",
    inkDim: "#5B6067",
    glow: "rgba(126, 252, 248, 0.45)",
    glass: "rgba(255, 255, 255, 0.07)",
    glassEdge: "rgba(255, 255, 255, 0.14)",
    warn: "#FF453A",
    ui: "#E9ECEF", // placeholder bars and dividers on light scenes
    uiStrong: "#CDD2D8",
    uiDark: "rgba(255, 255, 255, 0.16)", // placeholder bars on dark scenes
    festive: "#E1251B", // Singles' Day red
    gold: "#FFD23F",
    taobao: "#FF5000",
    go: "#22C55E", // check stamps
  },
  fonts: {
    display: "'Inter Tight', Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  // THE easing curves. Linear is forbidden.
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo — entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // easeInOutQuint — moves, Ken Burns
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
    cruise: Easing.bezier(0.45, 0, 0.55, 1), // long, readable travel (fly-bys)
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 }, // UI pops, words
    smooth: { damping: 20, stiffness: 90, mass: 1 }, // big elements
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 }, // playful accents, logos
    counter: { damping: 30, stiffness: 60, mass: 1 },
  },
} as const;
