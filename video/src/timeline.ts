export const FPS = 30;

// Scene lengths in seconds. Every cut lands on a beat of the 120 BPM bed.
export const SCENE_SECONDS = {
  hook: 3,
  shipping: 6,
  reveal: 5,
  offer: 7,
  cta: 4,
} as const;

export type SceneId = keyof typeof SCENE_SECONDS;

export const SCENE_ORDER: readonly SceneId[] = ["hook", "shipping", "reveal", "offer", "cta"];

export const sceneStart = (id: SceneId): number =>
  SCENE_ORDER.slice(0, SCENE_ORDER.indexOf(id)).reduce((acc, s) => acc + SCENE_SECONDS[s], 0);

export const TOTAL_SECONDS = SCENE_ORDER.reduce((acc, s) => acc + SCENE_SECONDS[s], 0);
