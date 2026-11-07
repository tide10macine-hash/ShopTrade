import WORDS from "../../assets/audio/voice-shipout/words.json";
import { FPS, Word } from "../tips/timeline";

// "3 tips before shipping out": anchored to the voiceover's word timestamps
// (assets/audio/voice-shipout/words.json). Until the real take exists this file holds an
// estimate from tools/estimate_words.py; the real timings re-time everything automatically.
export const W = WORDS as Word[];
export const T = (i: number, shift = 0) => Math.round((W[i].start + shift) * FPS);
export const TE = (i: number) => Math.round(W[i].end * FPS);

const LAST = W.length - 1;
export const END_CARD = TE(LAST) + 18;
export const DURATION = END_CARD + Math.round(2.2 * FPS);
export const S_VIDEO = { fps: FPS, width: 1080, height: 1920, durationInFrames: DURATION };

// each tip starts with the torn-paper band a little before "Tip ..."
export const SECTIONS = [
  { key: "hook", from: 0 },
  { key: "tip1", from: T(10, -0.35), num: 1 },
  { key: "tip2", from: T(27, -0.35), num: 2 },
  { key: "tip3", from: T(45, -0.35), num: 3 },
  { key: "end", from: END_CARD },
] as const;
export const sectionEnd = (i: number) => (i + 1 < SECTIONS.length ? SECTIONS[i + 1].from : DURATION);
export const L = (k: number) => (i: number, shift = 0) => T(i, shift) - SECTIONS[k].from;

export const SHAKES = [
  { at: T(0) + 4, amp: 22 },
  ...[1, 2, 3].map((k) => ({ at: SECTIONS[k].from + 16, amp: 18 })),
  { at: T(16) + 4, amp: 16 },
  { at: T(55) + 6, amp: 14 },
  { at: END_CARD + 4, amp: 24 },
];

// quick zoom punches on key words (global frame, strength)
export const PUNCHES: [number, number][] = [
  [T(0), 0.06], [T(9), 0.04], [T(16), 0.06], [T(21), 0.035], [T(30), 0.04], [T(34), 0.05],
  [T(41), 0.04], [T(52), 0.04], [T(53), 0.05], [T(55), 0.05], [END_CARD, 0.06],
];
