import React, { createContext, useContext } from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";
import { voiceActivity } from "../voice";

export type SfxName =
  | "impact" | "impact-cinematic" | "riser" | "whoosh" | "whoosh-reverse" | "airplane" | "pop" | "pop-high"
  | "paper-rustle" | "cash-register" | "coins" | "truck" | "coupon-confirm" | "checkmark" | "tick" | "tock" | "stamp";

// master SFX bus gain (keeps the summed mix below 0 dBFS; final loudness is set in tools/finish.sh)
export const SFX_GAIN = 0.38;
// effects drop to this share of their level while the voice is speaking
const VOICE_DUCK = 0.45;

/** global frame at which the enclosing scene starts (so effects can duck under the voice) */
export const SceneStart = createContext(0);

/** One sound-effect layer, placed at a scene-local frame. */
export const Sfx: React.FC<{ at: number; name: SfxName; vol?: number }> = ({ at, name, vol = 0.8 }) => {
  const base = useContext(SceneStart);
  return (
    <Sequence from={at} layout="none" name={`sfx:${name}`}>
      <Html5Audio
        src={staticFile(`audio/sfx/${name}.wav`)}
        volume={(f) => vol * SFX_GAIN * (1 - (1 - VOICE_DUCK) * voiceActivity(base + at + f))}
      />
    </Sequence>
  );
};
