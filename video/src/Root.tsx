import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { VIDEO } from "./timeline";
import { Reasons } from "./reasons/Reasons";
import { R_VIDEO } from "./reasons/timeline";

export const Root: React.FC = () => (
  <>
  <Composition
    id="Pikobuy1111"
    component={Main}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
  <Composition
    id="Pikobuy3Reasons"
    component={Reasons}
    durationInFrames={R_VIDEO.durationInFrames}
    fps={R_VIDEO.fps}
    width={R_VIDEO.width}
    height={R_VIDEO.height}
  />
  </>
);
