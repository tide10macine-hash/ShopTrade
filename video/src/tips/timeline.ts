import WORDS from "../../assets/audio/voice-tips/words.json";

// "5 Shipping Mistakes" countdown. Everything is anchored to the voiceover's word timestamps
// (assets/audio/voice-tips/words.json, from tools/generate_tips_voice.mjs).
export const FPS = 60;
export type Word = { w: string; start: number; end: number };
export const W = WORDS as Word[];

/** global frame at which word i starts (optionally shifted by seconds) */
export const T = (i: number, shift = 0) => Math.round((W[i].start + shift) * FPS);
export const TE = (i: number) => Math.round(W[i].end * FPS);

export const DURATION = Math.round((W[W.length - 1].end + 1.8) * FPS);
export const T_VIDEO = { fps: FPS, width: 1080, height: 1920, durationInFrames: DURATION };

// Sections start a little before "Mistake ..." so the whip pan lands as the word begins.
export const SECTIONS = [
  { key: "hook", from: 0 },
  { key: "m5", from: T(17, -0.15), num: 5 },
  { key: "m4", from: T(30, -0.15), num: 4 },
  { key: "m3", from: T(48, -0.15), num: 3 },
  { key: "m2", from: T(62, -0.15), num: 2 },
  { key: "m1", from: T(75, -0.15), num: 1 },
] as const;

export const sectionEnd = (i: number) => (i + 1 < SECTIONS.length ? SECTIONS[i + 1].from : DURATION);

/** word i as a frame local to section k */
export const L = (k: number) => (i: number, shift = 0) => T(i, shift) - SECTIONS[k].from;

// moments where the camera shakes (global frames): mistake stamps, red X, the PIKOBUY slam
export const SHAKES = [
  { at: T(12), amp: 18 },
  ...[17, 30, 48, 62].map((i) => ({ at: T(i) + 4, amp: 14 })),
  { at: T(76) + 4, amp: 24 },
  { at: T(86) + 4, amp: 22 },
];
