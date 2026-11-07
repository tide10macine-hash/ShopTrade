import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Banner, Outlined, Pop, PopText, Sticker } from "../components/core";
import { Sfx } from "../components/Sfx";
import { PointArrow } from "../reasons/graphics";
import { RedX } from "../tips/Mistakes";
import { Battery, Hoodie, OpenBox, TShirt } from "../tips/icons";
import { Drop, Earbuds, Officer, Perfume, PowerBank, Smartwatch, StopSign, Warning } from "./icons";
import { L } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CHECK = "reference-icons/checkmark.png";
const fit = (s: string, max = 130) => Math.min(max, Math.round(900 / (s.length * 0.74)));

/** big sticker title that pops on its word, with a pop sound */
const Title: React.FC<{ t: string; at: number; y?: number; color?: string; out?: number; max?: number }> = ({ t, at, y = 480, color = C.red, out, max }) => (
  <>
    <PopText text={t} x={540} y={y} size={fit(t, max)} delay={at} stagger={1} color={color} rim={11} out={out} idle={0.6} />
    <Sfx at={at} name="pop" vol={0.32} />
  </>
);

/** big sticker number while "First / Next / And last" is spoken */
const BigNum: React.FC<{ n: number; out: number }> = ({ n, out }) => (
  <Pop x={540} y={1000} from="slam" delay={4} out={out} idle={0.5}>
    <Outlined text={`#${n}`} size={430} color={C.red} extrude={C.black} rim={20} />
    <Sfx at={4} name="impact" vol={0.45} />
    <Sfx at={out} name="whoosh-reverse" vol={0.3} />
  </Pop>
);

/** "ITEM n/3" chip */
const Chip: React.FC<{ n: number }> = ({ n }) => (
  <Pop x={540} y={350} delay={2} from="top" rot={-3}>
    <Banner text={`ITEM ${n}/3`} size={50} bg={C.black} color={C.white} />
  </Pop>
);

/** green "special shipping line" badge */
const SpecialLine: React.FC<{ at: number; y?: number }> = ({ at, y = 1300 }) => (
  <Pop x={540} y={y} delay={at} from="slam" rot={-3} pulse={0.04}>
    <Banner text="SPECIAL SHIPPING LINE" size={52} bg={C.green} color={C.white} />
  </Pop>
);

const Clothes: React.FC<{ w?: number }> = ({ w = 400 }) => (
  <OpenBox w={w}>
    <div style={{ position: "absolute", left: w * 0.15, top: w * 0.1 }}><Hoodie w={w * 0.4} /></div>
    <div style={{ position: "absolute", left: w * 0.48, top: w * 0.13 }}><TShirt w={w * 0.36} /></div>
  </OpenBox>
);

/* ------------------------------------------------------------------ hook */
export const Hook: React.FC = () => {
  const t = L(0);
  return (
    <>
      <Title t="DON'T SHIP THESE" at={t(0)} y={360} />
      <Title t="ITEMS TOGETHER!" at={t(3)} y={470} color={C.white} />
      <Pop x={540} y={1050} delay={t(1)}><Clothes w={460} /></Pop>
      <Sticker src="reference-icons/thumbs-up.png" x={880} y={1250} w={150} delay={t(6)} rot={180} />
      <Pop x={250} y={830} delay={t(2)} rot={-14}><Earbuds w={190} /></Pop>
      <Pop x={850} y={820} delay={t(3) + 6} rot={12}><Perfume w={110} color="#ffb3d1" /></Pop>
      <Pop x={540} y={720} delay={t(4)} from="slam" rot={-6}><StopSign w={210} /></Pop>
      <Title t="WITH YOUR CLOTHES" at={t(5)} y={580} color={C.black} max={84} />

      <Sfx at={0} name="paper-rustle" vol={0.6} />
      <Sfx at={t(1)} name="whoosh" vol={0.4} />
      <Sfx at={t(2)} name="pop-high" vol={0.4} />
      <Sfx at={t(4)} name="stamp" vol={0.7} />
      <Sfx at={t(6)} name="impact" vol={0.35} />
    </>
  );
};

