import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from "remotion";
import { Camera, Finish, Fonts, Paper, SceneShell } from "./components/core";
import { END_HIT, SCENES, WHIP } from "./timeline";
import { VOICE, VOICE_GAIN, voiceActivity } from "./voice";
import { S1Mega } from "./scenes/S1Mega";
import { S2Prices } from "./scenes/S2Prices";
import { S3Shipping } from "./scenes/S3Shipping";
import { S4Coupon } from "./scenes/S4Coupon";
import { S5Why } from "./scenes/S5Why";
import { S6Countdown } from "./scenes/S6Countdown";
import { S7Final } from "./scenes/S7Final";
import { SceneStart, Sfx } from "./components/Sfx";

const ORDER = [
  { key: "mega", C: S1Mega, enter: null, exit: "up" },
  { key: "prices", C: S2Prices, enter: "up", exit: "left" },
  { key: "shipping", C: S3Shipping, enter: "left", exit: "up" },
  { key: "coupon", C: S4Coupon, enter: "up", exit: "up" },
  { key: "why", C: S5Why, enter: "up", exit: "left" },
  { key: "countdown", C: S6Countdown, enter: "left", exit: "up" },
  { key: "final", C: S7Final, enter: "up", exit: null },
] as const;

// music ducks under the voice, and under the 80% reveal / logo slam / end hit so impacts punch through
const musicVolume = (f: number) => {
  const duck = (at: number) => interpolate(f, [at - 2, at + 4, at + 40], [1, 0.45, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hits = Math.min(duck(SCENES.coupon.from), duck(SCENES.final.from), duck(SCENES.final.from + END_HIT));
  return 0.34 * hits * (1 - 0.62 * voiceActivity(f));
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#f1f1f3" }}>
    <Fonts />
    <Camera>
      <Paper />
      {ORDER.map(({ key, C, enter, exit }) => {
        const sc = SCENES[key];
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
    {/* audio layers */}
    <Html5Audio src={staticFile("audio/music/music-bed-120bpm.wav")} volume={musicVolume} />
    {/* voiceover (ElevenLabs "Adam - Radio Announcer"), one layer per phrase */}
    {VOICE.map((v) => (
      <Sequence key={v.clip} from={Math.round(v.at * 60)} layout="none" name={`voice:${v.clip}`}>
        <Html5Audio src={staticFile(`audio/voice/${v.clip}.wav`)} volume={VOICE_GAIN} />
      </Sequence>
    ))}
    {ORDER.slice(1).map(({ key }) => (
      <Sfx key={key} at={SCENES[key].from - 5} name="whoosh" vol={0.5} />
    ))}
  </AbsoluteFill>
);
