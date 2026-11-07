import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, EASE } from "../../theme";
import { Banner, Flash, Logo, Outlined, Pop, PopText, PunchWords, Sticker } from "../../components/core";
import { useCount } from "../../components/graphics";
import { Sfx } from "../../components/Sfx";
import { Chip, Phone, PointArrow } from "../graphics";
import { R_PHASE } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const COUPON = "stickers/pikobuy-coupon-2x40-shipping.png";
const LOGO = "logos/pikobuy-logo-official.png";

// 10-14 s: REASON 3 - the biggest moment: 80% OFF, then the link in bio
export const R4Coupons: React.FC = () => {
  const frame = useCurrentFrame();
  const n = useCount(5, 80, 2, 24);
  const out = interpolate(frame, [R_PHASE - 8, R_PHASE + 2], [0, 1], { ...clamp, easing: EASE.in });
  return (
    <>
      <Flash at={1} dur={12} color="#fff" max={0.9} />
      <Pop x={540} y={250} delay={2} from="top" out={R_PHASE - 8}>
        <Chip text="REASON #3" />
      </Pop>
      {/* phase A: 80% OFF + stacking coupons */}
      <AbsoluteFill style={{ transform: `scale(${1 + 0.6 * out})`, opacity: 1 - out, filter: out > 0 ? `blur(${14 * out}px)` : undefined }}>
        <Pop x={540} y={600} from="slam" delay={2} idle={0.5} pulse={0.04}>
          <Outlined text={`${n}%`} size={430} color={C.red} extrude={C.black} rim={20} spacing={-0.05} />
        </Pop>
        <Pop x={540} y={900} from="slam" delay={14} rot={-3}>
          <Outlined text="OFF!" size={250} color={C.red} rim={14} />
        </Pop>
        <Pop x={170} y={390} delay={20} rot={-12}>
          <Logo w={170} src={LOGO} />
        </Pop>
        <Sticker src={COUPON} x={520} y={1180} w={820} delay={30} from="left" rot={-9} idle={0.4} />
        <Sticker src={COUPON} x={570} y={1290} w={820} delay={42} from="right" rot={5} idle={0.4} />
        <Sticker src={COUPON} x={540} y={1400} w={840} delay={54} from="bottom" rot={-3} idle={0.4} />
        <Sticker src="reference-icons/coin-stack.png" x={130} y={1520} w={200} delay={66} from="bottom" rot={-8} />
        <Sticker src="reference-icons/coin-stack.png" x={950} y={1500} w={190} delay={72} from="bottom" rot={8} />
        <Sticker src="reference-icons/checkmark.png" x={930} y={430} w={150} delay={78} rot={10} />
      </AbsoluteFill>

      {/* phase B: coupons for new sign-ups, link in bio */}
      <PunchWords words={[{ t: "COUPONS" }, { t: "FOR" }]} x={540} y={250} size={84} delay={R_PHASE} rim={7} />
      <PopText text="NEW SIGN-UPS!" x={540} y={370} size={104} delay={R_PHASE + 6} stagger={1} color={C.red} rim={10} />
      <Pop x={540} y={505} delay={R_PHASE + 16} rot={-3} pulse={0.04}>
        <Banner text="LINK IN MY BIO ↓" size={64} bg={C.black} color={C.white} />
      </Pop>
      <Pop x={540} y={1040} delay={R_PHASE + 4} from="bottom" idle={0.3}>
        <Phone w={430} src="stickers/link-in-bio-reezy-repz.jpg" />
      </Pop>
      <div style={{ position: "absolute", left: 770, top: 980 }}>
        <PointArrow delay={R_PHASE + 30} w={240} />
      </div>
      <Sticker src={COUPON} x={240} y={1350} w={380} delay={R_PHASE + 38} rot={-12} />
      <Sticker src="reference-icons/checkmark.png" x={110} y={1230} w={120} delay={R_PHASE + 50} rot={-8} />

      <Sfx at={0} name="impact-cinematic" vol={1} />
      <Sfx at={4} name="coins" vol={0.55} />
      <Sfx at={14} name="impact" vol={0.6} />
      <Sfx at={20} name="pop-high" vol={0.5} />
      <Sfx at={22} name="cash-register" vol={0.8} />
      <Sfx at={30} name="whoosh" vol={0.45} />
      <Sfx at={34} name="coupon-confirm" vol={0.6} />
      <Sfx at={42} name="whoosh-reverse" vol={0.45} />
      <Sfx at={46} name="coupon-confirm" vol={0.55} />
      <Sfx at={54} name="whoosh" vol={0.45} />
      <Sfx at={58} name="coupon-confirm" vol={0.55} />
      <Sfx at={66} name="coins" vol={0.5} />
      <Sfx at={78} name="checkmark" vol={0.55} />
      <Sfx at={R_PHASE - 8} name="whoosh" vol={0.55} />
      <Sfx at={R_PHASE} name="pop" vol={0.5} />
      <Sfx at={R_PHASE + 6} name="whoosh-reverse" vol={0.4} />
      <Sfx at={R_PHASE + 16} name="pop-high" vol={0.55} />
      <Sfx at={R_PHASE + 30} name="whoosh" vol={0.4} />
      <Sfx at={R_PHASE + 38} name="coupon-confirm" vol={0.6} />
      <Sfx at={R_PHASE + 50} name="checkmark" vol={0.5} />
    </>
  );
};
