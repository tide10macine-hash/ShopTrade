import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "../theme";
import { useSec } from "../components/motion";
import { Cue, Soundtrack } from "../components/audio";
import { SINGLES_SCENE_ORDER, SINGLES_SCENE_SECONDS, SinglesSceneId, singlesSceneStart } from "./timeline";
import { CouponsSingles, CtaSingles, DealsSingles, HookSingles, PlatformsSingles, QuickSingles } from "./scenes";

export type SinglesAdProps = {
  // Path under public/. Music and SFX duck under it when set.
  voiceover: string | null;
};

const SCENES: Record<SinglesSceneId, React.FC> = {
  hook: HookSingles,
  deals: DealsSingles,
  platforms: PlatformsSingles,
  quick: QuickSingles,
  coupons: CouponsSingles,
  cta: CtaSingles,
};

// Absolute seconds. Scene starts: 0, 4.5, 8.5, 14, 17.5, 22.5.
const CUES: readonly Cue[] = [
  [0.0, "impact", 0.7],
  [0.25, "pop", 0.6],
  [0.6, "whoosh", 0.5],
  [1.0, "click", 0.4],
  [1.5, "click", 0.4],
  [2.0, "click", 0.4],
  [2.4, "impact", 0.6],
  [4.4, "whoosh", 0.45],
  [4.6, "pop", 0.5],
  [5.2, "whoosh", 0.5],
  [5.5, "whoosh", 0.4],
  [5.8, "whoosh", 0.4],
  [8.5, "impact", 0.5],
  [9.8, "pop", 0.6],
  [10.15, "impact", 0.45],
  [10.8, "pop", 0.6],
  [11.15, "impact", 0.45],
  [11.7, "pop", 0.6],
  [12.05, "impact", 0.45],
  [14.0, "whoosh", 0.45],
  [14.15, "riser", 0.4],
  [14.9, "impact", 0.8],
  [15.3, "pop", 0.5],
  [17.5, "whoosh", 0.45],
  [17.65, "pop", 0.5],
  [17.9, "whoosh", 0.5],
  [19.3, "click", 0.7],
  [19.7, "click", 0.7],
  [20.1, "impact", 0.6],
  [20.5, "shimmer", 0.45],
  [22.5, "whoosh", 0.4],
  [24.4, "whoosh", 0.7],
  [25.0, "impact", 0.8],
  [25.15, "shimmer", 0.5],
  [26.0, "pop", 0.55],
];

export const SinglesAd: React.FC<SinglesAdProps> = ({ voiceover }) => {
  const sec = useSec();
  return (
    <AbsoluteFill style={{ background: theme.colors.ink }}>
      {SINGLES_SCENE_ORDER.map((id) => {
        const Scene = SCENES[id];
        return (
          <Sequence key={id} from={sec(singlesSceneStart(id))} durationInFrames={sec(SINGLES_SCENE_SECONDS[id])} name={id}>
            <Scene />
          </Sequence>
        );
      })}
      <Soundtrack music="sfx/music-singles.wav" cues={CUES} voiceover={voiceover} />
    </AbsoluteFill>
  );
};
