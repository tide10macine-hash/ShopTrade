import WORDS from "../../assets/audio/voice-together/words.json";
import { FPS, Word } from "../tips/timeline";

// "Don't ship these items together": anchored to the voiceover's word timestamps
// (assets/audio/voice-together/words.json, from tools/generate_tips_voice.mjs).
export const W = WORDS as Word[];
export const T = (i: number, shift = 0) => Math.round((W[i].start + shift) * FPS);
export const TE = (i: number) => Math.round(W[i].end * FPS);

export const DURATION = Math.round((W[W.length - 1].end + 1.6) * FPS);
export const G_VIDEO = { fps: FPS, width: 1080, height: 1920, durationInFrames: DURATION };

export const SECTIONS = [
  { key: "hook", from: 0 },
  { key: "electronics", from: T(8, -0.15), num: 1 },
  { key: "perfumes", from: T(25, -0.15), num: 2 },
  { key: "powerbanks", from: T(38, -0.15), num: 3 },
  { key: "plug", from: T(48, -0.15) },
] as const;

export const sectionEnd = (i: number) => (i + 1 < SECTIONS.length ? SECTIONS[i + 1].from : DURATION);
/** word i as a frame local to section k */
export const L = (k: number) => (i: number, shift = 0) => T(i, shift) - SECTIONS[k].from;

export const SHAKES = [
  { at: T(0) + 4, amp: 20 },
  { at: T(9) + 4, amp: 14 },
  { at: T(26) + 4, amp: 14 },
  { at: T(40) + 4, amp: 14 },
  { at: T(51) + 4, amp: 22 },
];
