import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence } from "remotion";
import "./components/fonts";
import { asset } from "./components/Graphics";
import { Finish, Paper } from "./components/Layers";
import { S1Hook } from "./scenes/S1Hook";
import { S2Prices } from "./scenes/S2Prices";
import { S3Shipping } from "./scenes/S3Shipping";
import { S4Coupon } from "./scenes/S4Coupon";
import { S5Collage } from "./scenes/S5Collage";
import { S6Countdown } from "./scenes/S6Countdown";
import { S7Endcard } from "./scenes/S7Endcard";
import { MIX, SCENES } from "./theme";

const ORDER: [keyof typeof SCENES, React.FC][] = [
  ["hook", S1Hook],
  ["prices", S2Prices],
  ["shipping", S3Shipping],
  ["coupon", S4Coupon],
  ["collage", S5Collage],
  ["countdown", S6Countdown],
  ["endcard", S7Endcard],
];

/** Music bed volume: sits under the SFX, ducks for the 80% reveal and the final impact. */
const musicVol = (f: number) =>
  interpolate(f, [0, 360, 368, 420, 1150, 1200], [0.32, 0.32, 0.16, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const Pikobuy1111: React.FC = () => (
  <AbsoluteFill style={{ background: "#ECECEE" }}>
    <Paper />
    {ORDER.map(([k, Comp]) => (
      <Sequence key={k} from={SCENES[k].from} durationInFrames={SCENES[k].dur} name={k}>
        <Comp />
      </Sequence>
    ))}
    <Finish />
    <Html5Audio src={asset("audio/music-bed.wav")} volume={(f) => musicVol(f) * MIX.music} />
  </AbsoluteFill>
);
