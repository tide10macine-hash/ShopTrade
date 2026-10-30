import "./fonts";
import { Composition } from "remotion";
import { PikobuyAd, PikobuyAdProps } from "./PikobuyAd";
import { FPS, TOTAL_SECONDS } from "./timeline";

const defaultProps: PikobuyAdProps = { voiceover: "vo/voiceover.wav" };

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PikobuyAd"
    component={PikobuyAd}
    durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={defaultProps}
  />
);