/* ------------------------------------------------------------------ 1: electronics */
export const Electronics: React.FC = () => {
  const t = L(1);
  const f = useCurrentFrame();
  const fix = t(17); // "and send them on a special shipping line"
  const slide = interpolate(f, [t(14), t(14) + 12], [0, 1], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
  return (
    <>
      <Chip n={1} />
      <BigNum n={1} out={t(9) - 4} />
      <Title t="ELECTRONICS" at={t(9)} />
      <Pop x={540 - 230 * slide} y={1000} delay={t(9)} out={t(22) - 6}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}><Smartwatch w={210} /><Earbuds w={230} /></div>
      </Pop>
      <Pop x={790} y={1030} delay={t(14)} from="right" out={fix + 30}><Clothes w={340} /></Pop>
      <Pop x={560} y={1010} delay={t(14) + 6} out={fix - 2}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 120, color: C.black }}>+</div>
      </Pop>
      <Pop x={560} y={1010} delay={t(16)} from="slam" out={fix - 2}><RedX size={460} /></Pop>
      <Title t="SEPARATE HAUL!" at={fix + 6} y={600} color={C.white} max={92} />
      {/* carriers that run the special lines */}
      {["ems", "ups", "yodel"].map((c, i) => (
        <React.Fragment key={c}>
          <Pop x={250 + i * 290} y={1020} delay={t(22) + i * 7} rot={[-6, 3, 7][i]} pulse={0.03}>
            <Img src={staticFile(`logos/carriers/${c}-logo.png`)} style={{ width: 230, display: "block", filter: "drop-shadow(0 12px 10px rgba(40,30,30,0.3))" }} />
          </Pop>
          <Sfx at={t(22) + i * 7} name={i % 2 ? "pop-high" : "pop"} vol={0.45} />
        </React.Fragment>
      ))}
      <SpecialLine at={t(22)} />
      <Sticker src={CHECK} x={170} y={1230} w={140} delay={t(24)} rot={-10} />

      <Sfx at={t(9)} name="impact" vol={0.5} />
      <Sfx at={t(14)} name="whoosh-reverse" vol={0.4} />
      <Sfx at={t(16)} name="stamp" vol={0.7} />
      <Sfx at={t(22) + 4} name="pop-high" vol={0.4} />
      <Sfx at={t(24)} name="checkmark" vol={0.55} />
    </>
  );
};

/* ------------------------------------------------------------------ 2: perfumes */
export const Perfumes: React.FC = () => {
  const t = L(2);
  const f = useCurrentFrame();
  const cust = t(31); // "extra checks at customs"
  const sep = t(34); // "so ship them separately"
  return (
    <>
      <Chip n={2} />
      <BigNum n={2} out={t(26) - 4} />
      <Title t="PERFUMES" at={t(26)} out={cust - 4} />
      <Pop x={540} y={1060} delay={t(26)} out={cust - 4}>
        <OpenBox w={440}>
          {[["#ffb3d1", 70, 0], ["#7ad9ff", 175, -24], ["#ffe08a", 280, 4]].map(([c, x, r], i) => (
            <div key={i} style={{ position: "absolute", left: x as number, top: interpolate(f, [t(26) + i * 5, t(26) + i * 5 + 10], [140, 0], clamp), transform: `rotate(${r}deg)` }}>
              <Perfume w={90} color={c as string} />
            </div>
          ))}
        </OpenBox>
      </Pop>
      <Pop x={540} y={1060} delay={t(26) + 26} from="slam" out={cust - 4}><RedX size={420} /></Pop>
      {[0, 1, 2].map((i) => (
        <Pop key={i} x={[180, 900, 860][i]} y={[820, 860, 1290][i]} delay={t(27) + i * 5} out={cust - 4}><Drop w={[90, 70, 60][i]} /></Pop>
      ))}
      <Title t="CUSTOMS CHECKS" at={cust} color={C.red} out={sep - 4} />
      <Pop x={540} y={760} delay={cust} from="slam" out={sep - 4}><Warning w={230} /></Pop>
      <Pop x={540} y={1110} delay={cust + 6} from="bottom" out={sep - 4}><Officer w={300} /></Pop>
      <Title t="SHIP THEM SEPARATELY" at={sep} color={C.white} max={80} />
      <Pop x={540} y={1060} delay={sep + 4}>
        <OpenBox w={380}>
          <div style={{ position: "absolute", left: 140, top: 10 }}><Perfume w={100} color="#7ad9ff" /></div>
        </OpenBox>
      </Pop>
      <Sticker src={CHECK} x={820} y={860} w={140} delay={t(37)} rot={10} />

      <Sfx at={t(26)} name="impact" vol={0.5} />
      <Sfx at={t(26) + 26} name="stamp" vol={0.7} />
      <Sfx at={t(27)} name="pop-high" vol={0.35} />
      <Sfx at={cust} name="stamp" vol={0.5} />
      <Sfx at={cust + 6} name="whoosh-reverse" vol={0.35} />
      <Sfx at={sep + 4} name="pop" vol={0.45} />
      <Sfx at={t(37)} name="checkmark" vol={0.55} />
    </>
  );
};

