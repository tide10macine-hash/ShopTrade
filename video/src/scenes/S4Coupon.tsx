import React from "react";
import { interpolate, useCurrentFrame, AbsoluteFill } from "remotion";
import { C, EASE, FONT } from "../theme";
import { Banner, Burst, Flash, Logo, Outlined, Pop, PunchWords, Sticker } from "../components/core";
import { CouponCard, useCount } from "../components/graphics";
import { Sfx } from "../components/Sfx";
import { CAMPAIGN } from "../campaign";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PHASE_B = 110; // hero shrinks to the top, coupons fly in

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const n = useCount(5, 80, 2, 26);
  const p = interpolate(frame, [PHASE_B, PHASE_B + 14], [0, 1], { ...clamp, easing: EASE.inOut });
  const sc = 1 - 0.45 * p;
  const ty = -380 * p;
  // beat pulse on the number while it's the hero
  const pulse = frame < PHASE_B ? 1 + 0.03 * Math.exp(-((frame - 4) % 30) / 6) : 1;
  return (
    <AbsoluteFill style={{ transform: `translateY(${ty}px) scale(${sc})`, transformOrigin: "540px 820px" }}>
      <Pop x={540} y={820} delay={2} idle={0} shadow={false}>
        <Burst r={470} points={20} fill={C.yellow} spin={14} />
      </Pop>
      <Pop x={540} y={470} delay={10} rot={-5}>
        <Banner text="UP TO" size={92} bg={C.red} color={C.white} />
      </Pop>
      <Pop x={540} y={830} from="slam" delay={2} idle={0.5}>
        <div style={{ transform: `scale(${pulse})` }}>
          <Outlined text={`${n}%`} size={400} color={C.red} extrude={C.yellow} rim={18} spacing={-0.05} />
        </div>
      </Pop>
      <Pop x={540} y={1130} from="slam" delay={16} rot={-3}>
        <Outlined text="OFF!" size={230} color={C.red} extrude={C.yellow} rim={14} />
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
      <Flash at={1} dur={12} color={C.yellow} max={0.9} />
      <Hero />
      {/* phase A supporting line */}
      <PunchWords words={[{ t: "WITH" }, { t: "EXCLUSIVE" }]} x={540} y={1340} size={76} delay={30} rim={6} out={PHASE_B - 6} />
      <PunchWords words={[{ t: "11.11", color: C.yellow }, { t: "COUPONS!", color: C.yellow }]} x={540} y={1440} size={96} delay={40} rim={6} out={PHASE_B - 6} />
      <Sticker src="reference-icons/checkmark.png" x={910} y={1150} w={150} delay={52} rot={10} out={PHASE_B - 4} />
      <Sticker src="reference-icons/thumbs-up.png" x={170} y={1130} w={150} delay={58} rot={-10} out={PHASE_B - 4} />

      {/* phase B: coupon cards stack */}
      <Pop x={520} y={870} from="left" delay={PHASE_B + 6} rot={-5}>
        <CouponCard value={CAMPAIGN.couponValue} label={CAMPAIGN.couponLabel} w={760} />
      </Pop>
      <Pop x={560} y={1170} from="right" delay={PHASE_B + 18} rot={4}>
        <CouponCard value={CAMPAIGN.couponValue} label={CAMPAIGN.couponLabel} w={760} />
      </Pop>
      <Pop x={400} y={1030} from="slam" delay={PHASE_B + 34} idle={0.3}>
        <div style={{ width: 120, height: 120, borderRadius: 60, background: C.black, border: `8px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 96, color: C.yellow, lineHeight: 1, marginTop: -8 }}>+</span>
        </div>
      </Pop>
      <Sticker src="reference-icons/redeemed-stamp.png" x={700} y={930} w={430} delay={PHASE_B + 46} from="slam" rot={-10} idle={0.2} shadow={false} />
      <Sticker src="reference-icons/checkmark.png" x={170} y={1250} w={140} delay={PHASE_B + 62} rot={-8} />
      <Sticker src="reference-icons/checkmark.png" x={920} y={760} w={130} delay={PHASE_B + 68} rot={10} />
      <Pop x={540} y={1420} delay={PHASE_B + 74} rot={-3}>
        <Banner text="STACK YOUR SAVINGS!" size={62} />
      </Pop>
      <div
        style={{
          position: "absolute", left: 90, right: 90, top: 1500, opacity: fine, textAlign: "center",
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
      <Sfx at={PHASE_B + 8} name="coupon-confirm" vol={0.75} />
      <Sfx at={PHASE_B + 20} name="coupon-confirm" vol={0.75} />
      <Sfx at={PHASE_B + 34} name="pop" vol={0.6} />
      <Sfx at={PHASE_B + 48} name="stamp" vol={0.95} />
      <Sfx at={PHASE_B + 62} name="checkmark" vol={0.6} />
      <Sfx at={PHASE_B + 68} name="checkmark" vol={0.5} />
      <Sfx at={PHASE_B + 74} name="pop-high" vol={0.5} />
      <Sfx at={PHASE_B + 80} name="cash-register" vol={0.6} />
    </>
  );
};
