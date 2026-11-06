import React from "react";
import { Composition } from "remotion";
import { Pikobuy1111 } from "./Video";
import { FPS, H, TOTAL, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Pikobuy1111" component={Pikobuy1111} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
