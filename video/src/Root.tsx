import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { VIDEO } from "./timeline";
import { Reasons } from "./reasons/Reasons";
import { R_VIDEO } from "./reasons/timeline";
import { Tips } from "./tips/Tips";
import { T_VIDEO } from "./tips/timeline";
import { Together } from "./together/Together";
import { G_VIDEO } from "./together/timeline";

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
  <Composition
    id="Pikobuy5Mistakes"
    component={Tips}
    durationInFrames={T_VIDEO.durationInFrames}
    fps={T_VIDEO.fps}
    width={T_VIDEO.width}
    height={T_VIDEO.height}
  />
  <Composition
    id="PikobuyDontShipTogether"
    component={Together}
    durationInFrames={G_VIDEO.durationInFrames}
    fps={G_VIDEO.fps}
    width={G_VIDEO.width}
    height={G_VIDEO.height}
  />
  </>
);
