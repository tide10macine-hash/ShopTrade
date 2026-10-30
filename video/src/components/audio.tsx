import React from "react";
import { Html5Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { clamp, useSec } from "./motion";

export type Sfx = "whoosh" | "impact" | "pop" | "click" | "riser" | "shimmer";

// Absolute seconds. Each cue fires 2 frames early so it lands with the visual.
export type Cue = readonly [seconds: number, sfx: Sfx, volume: number];

export const Soundtrack: React.FC<{ music: string; cues: readonly Cue[]; voiceover: string | null }> = ({
  music,
  cues,
  voiceover,
}) => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const bed = voiceover ? 0.16 : 0.34;
  const sfxScale = voiceover ? 0.7 : 1;
  return (
    <>
      <Html5Audio
        src={staticFile(music)}
        volume={(f) =>
          interpolate(f, [0, sec(0.3), durationInFrames - sec(0.8), durationInFrames], [0, bed, bed, 0], clamp)
        }
      />
      {voiceover && <Html5Audio src={staticFile(voiceover)} volume={1} />}
      {cues.map(([seconds, sfx, volume]) => (
        <Sequence key={`${seconds}-${sfx}`} from={Math.max(0, sec(seconds) - 2)} durationInFrames={sec(1.6)}>
          <Html5Audio src={staticFile(`sfx/${sfx}.wav`)} volume={volume * sfxScale} />
        </Sequence>
      ))}
    </>
  );
};
