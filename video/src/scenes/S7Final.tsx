import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C, FONT } from "../theme";
import { Banner, Flash, Logo, Pop, PopText, PunchWords, Sticker } from "../components/core";
import { Sfx } from "../components/Sfx";
import { END_HIT } from "../timeline";
import { CAMPAIGN } from "../campaign";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 16-20s: final PIKOBUY branding
export const S7Final: React.FC = () => {
  const frame = useCurrentFrame();
  const punch = 1 + 0.06 * Math.exp(-Math.max(0, frame - END_HIT) / 6) * (frame >= END_HIT ? 1 : 0);
  const fine = interpolate(frame, [150, 164], [0, 1], clamp);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${punch})`, transformOrigin: "540px 620px" }}>
        <Sticker src="reference-icons/sale-tags.png" x={540} y={150} w={500} delay={14} from="drop" />
        <Sticker src="reference-icons/thumbs-up.png" x={160} y={390} w={150} delay={22} rot={-10} />
        <Sticker src="reference-icons/checkmark.png" x={920} y={390} w={140} delay={26} rot={10} />
        <Sticker src="stickers/pikobuy-coupon-2x40-shipping.png" x={165} y={800} w={290} delay={30} rot={-14} />
        <Sticker src="reference-icons/singles-day-bag.png" x={945} y={790} w={190} delay={34} rot={9} />
        <Pop x={540} y={610} from="slam" delay={0} idle={0.5} pulse={0.03}>
          <Logo w={440} />
        </Pop>
        <PopText text="PIKOBUY 11.11" x={540} y={935} size={98} delay={10} stagger={1} color={C.white} rim={8} />
        <PopText text="MEGA SALE" x={540} y={1060} size={128} delay={80} stagger={2} color={C.red} rim={10} />
      </div>
      <PunchWords words={[{ t: "CHEAPEST" }, { t: "PRICES." }]} x={540} y={1180} size={58} delay={100} rim={5} />
      <PunchWords words={[{ t: "FASTEST" }, { t: "SHIPPING." }]} x={540} y={1250} size={58} delay={108} rim={5} />
      <PunchWords
        words={[{ t: "UP", color: C.red }, { t: "TO", color: C.red }, { t: "80%", color: C.red }, { t: "OFF", color: C.red }, { t: "WITH" }, { t: "COUPONS!*" }]}
        x={540} y={1330} size={56} delay={116} stagger={3} rim={5} gap={14}
      />
      <Pop x={540} y={1445} delay={130} rot={-2} pulse={0.05}>
        <Banner text="SHOP MORE. SAVE MORE." size={58} bg={C.red} color={C.white} />
      </Pop>
      <Sticker src="reference-icons/delivery-truck.png" x={200} y={1650} w={350} delay={38} from="left" rot={-3} />
      <Sticker src="reference-icons/parcel-box.png" x={900} y={1660} w={270} delay={42} rot={6} />
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 1530, textAlign: "center", opacity: fine,
          fontFamily: FONT.display, fontWeight: 700, fontSize: 25, color: C.black,
        }}
      >
        {CAMPAIGN.finePrintShort}
      </div>
      <Flash at={0} dur={10} color="#fff" max={0.9} />
      <Flash at={END_HIT} dur={14} color="#fff" max={0.5} />

      <Sfx at={0} name="impact-cinematic" vol={1} />
      <Sfx at={14} name="whoosh-reverse" vol={0.4} />
      <Sfx at={22} name="pop" vol={0.45} />
      <Sfx at={26} name="pop-high" vol={0.45} />
      <Sfx at={30} name="pop" vol={0.45} />
      <Sfx at={34} name="pop-high" vol={0.45} />
      <Sfx at={38} name="truck" vol={0.4} />
      <Sfx at={80} name="whoosh" vol={0.35} />
      <Sfx at={100} name="cash-register" vol={0.45} />
      <Sfx at={116} name="coupon-confirm" vol={0.5} />
      <Sfx at={130} name="pop" vol={0.55} />
      <Sfx at={END_HIT - 40} name="riser" vol={0.4} />
      <Sfx at={END_HIT} name="impact-cinematic" vol={1} />
    </>
  );
};
