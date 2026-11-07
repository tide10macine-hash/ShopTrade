import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { Camera, Finish, Fonts, Paper } from "../components/core";
import { DuckContext, SceneStart, Sfx } from "../components/Sfx";
import { makeVoiceActivity } from "../voice";
import { Subtitles } from "../tips/Captions";
import { SCENES, TornBand } from "./Scenes";
import { SECTIONS, SHAKES, W, sectionEnd } from "./timeline";

const voiceAct = makeVoiceActivity(W.map((w, i) => ({ clip: String(i), at: w.start, dur: w.end - w.start })));

/** PIKOBUY - "3 tips before shipping out" (paper collage, torn-paper band transitions, no music) */
export const ShipOut: React.FC<{ withVoice?: boolean }> = ({ withVoice = true }) => (
  <AbsoluteFill style={{ backgroundColor: "#f1f1f3" }}>
    <Fonts />
    <DuckContext.Provider value={voiceAct}>
      <Camera shakes={SHAKES}>
        <Paper />
        {SECTIONS.map((s, i) => {
          const C = SCENES[i];
          return (
            <Sequence key={s.key} from={s.from} durationInFrames={sectionEnd(i) - s.from} name={s.key}>
              <SceneStart.Provider value={s.from}>
                <C />
              </SceneStart.Provider>
            </Sequence>
          );
        })}
        <TornBand />
      </Camera>
      <Subtitles words={W} />
      <Finish />
      {withVoice && <Html5Audio src={staticFile("audio/voice-shipout/voice.wav")} />}
      {SECTIONS.slice(1, 4).map((s) => (
        <React.Fragment key={s.key}>
          <Sfx at={s.from - 8} name="paper-rustle" vol={0.6} />
          <Sfx at={s.from - 4} name="whoosh" vol={0.5} />
          <Sfx at={s.from + 10} name="impact" vol={0.4} />
          <Sfx at={s.from + 26} name="whoosh-reverse" vol={0.4} />
        </React.Fragment>
      ))}
    </DuckContext.Provider>
  </AbsoluteFill>
);
