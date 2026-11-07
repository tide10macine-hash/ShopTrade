import WORDS from "../../assets/audio/voice-tips/words.json";

// "5 Tips" explainer. Everything is anchored to the voiceover's word timestamps
// (assets/audio/voice-tips/words.json, from tools/generate_tips_voice.mjs).
export const FPS = 60;
export type Word = { w: string; start: number; end: number };
export const W = WORDS as Word[];

/** frame at which word i starts (optionally shifted by seconds) */
export const T = (i: number, shift = 0) => Math.round((W[i].start + shift) * FPS);
export const TE = (i: number) => Math.round(W[i].end * FPS);

export const VOICE_DELAY = 0; // voice starts on frame 0: the hook is the first spoken word
export const DURATION = Math.round((W[W.length - 1].end + 1.6) * FPS);
export const T_VIDEO = { fps: FPS, width: 1080, height: 1920, durationInFrames: DURATION };

// Sections: background colour + accent; each starts on the "Number" word (with a 6-frame lead for the glitch)
export type Theme = { name: string; glow: string; mid: string; edge: string; accent: string };
export const THEMES: Record<string, Theme> = {
  blue: { name: "blue", glow: "#1f5bff", mid: "#0b2a8a", edge: "#03081f", accent: "#6fd8ff" },
  green: { name: "green", glow: "#1fd25a", mid: "#0b6a26", edge: "#021508", accent: "#6dff98" },
  orange: { name: "orange", glow: "#ff7a1a", mid: "#8a3208", edge: "#1c0702", accent: "#ffbd4a" },
  red: { name: "red", glow: "#ff2a2a", mid: "#8a0a10", edge: "#1c0204", accent: "#ff6b6b" },
};

export const SECTIONS = [
  { key: "intro", from: 0, theme: THEMES.blue },
  { key: "tip1", from: T(16, -0.1), theme: THEMES.green, num: 1 },
  { key: "tip2", from: T(34, -0.1), theme: THEMES.blue, num: 2 },
  { key: "tip3", from: T(45, -0.1), theme: THEMES.orange, num: 3 },
  { key: "tip4", from: T(65, -0.1), theme: THEMES.red, num: 4 },
  { key: "tip5", from: T(81, -0.1), theme: THEMES.blue, num: 5 },
  { key: "recap", from: T(93, -0.1), theme: THEMES.orange },
  { key: "plug", from: T(105, -0.1), theme: THEMES.green },
] as const;

export const sectionAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < SECTIONS.length; k++) if (f >= SECTIONS[k].from) i = k;
  return i;
};
export const sectionEnd = (i: number) => (i + 1 < SECTIONS.length ? SECTIONS[i + 1].from : DURATION);

// Caption blocks: [lead words] [KEY words] [tail words] as word-index ranges (inclusive). keyText overrides display.
export type Block = { lead?: [number, number]; key?: [number, number]; tail?: [number, number]; keyText?: string };
export const BLOCKS: Block[] = [
  { lead: [0, 7], key: [8, 9] },
  { lead: [10, 12], key: [13, 15] },
  { lead: [16, 17], key: [18, 21] },
  { lead: [22, 23], key: [24, 25], tail: [26, 33] },
  { lead: [34, 35], key: [36, 38] },
  { key: [39, 42], tail: [43, 44] },
  { lead: [45, 46], key: [47, 51] },
  { lead: [52, 55], key: [56, 56] },
  { lead: [57, 62], key: [63, 64] },
  { lead: [65, 66], key: [67, 69] },
  { lead: [70, 75], key: [76, 80] },
  { lead: [81, 82], key: [83, 85] },
  { lead: [86, 89], key: [90, 92] },
  { lead: [93, 96], key: [97, 99] },
  { lead: [100, 101], key: [102, 104] },
  { lead: [105, 112], key: [113, 113], tail: [114, 117], keyText: "PIKOBUY" },
  { lead: [118, 120], key: [121, 123], tail: [124, 125], keyText: "2× 40%" },
  { lead: [126, 128], key: [129, 132] },
];
export const blockStart = (b: Block) => Math.min(...[b.lead?.[0], b.key?.[0], b.tail?.[0]].filter((x): x is number => x !== undefined));
