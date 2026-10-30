import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "./theme";
import { useSec } from "./components/motion";
import { Cue, Soundtrack } from "./components/audio";
import { SCENE_ORDER, SCENE_SECONDS, SceneId, sceneStart } from "./timeline";
import { HookScene } from "./scenes/HookScene";
import { ShippingScene } from "./scenes/ShippingScene";
import { RevealScene } from "./scenes/RevealScene";
import { OfferScene } from "./scenes/OfferScene";
import { CtaScene } from "./scenes/CtaScene";

export type PikobuyAdProps = {
  // Path under public/, e.g. "vo.mp3". Music ducks under it when set.
  voiceover: string | null;
};

const SCENES: Record<SceneId, React.FC> = {
  hook: HookScene,
  shipping: ShippingScene,
  reveal: RevealScene,
  offer: OfferScene,
  cta: CtaScene,
};

// Absolute seconds.
const CUES: readonly Cue[] = [
  [0.0, "pop", 0.7],
  [0.5, "whoosh", 0.5],
  [1.75, "click", 0.5],
  [3.0, "impact", 0.6],
  [3.7, "whoosh", 0.8],
  [4.35, "impact", 0.8],
  [5.0, "pop", 0.8],
  [5.6, "click", 0.6],
  [6.7, "pop", 0.45],
  [6.85, "pop", 0.45],
  [7.0, "pop", 0.45],
  [7.95, "riser", 0.6],
  [9.0, "impact", 0.9],
  [9.15, "shimmer", 0.5],
  [9.85, "whoosh", 0.45],
  [11.0, "pop", 0.45],
  [11.25, "pop", 0.45],
  [11.5, "pop", 0.45],
  [14.0, "whoosh", 0.45],
  [14.3, "whoosh", 0.8],
  [14.6, "impact", 0.55],
  [15.5, "pop", 0.55],
  [15.8, "pop", 0.55],
  [16.8, "whoosh", 0.45],
  [21.0, "impact", 0.9],
  [21.65, "whoosh", 0.5],
  [22.3, "pop", 0.55],
  [23.0, "shimmer", 0.55],
];

export const PikobuyAd: React.FC<PikobuyAdProps> = ({ voiceover }) => {
  const sec = useSec();
  return (
    <AbsoluteFill style={{ background: theme.colors.ink }}>
      {SCENE_ORDER.map((id) => {
        const Scene = SCENES[id];
        return (
          <Sequence key={id} from={sec(sceneStart(id))} durationInFrames={sec(SCENE_SECONDS[id])} name={id}>
            <Scene />
          </Sequence>
        );
      })}
      <Soundtrack music="sfx/music.wav" cues={CUES} voiceover={voiceover} />
    </AbsoluteFill>
  );
};
