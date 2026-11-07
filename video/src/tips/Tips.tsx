import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { Camera, Finish, Fonts, Paper, SceneShell } from "../components/core";
import { DuckContext, SceneStart, Sfx } from "../components/Sfx";
import { makeVoiceActivity } from "../voice";
import { WHIP } from "../timeline";
import { Subtitles } from "./Captions";
import { SCENES, Tracker } from "./Mistakes";
import { SECTIONS, SHAKES, TE, W, sectionEnd } from "./timeline";

// voice activity from the word timings: music and effects duck while words are spoken
const voiceAct = makeVoiceActivity(W.map((w, i) => ({ clip: String(i), at: w.start, dur: w.end - w.start })));

// no background music in this video: the voice and sound effects carry it

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
      {SECTIONS.slice(1).map((s, i) => (
        <React.Fragment key={s.key}>
          <Sfx at={s.from - 5} name="whoosh" vol={0.55} />
          <Sfx at={s.from - 2} name="paper-rustle" vol={0.35} />
          {/* tracker ticks the previous mistake off */}
          {i > 0 && <Sfx at={s.from + 6} name="tick" vol={0.5} />}
        </React.Fragment>
      ))}
      <Sfx at={TE(W.length - 1) + 4} name="impact-cinematic" vol={0.55} />
    </DuckContext.Provider>
  </AbsoluteFill>
);
