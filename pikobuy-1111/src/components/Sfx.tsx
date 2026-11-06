import React from "react";
import { Html5Audio, Sequence } from "remotion";
import { asset } from "./Graphics";

/** One sound effect, placed on its own layer at a scene-local frame. Fire 2-3 frames before the visual lands. */
export const Sfx: React.FC<{ at: number; name: string; vol?: number }> = ({ at, name, vol = 1 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={180} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={asset(`audio/${name}.wav`)} volume={vol} />
  </Sequence>
);
