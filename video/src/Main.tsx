import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from "remotion";
import { Camera, Finish, Fonts, Paper, SceneShell } from "./components/core";
import { SCENES, WHIP, s } from "./timeline";
import { S1Mega } from "./scenes/S1Mega";
import { S2Prices } from "./scenes/S2Prices";
import { S3Shipping } from "./scenes/S3Shipping";
import { S4Coupon } from "./scenes/S4Coupon";
import { S5Why } from "./scenes/S5Why";
import { S6Countdown } from "./scenes/S6Countdown";
import { S7Final } from "./scenes/S7Final";
import { Sfx } from "./components/Sfx";

const ORDER = [
  { key: "mega", C: S1Mega, enter: null, exit: "up" },
  { key: "prices", C: S2Prices, enter: "up", exit: "left" },
  { key: "shipping", C: S3Shipping, enter: "left", exit: "up" },
  { key: "coupon", C: S4Coupon, enter: "up", exit: "up" },
  { key: "why", C: S5Why, enter: "up", exit: "left" },
  { key: "countdown", C: S6Countdown, enter: "left", exit: "up" },
  { key: "final", C: S7Final, enter: "up", exit: null },
] as const;

// music ducks under the 80% reveal and the final logo slam so the impacts punch through
const musicVolume = (f: number) => {
  const duck = (at: number) => interpolate(f, [at - 2, at + 4, at + 40], [1, 0.45, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return 0.36 * Math.min(duck(s(6)), duck(s(16)), duck(s(19)));
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
              <C />
            </SceneShell>
          </Sequence>
        );
      })}
    </Camera>
    <Finish />
    {/* audio layers */}
    <Html5Audio src={staticFile("audio/music/music-bed-120bpm.wav")} volume={musicVolume} />
    {ORDER.slice(1).map(({ key }) => (
      <Sfx key={key} at={SCENES[key].from - 5} name="whoosh" vol={0.5} />
    ))}
  </AbsoluteFill>
);
