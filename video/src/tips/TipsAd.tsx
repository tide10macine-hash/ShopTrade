import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "../theme";
import { useSec } from "../components/motion";
import { Cue, Soundtrack } from "../components/audio";
import { TIPS_SCENE_ORDER, TIPS_SCENE_SECONDS, TipsSceneId, tipsSceneStart } from "./timeline";
import { HookTip } from "./scenes/HookTip";
import { VacuumTip } from "./scenes/VacuumTip";
import { BoxesTip } from "./scenes/BoxesTip";
import { LinesTip } from "./scenes/LinesTip";
import { CouponsTip } from "./scenes/CouponsTip";
import { RehearsalTip } from "./scenes/RehearsalTip";
import { OfferTip } from "./scenes/OfferTip";
import { CtaTip } from "./scenes/CtaTip";

export type TipsAdProps = {
  // Path under public/. Music and SFX duck under it when set.
  voiceover: string | null;
};

const SCENES: Record<TipsSceneId, React.FC> = {
  hook: HookTip,
  vacuum: VacuumTip,
  boxes: BoxesTip,
  lines: LinesTip,
  coupons: CouponsTip,
  rehearsal: RehearsalTip,
  offer: OfferTip,
  cta: CtaTip,
};

// Absolute seconds. Scene starts: 0, 3, 6.5, 10, 13, 16, 21, 26.5.
const CUES: readonly Cue[] = [
  [0.0, "impact", 0.7],
  [0.15, "whoosh", 0.4],
  [0.5, "pop", 0.6],
  [1.6, "whoosh", 0.35],
  [2.85, "whoosh", 0.5],
  [3.2, "pop", 0.5],
  [3.9, "whoosh", 0.5],
  [4.8, "pop", 0.5],
  [5.1, "pop", 0.5],
  [6.5, "whoosh", 0.45],
  [7.3, "click", 0.6],
  [7.6, "whoosh", 0.4],
  [8.7, "pop", 0.55],
  [10.15, "whoosh", 0.7],
  [11.6, "pop", 0.6],
  [13.0, "whoosh", 0.45],
  [14.0, "whoosh", 0.45],
  [14.45, "shimmer", 0.5],
  [16.0, "whoosh", 0.4],
  [16.4, "impact", 0.5],
  [17.4, "click", 0.4],
  [18.3, "click", 0.8],
  [19.6, "whoosh", 0.4],
  [20.0, "pop", 0.55],
  [21.0, "impact", 0.8],
  [21.6, "click", 0.4],
  [22.6, "pop", 0.5],
  [26.5, "whoosh", 0.45],
  [27.15, "pop", 0.5],
  [27.4, "shimmer", 0.5],
];

export const TipsAd: React.FC<TipsAdProps> = ({ voiceover }) => {
  const sec = useSec();
  return (
    <AbsoluteFill style={{ background: theme.colors.ink }}>
      {TIPS_SCENE_ORDER.map((id) => {
        const Scene = SCENES[id];
        return (
          <Sequence key={id} from={sec(tipsSceneStart(id))} durationInFrames={sec(TIPS_SCENE_SECONDS[id])} name={id}>
            <Scene />
          </Sequence>
        );
      })}
      <Soundtrack music="sfx/music-tips.wav" cues={CUES} voiceover={voiceover} />
    </AbsoluteFill>
  );
};
