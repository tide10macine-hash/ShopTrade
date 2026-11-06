import React from "react";
import { C } from "../theme";
import { Pop, PopText, PunchWords, Sticker } from "../components/core";
import { PriceTag } from "../components/graphics";
import { Sfx } from "../components/Sfx";

// 2-4s: CHEAPEST PRICES
export const S2Prices: React.FC = () => (
  <>
    <PopText text="THE" x={540} y={285} size={84} delay={4} color={C.white} rim={8} />
    <PopText text="CHEAPEST" x={540} y={400} size={140} delay={6} stagger={2} color={C.red} rim={10} />
    <PopText text="PRICES!" x={540} y={545} size={150} delay={14} stagger={2} color={C.red} extrude={C.yellow} rim={10} />
    <Pop x={190} y={860} delay={22} rot={-14} from="drop">
      <PriceTag w={230} text={"LOW\nPRICE"} />
    </Pop>
    <Pop x={900} y={830} delay={28} rot={13} from="drop">
      <PriceTag w={210} text={"BEST\nDEAL"} color={C.redDark} />
    </Pop>
    <Sticker src="reference-icons/zigzag-arrow.png" x={545} y={880} w={600} delay={10} from="slam" z={2} />
    <PunchWords words={[{ t: "MORE" }, { t: "PRODUCTS." }]} x={540} y={1160} size={78} delay={34} rim={6} />
    <PunchWords words={[{ t: "LESS", color: C.yellow }, { t: "MONEY.", color: C.yellow }]} x={540} y={1265} size={96} delay={44} rim={6} />
    <Sticker src="reference-icons/coins-cash.png" x={540} y={1560} w={560} delay={26} from="bottom" />

    <Sfx at={10} name="impact" vol={0.55} />
    <Sfx at={14} name="whoosh" vol={0.4} />
    <Sfx at={22} name="pop" vol={0.55} />
    <Sfx at={28} name="pop-high" vol={0.55} />
    <Sfx at={30} name="cash-register" vol={0.85} />
    <Sfx at={36} name="coins" vol={0.6} />
    <Sfx at={44} name="pop" vol={0.5} />
  </>
);
