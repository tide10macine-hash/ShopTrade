import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from "remotion";
import { Camera, Finish, Fonts, Paper, SceneShell } from "../components/core";
import { DuckContext, SceneStart, Sfx } from "../components/Sfx";
import { makeVoiceActivity } from "../voice";
import { WHIP } from "../timeline";
import { Subtitles } from "./Captions";
import { SCENES, Tracker } from "./Mistakes";
import { DURATION, SECTIONS, SHAKES, W, sectionEnd } from "./timeline";

// voice activity from the word timings: music and effects duck while words are spoken
const voiceAct = makeVoiceActivity(W.map((w, i) => ({ clip: String(i), at: w.start, dur: w.end - w.start })));

const musicVolume = (f: number) => {
  const end = interpolate(f, [DURATION - 50, DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return 0.32 * (1 - 0.6 * voiceAct(f)) * end;
};

const DIRS = [null, "up", "left", "up", "left", "up"] as const;

/** PIKOBUY - "5 shipping mistakes" countdown (paper collage, 9:16, 60 fps) */
export const Tips: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#f1f1f3" }}>
    <Fonts />
    <DuckContext.Provider value={voiceAct}>
      <Camera shakes={SHAKES}>
        <Paper />
        {SECTIONS.map((s, i) => {
          const C = SCENES[i];
          const last = i === SECTIONS.length - 1;
          const dur = sectionEnd(i) - s.from;
          return (
            <Sequence key={s.key} from={s.from} durationInFrames={dur + (last ? 0 : WHIP)} name={s.key}>
              <SceneShell dur={dur} enter={DIRS[i]} exit={last ? null : DIRS[i + 1]}>
                <SceneStart.Provider value={s.from}>
                  <C />
                </SceneStart.Provider>
              </SceneShell>
            </Sequence>
          );
        })}
        <Tracker />
      </Camera>
      <Subtitles />
      <Finish />
      <Html5Audio src={staticFile("audio/voice-tips/voice.wav")} />
      <Html5Audio src={staticFile("audio/music/music-bed-tips-120bpm.wav")} volume={musicVolume} />
      {SECTIONS.slice(1).map((s) => (
        <Sfx key={s.key} at={s.from - 5} name="whoosh" vol={0.5} />
      ))}
      <Sfx at={DURATION - 50} name="impact" vol={0.4} />
    </DuckContext.Provider>
  </AbsoluteFill>
);
