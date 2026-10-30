import "./fonts";
import { Composition } from "remotion";
import { PikobuyAd, PikobuyAdProps } from "./PikobuyAd";
import { FPS, TOTAL_SECONDS } from "./timeline";
import { TipsAd, TipsAdProps } from "./tips/TipsAd";
import { TIPS_TOTAL_SECONDS } from "./tips/timeline";

const pikobuyProps: PikobuyAdProps = { voiceover: "vo/voiceover.wav" };
const tipsProps: TipsAdProps = { voiceover: "vo/tips.wav" };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PikobuyAd"
      component={PikobuyAd}
      durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={pikobuyProps}
    />
    <Composition
      id="ShippingTips"
      component={TipsAd}
      durationInFrames={Math.round(TIPS_TOTAL_SECONDS * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={tipsProps}
    />
  </>
);
