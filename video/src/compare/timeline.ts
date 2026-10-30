// Scene lengths in seconds, sized to the measured voiceover lines and snapped to
// the 0.5s beat grid. Mirrors SCRIPTS["compare"] in scripts/voiceover.py.
export const COMPARE_SCENE_SECONDS = {
  hook: 6,
  shipping: 6.5,
  warehouse: 5.5,
  pricing: 7.5,
  table: 3.5,
  cta: 5,
} as const;

export type CompareSceneId = keyof typeof COMPARE_SCENE_SECONDS;

export const COMPARE_SCENE_ORDER: readonly CompareSceneId[] = ["hook", "shipping", "warehouse", "pricing", "table", "cta"];

export const compareSceneStart = (id: CompareSceneId): number =>
  COMPARE_SCENE_ORDER.slice(0, COMPARE_SCENE_ORDER.indexOf(id)).reduce((acc, s) => acc + COMPARE_SCENE_SECONDS[s], 0);

export const COMPARE_TOTAL_SECONDS = COMPARE_SCENE_ORDER.reduce((acc, s) => acc + COMPARE_SCENE_SECONDS[s], 0);
