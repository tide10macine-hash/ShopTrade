import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "../theme";
import { useSec } from "../components/motion";
import { Cue, Soundtrack } from "../components/audio";
import { COMPARE_SCENE_ORDER, COMPARE_SCENE_SECONDS, CompareSceneId, compareSceneStart } from "./timeline";
import { HookCompare } from "./scenes/HookCompare";
import { ShippingCompare } from "./scenes/ShippingCompare";
import { WarehouseCompare } from "./scenes/WarehouseCompare";
import { PricingCompare } from "./scenes/PricingCompare";
import { TableCompare } from "./scenes/TableCompare";
import { CtaCompare } from "./scenes/CtaCompare";

export type CompareAdProps = {
  // Path under public/. Music and SFX duck under it when set.
  voiceover: string | null;
};

const SCENES: Record<CompareSceneId, React.FC> = {
  hook: HookCompare,
  shipping: ShippingCompare,
  warehouse: WarehouseCompare,
  pricing: PricingCompare,
  table: TableCompare,
  cta: CtaCompare,
};

// Absolute seconds. Scene starts: 0, 6, 15.5, 22, 30.5, 34.
const CUES: readonly Cue[] = [
  [0.0, "impact", 0.7],
  [0.1, "whoosh", 0.4],
  [0.3, "pop", 0.4],
  [0.45, "pop", 0.4],
  [0.6, "pop", 0.4],
  [1.45, "pop", 0.6],
  [1.7, "pop", 0.6],
  [1.95, "pop", 0.6],
  [5.9, "whoosh", 0.4],
  [6.4, "pop", 0.4],
  [6.55, "pop", 0.4],
  [6.7, "pop", 0.4],
  [8.6, "click", 0.6],
  [9.0, "shimmer", 0.4],
  [11.6, "click", 0.6],
  [12.1, "pop", 0.45],
  [14.2, "click", 0.6],
  [14.7, "pop", 0.45],
  [15.5, "whoosh", 0.4],
  [15.7, "whoosh", 0.6],
  [16.5, "click", 0.6],
  [17.1, "pop", 0.55],
  [22.0, "whoosh", 0.4],
  [22.4, "pop", 0.5],
  [23.0, "whoosh", 0.45],
  [25.4, "pop", 0.55],
  [25.7, "click", 0.5],
  [28.3, "shimmer", 0.45],
  [30.5, "whoosh", 0.4],
  [30.8, "pop", 0.4],
  [31.9, "shimmer", 0.5],
  [34.0, "impact", 0.8],
  [34.5, "whoosh", 0.45],
  [35.1, "pop", 0.45],
  [36.6, "pop", 0.5],
];

export const CompareAd: React.FC<CompareAdProps> = ({ voiceover }) => {
  const sec = useSec();
  return (
    <AbsoluteFill style={{ background: theme.colors.ink }}>
      {COMPARE_SCENE_ORDER.map((id) => {
        const Scene = SCENES[id];
        return (
          <Sequence key={id} from={sec(compareSceneStart(id))} durationInFrames={sec(COMPARE_SCENE_SECONDS[id])} name={id}>
            <Scene />
          </Sequence>
        );
      })}
      <Soundtrack music="sfx/music-compare.wav" cues={CUES} voiceover={voiceover} />
    </AbsoluteFill>
  );
};
