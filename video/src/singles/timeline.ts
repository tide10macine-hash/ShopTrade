// Scene lengths in seconds, sized to the measured voiceover lines and snapped to
// the 0.5s beat grid. Mirrors SCRIPTS["singles"] in scripts/voiceover.py.
export const SINGLES_SCENE_SECONDS = {
  hook: 4.5,
  deals: 4,
  platforms: 5.5,
  quick: 3.5,
  coupons: 5,
  cta: 6.5,
} as const;

export type SinglesSceneId = keyof typeof SINGLES_SCENE_SECONDS;

export const SINGLES_SCENE_ORDER: readonly SinglesSceneId[] = ["hook", "deals", "platforms", "quick", "coupons", "cta"];

export const singlesSceneStart = (id: SinglesSceneId): number =>
  SINGLES_SCENE_ORDER.slice(0, SINGLES_SCENE_ORDER.indexOf(id)).reduce((acc, s) => acc + SINGLES_SCENE_SECONDS[s], 0);

export const SINGLES_TOTAL_SECONDS = SINGLES_SCENE_ORDER.reduce((acc, s) => acc + SINGLES_SCENE_SECONDS[s], 0);
