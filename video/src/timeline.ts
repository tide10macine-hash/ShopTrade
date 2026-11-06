// Scene map (60 fps). All frame numbers derive from seconds here.
export const FPS = 60;
export const s = (sec: number) => Math.round(sec * FPS);

export const VIDEO = { fps: FPS, width: 1080, height: 1920, durationInFrames: s(20) };

export const WHIP = 9; // frames for a whip pan between scenes

export const SCENES = {
  mega: { from: s(0), dur: s(2) },
  prices: { from: s(2), dur: s(2) },
  shipping: { from: s(4), dur: s(2) },
  coupon: { from: s(6), dur: s(4) },
  why: { from: s(10), dur: s(3) },
  countdown: { from: s(13), dur: s(3) },
  final: { from: s(16), dur: s(4) },
};

// Impacts that shake the camera (global frames)
export const SHAKES: { at: number; amp: number }[] = [
  { at: 6, amp: 26 },
  { at: s(2) + 14, amp: 10 },
  { at: s(4) + 12, amp: 12 },
  { at: s(6) + 6, amp: 34 },
  { at: s(6) + 110 + 52, amp: 14 },
  { at: s(13) + 16, amp: 14 },
  { at: s(16) + 8, amp: 30 },
  { at: s(19), amp: 18 },
];
