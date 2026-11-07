import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from "remotion";
import { Camera, Finish, Fonts, Paper, SceneShell } from "../components/core";
import { DuckContext, SceneStart, Sfx } from "../components/Sfx";
import { R_VOICE, R_VOICE_GAIN, rVoiceActivity } from "./voice";
import { WHIP } from "../timeline";
import { R_END_HIT, R_LOGO, R_SCENES, R_SHAKES } from "./timeline";
import { R1Hook } from "./scenes/R1Hook";
import { R2Rehearsal } from "./scenes/R2Rehearsal";
import { R3SixDays } from "./scenes/R3SixDays";
import { R4Coupons } from "./scenes/R4Coupons";
import { R5Final } from "./scenes/R5Final";

const ORDER = [
  { key: "hook", C: R1Hook, enter: null, exit: "up" },
  { key: "reason1", C: R2Rehearsal, enter: "up", exit: "left" },
  { key: "reason2", C: R3SixDays, enter: "left", exit: "up" },
  { key: "reason3", C: R4Coupons, enter: "up", exit: "left" },
  { key: "final", C: R5Final, enter: "left", exit: null },
] as const;

// music ducks briefly under the big hits so they punch through
const musicVolume = (f: number) => {
  const duck = (at: number) => interpolate(f, [at - 2, at + 4, at + 40], [1, 0.45, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fin = R_SCENES.final.from;
  const hits = Math.min(duck(R_SCENES.reason3.from), duck(R_SCENES.reason2.from + 120), duck(fin + R_LOGO), duck(fin + R_END_HIT));
  return 0.38 * hits * (1 - 0.62 * rVoiceActivity(f));
};

/** PIKOBUY - 3 Reasons to shop (18 s, 9:16, 60 fps) */
export const Reasons: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#f1f1f3" }}>
    <Fonts />
    <DuckContext.Provider value={rVoiceActivity}>
    <Camera shakes={R_SHAKES}>
      <Paper />
      {ORDER.map(({ key, C, enter, exit }) => {
        const sc = R_SCENES[key];
        return (
          <Sequence key={key} from={sc.from} durationInFrames={sc.dur + (exit ? WHIP : 0)} name={key}>
            <SceneShell dur={sc.dur} enter={enter} exit={exit}>
              <SceneStart.Provider value={sc.from}>
                <C />
              </SceneStart.Provider>
            </SceneShell>
          </Sequence>
        );
      })}
    </Camera>
    <Finish />
    <Html5Audio src={staticFile("audio/music/music-bed-3reasons-120bpm.wav")} volume={musicVolume} />
    {/* voiceover, one layer per phrase */}
    {R_VOICE.map((v) => (
      <Sequence key={v.clip} from={Math.round(v.at * 60)} layout="none" name={`voice:${v.clip}`}>
        <Html5Audio src={staticFile(`audio/voice-3reasons/${v.clip}.wav`)} volume={R_VOICE_GAIN} />
      </Sequence>
    ))}
    {ORDER.slice(1).map(({ key }) => (
      <Sfx key={key} at={R_SCENES[key].from - 5} name="whoosh" vol={0.55} />
    ))}
    </DuckContext.Provider>
  </AbsoluteFill>
);
