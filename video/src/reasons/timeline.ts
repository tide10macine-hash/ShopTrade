import { s } from "../timeline";

// "3 Reasons" scene map (60 fps). Every scene starts on a beat of the 120 BPM bed.
export const R_VIDEO = { fps: 60, width: 1080, height: 1920, durationInFrames: s(18) };

export const R_SCENES = {
  hook: { from: s(0), dur: s(2) },
  reason1: { from: s(2), dur: s(4) },
  reason2: { from: s(6), dur: s(4) },
  reason3: { from: s(10), dur: s(4) },
  final: { from: s(14), dur: s(4) },
};

export const R_PHASE = 114; // second half of each 4 s reason scene
export const R_LOGO = 90; // frames into the final scene: logo slam (15.5 s, music drop)
export const R_END_HIT = 210; // final impact (17.5 s)

export const R_SHAKES = [
  { at: 4, amp: 26 },
  { at: R_SCENES.reason1.from + 8, amp: 10 },
  { at: R_SCENES.reason1.from + R_PHASE + 8, amp: 10 },
  { at: R_SCENES.reason2.from + R_PHASE + 12, amp: 30 },
  { at: R_SCENES.reason3.from + 6, amp: 34 },
  { at: R_SCENES.final.from + R_LOGO + 6, amp: 28 },
  { at: R_SCENES.final.from + R_END_HIT, amp: 16 },
];
