import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { VIDEO } from "./timeline";

export const Root: React.FC = () => (
  <Composition
    id="Pikobuy1111"
    component={Main}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
