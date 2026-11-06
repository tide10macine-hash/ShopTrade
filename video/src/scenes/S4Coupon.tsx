import React from "react";
import { interpolate, useCurrentFrame, AbsoluteFill } from "remotion";
import { C, EASE, FONT } from "../theme";
import { Banner, Burst, Flash, Logo, Outlined, Pop, PunchWords, Sticker } from "../components/core";
import { useCount } from "../components/graphics";
import { Sfx } from "../components/Sfx";
import { CAMPAIGN } from "../campaign";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PHASE_B = 110; // hero shrinks to the top, the official coupon flies in
const COUPON = "stickers/pikobuy-coupon-2x40-shipping.png"; // official PIKOBUY asset, used as supplied

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const n = useCount(5, 80, 2, 26);
  const p = interpolate(frame, [PHASE_B, PHASE_B + 14], [0, 1], { ...clamp, easing: EASE.inOut });
  const sc = 1 - 0.45 * p;
  const ty = -380 * p;
  const pulse = frame < PHASE_B ? 1 + 0.03 * Math.exp(-((frame - 4) % 30) / 6) : 1;
  return (
    <AbsoluteFill style={{ transform: `translateY(${ty}px) scale(${sc})`, transformOrigin: "540px 820px" }}>
      <Pop x={540} y={820} delay={2} idle={0} shadow={false}>
        <Burst r={470} points={20} fill={C.cyan} spin={14} />
      </Pop>
      <Pop x={540} y={470} delay={10} rot={-5}>
        <Banner text="UP TO" size={92} bg={C.red} color={C.white} />
      </Pop>
      <Pop x={540} y={830} from="slam" delay={2} idle={0.5}>
        <div style={{ transform: `scale(${pulse})` }}>
          <Outlined text={`${n}%`} size={400} color={C.red} extrude={C.black} rim={18} spacing={-0.05} />
        </div>
      </Pop>
      <Pop x={540} y={1130} from="slam" delay={16} rot={-3}>
        <Outlined text="OFF!" size={230} color={C.red} rim={14} />
      </Pop>
      <Pop x={180} y={560} delay={22} rot={-12}>
        <Logo w={190} />
      </Pop>
    </AbsoluteFill>
  );
};

// 6-10s: THE 80% COUPON MOMENT
export const S4Coupon: React.FC = () => {
  const frame = useCurrentFrame();
  const fine = interpolate(frame, [PHASE_B + 10, PHASE_B + 20], [0, 1], clamp);
  return (
    <>
      <Flash at={1} dur={12} color="#fff" max={0.9} />
      <Hero />
      {/* phase A supporting line */}
      <PunchWords words={[{ t: "WITH" }, { t: "EXCLUSIVE" }]} x={540} y={1340} size={76} delay={30} rim={6} out={PHASE_B - 6} />
      <PunchWords words={[{ t: "11.11", color: C.red }, { t: "COUPONS!", color: C.red }]} x={540} y={1440} size={96} delay={40} rim={6} out={PHASE_B - 6} />
      <Sticker src="reference-icons/checkmark.png" x={910} y={1150} w={150} delay={52} rot={10} out={PHASE_B - 4} />
      <Sticker src="reference-icons/thumbs-up.png" x={170} y={1130} w={150} delay={58} rot={-10} out={PHASE_B - 4} />

      {/* phase B: official 2x40% shipping coupon */}
      <Sticker src={COUPON} x={540} y={960} w={1000} delay={PHASE_B + 6} from="left" rot={-3} idle={0.5} />
      <Sticker src="reference-icons/redeemed-stamp.png" x={860} y={1080} w={330} delay={PHASE_B + 46} from="slam" rot={-16} idle={0.2} shadow={false} />
      <Sticker src="reference-icons/checkmark.png" x={150} y={800} w={130} delay={PHASE_B + 62} rot={-8} />
      <Sticker src="reference-icons/checkmark.png" x={930} y={790} w={120} delay={PHASE_B + 68} rot={10} />
      <Pop x={540} y={1360} delay={PHASE_B + 74} rot={-3}>
        <Banner text="STACK YOUR SAVINGS!" size={62} bg={C.black} color={C.white} />
      </Pop>
      <div
        style={{
          position: "absolute", left: 90, right: 90, top: 1470, opacity: fine, textAlign: "center",
          fontFamily: FONT.display, fontWeight: 700, fontSize: 27, lineHeight: 1.25, color: C.black,
          background: "rgba(255,255,255,0.85)", borderRadius: 14, padding: "8px 16px",
        }}
      >
        {CAMPAIGN.finePrint}
      </div>

      <Sfx at={0} name="impact-cinematic" vol={1} />
      <Sfx at={4} name="coins" vol={0.5} />
      <Sfx at={10} name="pop" vol={0.5} />
      <Sfx at={16} name="impact" vol={0.6} />
      <Sfx at={24} name="cash-register" vol={0.8} />
      <Sfx at={30} name="pop-high" vol={0.45} />
      <Sfx at={52} name="checkmark" vol={0.55} />
      <Sfx at={PHASE_B} name="whoosh" vol={0.55} />
      <Sfx at={PHASE_B + 10} name="coupon-confirm" vol={0.8} />
      <Sfx at={PHASE_B + 32} name="coupon-confirm" vol={0.6} />
      <Sfx at={PHASE_B + 48} name="stamp" vol={0.95} />
      <Sfx at={PHASE_B + 62} name="checkmark" vol={0.6} />
      <Sfx at={PHASE_B + 68} name="checkmark" vol={0.5} />
      <Sfx at={PHASE_B + 74} name="pop-high" vol={0.5} />
      <Sfx at={PHASE_B + 80} name="cash-register" vol={0.6} />
    </>
  );
};
