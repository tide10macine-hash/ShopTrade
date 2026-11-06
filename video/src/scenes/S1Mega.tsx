import React from "react";
import { C } from "../theme";
import { Logo, Pop, PopText, PunchWords, Sticker, Outlined } from "../components/core";
import { Sfx } from "../components/Sfx";

// 0-2s: 11.11 slams in immediately (hook in the first frames)
export const S1Mega: React.FC = () => (
  <>
    <Sticker src="reference-icons/sale-tags.png" x={540} y={250} w={760} delay={5} from="drop" rot={0} />
    <Sticker src="reference-icons/thumbs-up.png" x={150} y={560} w={170} delay={26} rot={-10} />
    <Pop x={540} y={740} from="slam" delay={0} idle={0.6}>
      <Outlined text="11.11" size={400} color={C.red} extrude={C.yellow} rim={16} />
    </Pop>
    <Pop x={905} y={560} delay={18} rot={12}>
      <Logo w={175} />
    </Pop>
    <PopText text="MEGA SALE" x={540} y={1040} size={128} delay={20} stagger={2} color={C.red} rim={10} />
    <PunchWords words={[{ t: "IS" }, { t: "HERE!", color: C.yellow }]} x={540} y={1185} size={112} delay={40} rim={8} />
    <Sticker src="reference-icons/singles-day-bag.png" x={210} y={1420} w={270} delay={14} rot={-12} />
    <Sticker src="reference-icons/parcel-box.png" x={860} y={1430} w={330} delay={22} rot={7} />
    <Sticker src="reference-icons/zigzag-arrow.png" x={560} y={1500} w={300} delay={30} rot={0} from="left" />

    <Sfx at={0} name="paper-rustle" vol={0.7} />
    <Sfx at={2} name="impact" vol={1} />
    <Sfx at={5} name="whoosh-reverse" vol={0.5} />
    <Sfx at={14} name="pop" vol={0.6} />
    <Sfx at={18} name="pop-high" vol={0.6} />
    <Sfx at={22} name="pop" vol={0.6} />
    <Sfx at={26} name="pop-high" vol={0.5} />
    <Sfx at={30} name="whoosh" vol={0.45} />
    <Sfx at={40} name="pop" vol={0.6} />
  </>
);
