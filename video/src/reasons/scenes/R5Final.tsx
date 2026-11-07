import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { C } from "../../theme";
import { Flash, Logo, Pop, PopText, PunchWords, Sticker } from "../../components/core";
import { BenefitBoard } from "../../components/graphics";
import { Sfx } from "../../components/Sfx";
import { Chip } from "../graphics";
import { R_END_HIT, R_LOGO } from "../timeline";

const icon = (src: string, w: number) => <Img src={staticFile(src)} style={{ width: w, maxHeight: 190, objectFit: "contain" }} />;
const OUT = R_LOGO - 6;

// 14-18 s: all three reasons, then the logo
export const R5Final: React.FC = () => {
  const frame = useCurrentFrame();
  const punch = frame >= R_END_HIT ? 1 + 0.06 * Math.exp(-(frame - R_END_HIT) / 6) : 1;
  return (
    <>
      {/* phase A: the three reasons as ticked boards */}
      <Pop x={540} y={560} from="left" delay={4} rot={-3} out={OUT}>
        <BenefitBoard w={960} icon={icon("reference-icons/parcel-box.png", 190)} top="FREE REHEARSAL" bottom="+ CHEAPEST SHIPPING" topSize={58} bottomSize={44} />
      </Pop>
      <Pop x={540} y={820} from="right" delay={12} rot={2.5} out={OUT + 2}>
        <BenefitBoard w={960} icon={icon("reference-icons/delivery-truck.png", 215)} top="DELIVERY IN" bottom="JUST 6 DAYS" topSize={64} bottomSize={64} />
      </Pop>
      <Pop x={540} y={1080} from="left" delay={20} rot={-2} out={OUT + 4}>
        <BenefitBoard w={960} icon={icon("stickers/pikobuy-coupon-2x40-shipping.png", 215)} top="80% OFF" bottom="COUPONS" topSize={74} bottomSize={64} />
      </Pop>
      <Sticker src="reference-icons/checkmark.png" x={960} y={490} w={120} delay={32} rot={8} z={5} out={OUT} />
      <Sticker src="reference-icons/checkmark.png" x={960} y={750} w={120} delay={40} rot={-6} z={5} out={OUT + 2} />
      <Sticker src="reference-icons/checkmark.png" x={960} y={1010} w={120} delay={48} rot={6} z={5} out={OUT + 4} />

      {/* phase B: logo */}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${punch})`, transformOrigin: "540px 560px" }}>
        <Pop x={540} y={540} from="slam" delay={R_LOGO} idle={0.5} pulse={0.03}>
          <Logo w={430} src="logos/pikobuy-logo-official.png" />
        </Pop>
        <PopText text="SHOP SMARTER" x={540} y={880} size={104} delay={R_LOGO + 14} stagger={1} color={C.red} rim={10} />
        <PopText text="WITH PIKOBUY!" x={540} y={1000} size={96} delay={R_LOGO + 24} stagger={1} color={C.white} rim={9} />
      </div>
      <PunchWords words={[{ t: "MORE" }, { t: "SAVINGS.", color: C.red }]} x={540} y={1110} size={58} delay={R_LOGO + 40} rim={5} />
      <PunchWords words={[{ t: "MORE" }, { t: "CONVENIENCE.", color: C.red }]} x={540} y={1180} size={58} delay={R_LOGO + 48} rim={5} />
      <PunchWords words={[{ t: "MORE" }, { t: "SHOPPING.", color: C.red }]} x={540} y={1250} size={58} delay={R_LOGO + 56} rim={5} />
      <Sticker src="stickers/pikobuy-mascot.png" x={840} y={1470} w={380} delay={R_LOGO + 30} from="right" rot={3} />
      <Pop x={240} y={1430} delay={R_LOGO + 64} rot={-6}>
        <Img src={staticFile("logos/reezy-repz-logo.png")} style={{ width: 200, display: "block" }} />
      </Pop>
      <Pop x={240} y={1570} delay={R_LOGO + 70} rot={-3}>
        <Chip text="LINK IN BIO" size={40} bg={C.red} />
      </Pop>
      <Sticker src="reference-icons/thumbs-up.png" x={150} y={330} w={140} delay={R_LOGO + 20} rot={-10} />
      <Sticker src="reference-icons/checkmark.png" x={930} y={330} w={130} delay={R_LOGO + 24} rot={10} />
      <Flash at={R_LOGO} dur={10} color="#fff" max={0.85} />
      <Flash at={R_END_HIT} dur={14} color="#fff" max={0.5} />

      <Sfx at={4} name="whoosh" vol={0.45} />
      <Sfx at={12} name="whoosh-reverse" vol={0.45} />
      <Sfx at={20} name="whoosh" vol={0.45} />
      <Sfx at={32} name="checkmark" vol={0.55} />
      <Sfx at={40} name="checkmark" vol={0.55} />
      <Sfx at={48} name="checkmark" vol={0.6} />
      <Sfx at={OUT} name="whoosh" vol={0.5} />
      <Sfx at={R_LOGO} name="impact-cinematic" vol={1} />
      <Sfx at={R_LOGO + 14} name="pop" vol={0.5} />
      <Sfx at={R_LOGO + 20} name="pop-high" vol={0.45} />
      <Sfx at={R_LOGO + 30} name="whoosh" vol={0.45} />
      <Sfx at={R_LOGO + 40} name="pop" vol={0.4} />
      <Sfx at={R_LOGO + 48} name="pop" vol={0.4} />
      <Sfx at={R_LOGO + 56} name="pop" vol={0.4} />
      <Sfx at={R_LOGO + 64} name="pop-high" vol={0.5} />
      <Sfx at={R_END_HIT - 40} name="riser" vol={0.45} />
      <Sfx at={R_END_HIT} name="impact-cinematic" vol={1} />
    </>
  );
};
