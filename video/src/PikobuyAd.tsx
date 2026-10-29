import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { theme } from "./theme";
import { clamp, useSec } from "./components/motion";
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

type Sfx = "whoosh" | "impact" | "pop" | "click" | "riser" | "shimmer";

// Absolute seconds. Each cue fires 2 frames early so it lands with the visual.
const CUES: ReadonlyArray<readonly [seconds: number, sfx: Sfx, volume: number]> = [
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

const Soundtrack: React.FC<{ voiceover: string | null }> = ({ voiceover }) => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const bed = voiceover ? 0.16 : 0.34;
  return (
    <>
      <Html5Audio
        src={staticFile("sfx/music.wav")}
        volume={(f) =>
          interpolate(f, [0, sec(0.3), durationInFrames - sec(0.8), durationInFrames], [0, bed, bed, 0], clamp)
        }
      />
      {voiceover && <Html5Audio src={staticFile(voiceover)} volume={1} />}
      {CUES.map(([seconds, sfx, volume]) => (
        <Sequence key={`${seconds}-${sfx}`} from={Math.max(0, sec(seconds) - 2)} durationInFrames={sec(1.6)}>
          <Html5Audio src={staticFile(`sfx/${sfx}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
};

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
      <Soundtrack voiceover={voiceover} />
    </AbsoluteFill>
  );
};
