// Scene map (60 fps). All frame numbers derive from seconds here.
export const FPS = 60;
export const s = (sec: number) => Math.round(sec * FPS);

export const VIDEO = { fps: FPS, width: 1080, height: 1920, durationInFrames: s(22.5) };

export const WHIP = 9; // frames for a whip pan between scenes

// Every scene starts on a beat of the 120 BPM bed (0.5 s grid) and is timed to the voiceover.
export const SCENES = {
  mega: { from: s(0), dur: s(2.5) },
  prices: { from: s(2.5), dur: s(3) },
  shipping: { from: s(5.5), dur: s(3) },
  coupon: { from: s(8.5), dur: s(4.5) },
  why: { from: s(13), dur: s(2.5) },
  countdown: { from: s(15.5), dur: s(2.5) },
  final: { from: s(18), dur: s(4.5) },
};

export const END_HIT = 240; // final impact, frames into the final scene (22.0 s)

// Impacts that shake the camera (global frames)
export const SHAKES: { at: number; amp: number }[] = [
  { at: 6, amp: 26 },
  { at: SCENES.prices.from + 14, amp: 10 },
  { at: SCENES.shipping.from + 12, amp: 12 },
  { at: SCENES.coupon.from + 6, amp: 34 },
  { at: SCENES.coupon.from + 160 + 40, amp: 14 },
  { at: SCENES.countdown.from + 16, amp: 14 },
  { at: SCENES.final.from + 8, amp: 30 },
  { at: SCENES.final.from + END_HIT, amp: 18 },
];