/* ------------------------------------------------------------------ 3: power banks */
export const PowerBanks: React.FC = () => {
  const t = L(3);
  return (
    <>
      <Chip n={3} />
      <BigNum n={3} out={t(40) - 4} />
      <Title t="POWER BANKS" at={t(40)} />
      <Pop x={410} y={1010} delay={t(40)} rot={-8}><PowerBank w={250} /></Pop>
      <Pop x={700} y={1040} delay={t(42)} rot={8}><Battery w={140} /></Pop>
      <Pop x={540} y={1010} delay={t(41) + 14} from="slam" out={t(44)}><RedX size={420} /></Pop>
      <Title t="BATTERIES TOO!" at={t(42)} y={600} color={C.white} max={92} />
      <Sticker src="reference-icons/airplane.png" x={800} y={1180} w={300} delay={t(45)} from="left" rot={-12} />
      <SpecialLine at={t(45)} />
      <Sticker src={CHECK} x={170} y={1230} w={140} delay={t(47)} rot={-10} />

      <Sfx at={t(40)} name="impact" vol={0.5} />
      <Sfx at={t(41) + 14} name="stamp" vol={0.7} />
      <Sfx at={t(42)} name="pop-high" vol={0.4} />
      <Sfx at={t(45)} name="airplane" vol={0.6} />
      <Sfx at={t(47)} name="checkmark" vol={0.55} />
    </>
  );
};

/* ------------------------------------------------------------------ plug */
export const Plug: React.FC = () => {
  const t = L(4);
  return (
    <>
      <Title t="NEW SIGN-UPS GET" at={t(48)} y={380} color={C.white} max={92} />
      <Pop x={540} y={720} delay={t(51)} from="slam" pulse={0.03}>
        <Img src={staticFile("logos/pikobuy-logo-official.png")} style={{ width: 330, display: "block" }} />
      </Pop>
      <Pop x={540} y={1040} delay={t(53)} from="bottom" rot={-5} pulse={0.04}>
        <Img src={staticFile("stickers/pikobuy-coupon-2x40-shipping.png")} style={{ width: 860, display: "block" }} />
      </Pop>
      <Pop x={420} y={1325} delay={t(58)} from="slam" rot={-3} pulse={0.05}>
        <Banner text="LINK IN MY BIO" size={62} bg={C.red} color={C.white} />
      </Pop>
      <div style={{ position: "absolute", left: 760, top: 1275 }}><PointArrow delay={t(58) + 8} w={200} /></div>
      <Sticker src="stickers/pikobuy-mascot.png" x={870} y={560} w={280} delay={t(55)} from="right" rot={4} />

      <Sfx at={t(51) - 30} name="riser" vol={0.35} />
      <Sfx at={t(51)} name="impact" vol={0.6} />
      <Sfx at={t(53)} name="whoosh" vol={0.45} />
      <Sfx at={t(53) + 6} name="coupon-confirm" vol={0.7} />
      <Sfx at={t(55)} name="whoosh-reverse" vol={0.35} />
      <Sfx at={t(56)} name="cash-register" vol={0.5} />
      <Sfx at={t(58)} name="stamp" vol={0.6} />
      <Sfx at={t(58) + 8} name="pop-high" vol={0.4} />
    </>
  );
};

export const SCENES = [Hook, Electronics, Perfumes, PowerBanks, Plug];
