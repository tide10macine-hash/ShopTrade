import React from "react";
import { Img, staticFile } from "remotion";
import { C } from "../theme";
import { Pop, PopText, PunchWords, Sticker } from "../components/core";
import { BenefitBoard } from "../components/graphics";
import { Sfx } from "../components/Sfx";

const icon = (src: string, w: number) => <Img src={staticFile(src)} style={{ width: w, maxHeight: 190, objectFit: "contain" }} />;

// 10-13s: all three benefits in one collage
export const S5Why: React.FC = () => (
  <>
    <PopText text="WHY PAY" x={540} y={300} size={132} delay={4} color={C.red} rim={10} />
    <PopText text="MORE?" x={540} y={445} size={160} delay={14} color={C.red} extrude={C.yellow} rim={10} />
    <Pop x={540} y={690} from="left" delay={16} rot={-3}>
      <BenefitBoard icon={icon("reference-icons/zigzag-arrow.png", 210)} top="CHEAPEST" bottom="PRICES" />
    </Pop>
    <Pop x={540} y={945} from="right" delay={26} rot={2.5}>
      <BenefitBoard icon={icon("reference-icons/delivery-truck.png", 225)} top="FASTEST" bottom="SHIPPING" />
    </Pop>
    <Pop x={540} y={1200} from="left" delay={36} rot={-2}>
      <BenefitBoard
        icon={icon("reference-icons/coupon-gifts.png", 225)}
        top="UP TO 80%"
        bottom="OFF*"
      />
    </Pop>
    <Sticker src="reference-icons/checkmark.png" x={930} y={630} w={120} delay={62} rot={8} z={5} />
    <Sticker src="reference-icons/checkmark.png" x={930} y={885} w={120} delay={72} rot={-6} z={5} />
    <Sticker src="reference-icons/checkmark.png" x={930} y={1140} w={120} delay={82} rot={6} z={5} />
    <PunchWords words={[{ t: "SHOP" }, { t: "SMART" }, { t: "WITH" }]} x={540} y={1390} size={70} delay={92} rim={6} />
    <PunchWords words={[{ t: "PIKOBUY!", color: C.yellow }]} x={540} y={1480} size={104} delay={106} rim={6} />

    <Sfx at={16} name="whoosh" vol={0.45} />
    <Sfx at={26} name="whoosh-reverse" vol={0.45} />
    <Sfx at={36} name="whoosh" vol={0.45} />
    <Sfx at={62} name="checkmark" vol={0.55} />
    <Sfx at={72} name="checkmark" vol={0.55} />
    <Sfx at={82} name="checkmark" vol={0.6} />
    <Sfx at={92} name="pop" vol={0.5} />
    <Sfx at={106} name="pop-high" vol={0.55} />
    <Sfx at={108} name="coins" vol={0.45} />
  </>
);
