// Scene lengths in seconds, sized to the measured voiceover lines and snapped to
// the 0.5s beat grid of the 120 BPM bed. Mirrors SCRIPTS["tips"] in scripts/voiceover.py.
export const TIPS_SCENE_SECONDS = {
  hook: 3,
  vacuum: 3.5,
  boxes: 3.5,
  lines: 3,
  coupons: 3,
  rehearsal: 5,
  offer: 5.5,
  cta: 3.5,
} as const;

export type TipsSceneId = keyof typeof TIPS_SCENE_SECONDS;

export const TIPS_SCENE_ORDER: readonly TipsSceneId[] = [
  "hook",
  "vacuum",
  "boxes",
  "lines",
  "coupons",
  "rehearsal",
  "offer",
  "cta",
];

export const tipsSceneStart = (id: TipsSceneId): number =>
  TIPS_SCENE_ORDER.slice(0, TIPS_SCENE_ORDER.indexOf(id)).reduce((acc, s) => acc + TIPS_SCENE_SECONDS[s], 0);

export const TIPS_TOTAL_SECONDS = TIPS_SCENE_ORDER.reduce((acc, s) => acc + TIPS_SCENE_SECONDS[s], 0);
