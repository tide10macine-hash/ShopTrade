import React from "react";
import { C } from "../../theme";
import { Logo, Outlined, Pop, PopText, PunchWords, Sticker } from "../../components/core";
import { Sfx } from "../../components/Sfx";

const LOGO = "logos/pikobuy-logo-official.png";

// 0-2 s: hook. The giant "3" lands on the very first frames.
export const R1Hook: React.FC = () => (
  <>
    <Sticker src="reference-icons/checkmark.png" x={160} y={330} w={140} delay={22} rot={-12} />
    <Pop x={540} y={560} from="slam" delay={0} idle={0.6} pulse={0.04}>
      <Outlined text="3" size={560} color={C.red} extrude={C.black} rim={20} />
    </Pop>
    <Pop x={880} y={380} delay={18} rot={12}>
      <Logo w={190} src={LOGO} />
    </Pop>
    <PopText text="REASONS" x={540} y={880} size={170} delay={8} stagger={2} color={C.red} rim={12} />
    <PunchWords words={[{ t: "TO" }, { t: "SHOP" }, { t: "WITH" }]} x={540} y={1030} size={86} delay={30} stagger={4} rim={7} />
    <PopText text="PIKOBUY!" x={540} y={1160} size={150} delay={40} stagger={2} color={C.cyan} rim={12} />
    <Sticker src="reference-icons/parcel-box.png" x={190} y={1440} w={250} delay={52} rot={-8} from="left" />
    <Sticker src="stickers/pikobuy-mascot.png" x={830} y={1460} w={400} delay={56} from="right" rot={4} shadow />

    <Sfx at={0} name="paper-rustle" vol={0.7} />
    <Sfx at={2} name="impact" vol={1} />
    <Sfx at={8} name="whoosh" vol={0.4} />
    <Sfx at={18} name="pop-high" vol={0.55} />
    <Sfx at={22} name="checkmark" vol={0.45} />
    <Sfx at={30} name="pop" vol={0.5} />
    <Sfx at={40} name="impact" vol={0.45} />
    <Sfx at={52} name="whoosh-reverse" vol={0.4} />
    <Sfx at={56} name="whoosh" vol={0.45} />
    <Sfx at={64} name="pop-high" vol={0.5} />
  </>
);
