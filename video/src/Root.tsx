import "./fonts";
import { Composition } from "remotion";
import { PikobuyAd, PikobuyAdProps } from "./PikobuyAd";
import { FPS, TOTAL_SECONDS } from "./timeline";
import { TipsAd, TipsAdProps } from "./tips/TipsAd";
import { TIPS_TOTAL_SECONDS } from "./tips/timeline";
import { CompareAd, CompareAdProps } from "./compare/CompareAd";
import { COMPARE_TOTAL_SECONDS } from "./compare/timeline";
import { SinglesAd, SinglesAdProps } from "./singles/SinglesAd";
import { SINGLES_TOTAL_SECONDS } from "./singles/timeline";

const pikobuyProps: PikobuyAdProps = { voiceover: "vo/voiceover.wav" };
const tipsProps: TipsAdProps = { voiceover: "vo/tips.wav" };
const compareProps: CompareAdProps = { voiceover: "vo/compare.wav" };
const singlesProps: SinglesAdProps = { voiceover: "vo/singles.wav" };

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
    <Composition
      id="AgentCompare"
      component={CompareAd}
      durationInFrames={Math.round(COMPARE_TOTAL_SECONDS * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={compareProps}
    />
    <Composition
      id="SinglesDay"
      component={SinglesAd}
      durationInFrames={Math.round(SINGLES_TOTAL_SECONDS * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={singlesProps}
    />
  </>
);
