import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, SHADOW } from "../../theme";
import { Banner, Logo, Outlined, Pop, PopText, SpeedLines, Sticker } from "../../components/core";
import { Sfx } from "../../components/Sfx";
import { Chip, FinePrint, FlipCalendar } from "../graphics";
import { R_COPY } from "../campaign";
import { R_PHASE } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FLIP_START = 52;
const FLIP_EVERY = 10; // 1..6 lands at FLIP_START + 50

const Plane: React.FC<{ delay: number; out: number }> = ({ delay, out }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  if (f < 0 || frame > out + 10) return null;
  const p = interpolate(f, [0, 26], [0, 1], { ...clamp, easing: EASE.out });
  const o = interpolate(frame, [out, out + 10], [0, 1], { ...clamp, easing: EASE.in });
  const x = interpolate(p, [0, 1], [-400, 820]) + 900 * o;
  const y = interpolate(p, [0, 1], [1500, 1000]) - 500 * o + 6 * Math.sin(f / 9);
  const blur = interpolate(f, [0, 14, 22], [10, 3, 0], clamp) + 10 * o;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 300, transform: "translate(-50%,-50%) rotate(-14deg)", filter: `${SHADOW.sticker} blur(${blur}px)` }}>
      <Img src={staticFile("reference-icons/airplane.png")} style={{ width: "100%" }} />
    </div>
  );
};

// 6-10 s: REASON 2 - your haul arrives in 6 days
export const R3SixDays: React.FC = () => {
  const frame = useCurrentFrame();
  const fine = interpolate(frame, [R_PHASE + 24, R_PHASE + 34], [0, 1], clamp);
  return (
    <>
      <Pop x={540} y={250} delay={2} from="top">
        <Chip text="REASON #2" />
      </Pop>
      <PopText text="YOUR HAUL" x={540} y={385} size={128} delay={4} stagger={2} color={C.white} rim={10} />
      <PopText text="ARRIVES" x={540} y={520} size={150} delay={12} stagger={2} color={C.red} rim={12} />

      {/* phase A: truck, plane, calendar flipping 1 -> 6 */}
      <SpeedLines x={600} y={650} w={500} h={240} delay={10} />
      <Sticker src="reference-icons/delivery-truck.png" x={520} y={770} w={560} delay={8} from="right" idle={0.5} out={R_PHASE - 6}>
        <div style={{ position: "absolute", left: "66%", top: "16%", transform: "skewY(5deg) rotate(2deg)" }}>
          <Logo w={130} backing={false} src="logos/pikobuy-logo-official.png" />
        </div>
      </Sticker>
      <Plane delay={24} out={R_PHASE - 8} />
      <Pop x={330} y={1200} delay={FLIP_START - 10} rot={-4} out={R_PHASE - 4} idle={0.4}>
        <FlipCalendar start={FLIP_START} to={6} every={FLIP_EVERY} w={330} />
      </Pop>

      {/* phase B: huge 6 */}
      <Pop x={540} y={660} delay={R_PHASE} rot={-4}>
        <Banner text="IN JUST" size={86} bg={C.black} color={C.white} />
      </Pop>
      <Pop x={500} y={1000} from="slam" delay={R_PHASE + 6} idle={0.5} pulse={0.05}>
        <Outlined text="6" size={640} color={C.red} extrude={C.black} rim={22} />
      </Pop>
      <Pop x={800} y={1150} from="slam" delay={R_PHASE + 16} rot={-6}>
        <Outlined text="DAYS!*" size={150} color={C.white} rim={10} />
      </Pop>
      <Sticker src="reference-icons/parcel-box.png" x={200} y={1400} w={230} delay={R_PHASE + 40} from="drop" rot={-6} />
      <Sticker src="reference-icons/checkmark.png" x={300} y={1300} w={120} delay={R_PHASE + 56} rot={10} />
      <FinePrint text={R_COPY.deliveryNote} y={1500} opacity={fine} />

      <Sfx at={2} name="whoosh-reverse" vol={0.4} />
      <Sfx at={4} name="pop" vol={0.45} />
      <Sfx at={8} name="truck" vol={0.75} />
      <Sfx at={24} name="airplane" vol={0.7} />
      <Sfx at={FLIP_START - 10} name="pop" vol={0.45} />
      {Array.from({ length: 6 }, (_, i) => (
        <React.Fragment key={i}>
          <Sfx at={FLIP_START + i * FLIP_EVERY} name="page-flip" vol={0.7} />
          <Sfx at={FLIP_START + i * FLIP_EVERY + 1} name={i % 2 ? "tock" : "tick"} vol={0.5} />
        </React.Fragment>
      ))}
      <Sfx at={R_PHASE - 2} name="riser" vol={0.35} />
      <Sfx at={R_PHASE} name="whoosh" vol={0.5} />
      <Sfx at={R_PHASE + 8} name="impact-cinematic" vol={0.85} />
      <Sfx at={R_PHASE + 18} name="impact" vol={0.5} />
      <Sfx at={R_PHASE + 42} name="whoosh-reverse" vol={0.35} />
      <Sfx at={R_PHASE + 48} name="doorbell" vol={0.65} />
      <Sfx at={R_PHASE + 56} name="checkmark" vol={0.5} />
    </>
  );
};
