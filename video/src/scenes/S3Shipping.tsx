import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, EASE, SHADOW } from "../theme";
import { Logo, PopText, PunchWords, SpeedLines, Sticker } from "../components/core";
import { Sfx } from "../components/Sfx";
import { Img, staticFile } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Plane: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  if (f < 0) return null;
  const p = interpolate(f, [0, 24], [0, 1], { ...clamp, easing: EASE.out });
  const x = interpolate(p, [0, 1], [-420, 800]);
  const y = interpolate(p, [0, 1], [1700, 1170]) + 6 * Math.sin(f / 9);
  const r = interpolate(p, [0, 1], [-38, -14]);
  const blur = interpolate(f, [0, 12, 20], [10, 4, 0], clamp);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: 330,
        transform: `translate(-50%,-50%) rotate(${r}deg)`, filter: `${SHADOW.sticker} blur(${blur}px)`,
      }}
    >
      <Img src={staticFile("reference-icons/airplane.png")} style={{ width: "100%" }} />
    </div>
  );
};

// 4-6s: FASTEST SHIPPING
export const S3Shipping: React.FC = () => (
  <>
    <PopText text="FASTEST" x={540} y={320} size={132} delay={4} stagger={2} color={C.red} rim={10} />
    <PopText text="SHIPPING!" x={540} y={460} size={132} delay={12} stagger={2} color={C.red} rim={10} />
    <SpeedLines x={560} y={700} w={560} h={260} delay={6} />
    <Sticker src="reference-icons/delivery-truck.png" x={520} y={830} w={660} delay={6} from="right" idle={0.6}>
      {/* official logo placed on the cargo-box side panel */}
      <div style={{ position: "absolute", left: "66%", top: "16%", transform: "skewY(5deg) rotate(2deg)" }}>
        <Logo w={150} backing={false} />
      </div>
    </Sticker>
    <Sticker src="reference-icons/checkmark.png" x={900} y={620} w={150} delay={46} rot={8} z={3} />
    <SpeedLines x={-60} y={1100} w={260} h={150} delay={26} />
    <Sticker src="reference-icons/parcel-box.png" x={300} y={1170} w={270} delay={26} from="left" rot={-6}>
      <div style={{ position: "absolute", left: "16%", top: "48%", transform: "skewY(-14deg) rotate(4deg)" }}>
        <Logo w={70} />
      </div>
    </Sticker>
    <Plane delay={18} />
    <PunchWords words={[{ t: "YOUR" }, { t: "PACKAGES," }]} x={540} y={1395} size={80} delay={36} rim={6} />
    <PunchWords words={[{ t: "FASTER!", color: C.red }]} x={540} y={1490} size={100} delay={46} rim={6} />

    <Sfx at={4} name="truck" vol={0.8} />
    <Sfx at={8} name="whoosh" vol={0.55} />
    <Sfx at={16} name="airplane" vol={0.7} />
    <Sfx at={26} name="whoosh-reverse" vol={0.45} />
    <Sfx at={36} name="pop" vol={0.5} />
    <Sfx at={48} name="checkmark" vol={0.7} />
  </>
);
