import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";

export type SfxName =
  | "impact" | "impact-cinematic" | "riser" | "whoosh" | "whoosh-reverse" | "airplane" | "pop" | "pop-high"
  | "paper-rustle" | "cash-register" | "coins" | "truck" | "coupon-confirm" | "checkmark" | "tick" | "tock" | "stamp";

// master SFX bus gain (keeps the summed mix below 0 dBFS; final loudness is set in tools/finish.sh)
export const SFX_GAIN = 0.5;

/** One sound-effect layer, placed at a scene-local frame. */
export const Sfx: React.FC<{ at: number; name: SfxName; vol?: number }> = ({ at, name, vol = 0.8 }) => (
  <Sequence from={at} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={vol * SFX_GAIN} />
  </Sequence>
);
