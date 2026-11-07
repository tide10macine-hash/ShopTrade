import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, EASE } from "../../theme";
import { Pop, PopText, Sticker, Outlined } from "../../components/core";
import { PriceTag, RoundBadge } from "../../components/graphics";
import { Sfx } from "../../components/Sfx";
import { Chip, Magnifier } from "../graphics";
import { R_COPY } from "../campaign";
import { R_PHASE } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** magnifier sweeps across the parcel, camera flashes on two "photos" */
const Inspect: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  if (f < 0 || f > 80) return null;
  const p = interpolate(f, [0, 60], [0, 1], { ...clamp, easing: EASE.inOut });
  const x = interpolate(p, [0, 0.5, 1], [330, 700, 470]);
  const y = interpolate(p, [0, 0.5, 1], [820, 900, 1010]);
  const op = interpolate(f, [0, 6, 70, 80], [0, 1, 1, 0], clamp);
  const flash = (at: number) => interpolate(f, [at, at + 1, at + 9], [0, 0.85, 0], clamp);
  return (
    <>
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(flash(22), flash(46)) * 0.6, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: x, top: y, transform: "translate(-30%,-30%) rotate(-8deg)", opacity: op }}>
        <Magnifier size={210} />
      </div>
    </>
  );
};

// 2-6 s: REASON 1 - free rehearsal + cheapest shipping prices
export const R2Rehearsal: React.FC = () => {
  const frame = useCurrentFrame();
  // phase A group (parcel + inspection) lifts and shrinks to make room for the price block
  const p = interpolate(frame, [R_PHASE - 4, R_PHASE + 10], [0, 1], { ...clamp, easing: EASE.inOut });
  return (
    <>
      <Pop x={540} y={250} delay={2} from="top" out={R_PHASE - 6}>
        <Chip text="REASON #1" />
      </Pop>
      <AbsoluteFill style={{ transform: `translateY(${-90 * p}px) scale(${1 - 0.18 * p})`, transformOrigin: "540px 500px" }}>
        <PopText text={R_COPY.reason1Top} x={540} y={420} size={230} delay={4} stagger={3} color={C.red} rim={14} />
        <PopText text={R_COPY.reason1Bottom} x={540} y={590} size={118} delay={14} stagger={2} color={C.white} rim={10} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${-250 * p}px, ${-60 * p}px) scale(${1 - 0.42 * p})`, transformOrigin: "540px 920px" }}>
        <Sticker src="reference-icons/parcel-box.png" x={540} y={920} w={430} delay={20} idle={0.5} />
        <Inspect start={32} />
        <Sticker src="reference-icons/checkmark.png" x={760} y={800} w={170} delay={92} rot={10} />
      </AbsoluteFill>
      <Pop x={830} y={760} delay={98} rot={12} pulse={0.05} out={R_PHASE - 4}>
        <RoundBadge d={230} top="IT'S" big="FREE" />
      </Pop>

      {/* phase B: cheapest shipping prices */}
      <Pop x={840} y={820} delay={R_PHASE + 10} rot={14} from="drop">
        <PriceTag w={200} text={"LOW\nCOST"} />
      </Pop>
      <Pop x={540} y={1110} from="slam" delay={R_PHASE + 2} rot={-2}>
        <Outlined text={R_COPY.reason1Price[0]} size={150} color={C.red} rim={12} />
      </Pop>
      <PopText text={R_COPY.reason1Price[1]} x={540} y={1250} size={82} delay={R_PHASE + 12} stagger={1} color={C.white} rim={8} />
      <Sticker src="reference-icons/zigzag-arrow.png" x={720} y={1460} w={360} delay={R_PHASE + 20} from="left" />
      <Sticker src="reference-icons/coin-stack.png" x={300} y={1470} w={230} delay={R_PHASE + 26} from="bottom" rot={-5} />
      <Sticker src="reference-icons/checkmark.png" x={960} y={1430} w={115} delay={R_PHASE + 40} rot={-10} />

      <Sfx at={2} name="whoosh-reverse" vol={0.4} />
      <Sfx at={6} name="impact" vol={0.6} />
      <Sfx at={20} name="pop" vol={0.6} />
      <Sfx at={20} name="paper-rustle" vol={0.5} />
      <Sfx at={32} name="whoosh" vol={0.35} />
      <Sfx at={54} name="camera-shutter" vol={0.8} />
      <Sfx at={78} name="camera-shutter" vol={0.8} />
      <Sfx at={92} name="checkmark" vol={0.6} />
      <Sfx at={98} name="pop-high" vol={0.6} />
      <Sfx at={R_PHASE} name="whoosh" vol={0.45} />
      <Sfx at={R_PHASE + 4} name="impact" vol={0.6} />
      <Sfx at={R_PHASE + 12} name="pop" vol={0.45} />
      <Sfx at={R_PHASE + 18} name="cash-register" vol={0.75} />
      <Sfx at={R_PHASE + 26} name="coins" vol={0.55} />
      <Sfx at={R_PHASE + 40} name="checkmark" vol={0.5} />
    </>
  );
};
