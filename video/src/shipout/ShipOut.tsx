import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { Camera, Finish, Fonts, Paper } from "../components/core";
import { DuckContext, SceneStart, Sfx } from "../components/Sfx";
import { makeVoiceActivity } from "../voice";
import { Subtitles } from "../tips/Captions";
import { SCENES, TornBand } from "./Scenes";
import { PUNCHES, SECTIONS, SHAKES, W, sectionEnd } from "./timeline";
import { useCurrentFrame } from "remotion";

const voiceAct = makeVoiceActivity(W.map((w, i) => ({ clip: String(i), at: w.start, dur: w.end - w.start })));

/** brief zoom-in punches on key words (scales the whole camera layer) */
const Punch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  let s = 1;
  for (const [at, k] of PUNCHES) {
    const d = f - at;
    if (d >= 0 && d < 24) s += k * Math.exp(-d / 5) * Math.min(1, d / 2);
  }
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

/** PIKOBUY - "3 tips before shipping out" (paper collage, torn-paper band transitions, no music) */
export const ShipOut: React.FC<{ withVoice?: boolean }> = ({ withVoice = true }) => (
  <AbsoluteFill style={{ backgroundColor: "#f1f1f3" }}>
    <Fonts />
    <DuckContext.Provider value={voiceAct}>
      <Camera shakes={SHAKES}>
        <Paper />
        <Punch>
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
        </Punch>
        <TornBand />
      </Camera>
      <Subtitles words={W} />
      <Finish />
      {withVoice && <Html5Audio src={staticFile("audio/voice-shipout/voice.wav")} />}
      {SECTIONS.slice(1, 4).map((s) => (
        <React.Fragment key={s.key}>
          <Sfx at={s.from - 8} name="paper-tear" vol={0.7} />
          <Sfx at={s.from + 8} name="kick-boom" vol={0.55} />
          <Sfx at={s.from + 26} name="paper-tear" vol={0.35} />
        </React.Fragment>
      ))}
    </DuckContext.Provider>
  </AbsoluteFill>
);
