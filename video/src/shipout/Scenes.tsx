import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT } from "../theme";
import { Banner, Outlined, Pop, PopText, Sticker } from "../components/core";
import { RoundBadge } from "../components/graphics";
import { Sfx } from "../components/Sfx";
import { Magnifier, PointArrow } from "../reasons/graphics";
import { ShoeBox, Sneaker } from "../tips/icons";
import { L, SECTIONS } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CHECK = "reference-icons/checkmark.png";
const LOGO = "logos/pikobuy-logo-official.png";
const COUPON = "stickers/pikobuy-coupon-2x40-shipping.png";
const fit = (s: string, max = 130) => Math.min(max, Math.round(900 / (s.length * 0.74)));

const Title: React.FC<{ t: string; at: number; y?: number; color?: string; out?: number; max?: number }> = ({ t, at, y = 480, color = C.red, out, max }) => (
  <>
    <PopText text={t} x={540} y={y} size={fit(t, max)} delay={at} stagger={1} color={color} rim={11} out={out} idle={0.6} />
    <Sfx at={at} name="pop" vol={0.32} />
  </>
);

const Chip: React.FC<{ n: number }> = ({ n }) => (
  <Pop x={540} y={350} delay={26} from="top" rot={-3}>
    <Banner text={`TIP ${n}/3`} size={50} bg={C.green} color={C.white} />
  </Pop>
);

/* ------------------------------------------------------------------ torn-paper band between tips */
const tornEdge = (seed: string, w: number, y: number, amp: number, down: boolean) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 36) pts.push(`${x},${y + (down ? 1 : -1) * random(`${seed}${x}`) * amp}`);
  return pts;
};

/** dark torn strip that sweeps up through the frame carrying a giant number (global frames) */
export const TornBand: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {SECTIONS.slice(1, 4).map((s, k) => {
        const d = f - (s.from - 8);
        if (d < 0 || d > 46) return null;
        const y = interpolate(d, [0, 12, 30, 46], [1920, 640, 600, -800], { ...clamp, easing: EASE.inOut });
        const h = 680;
        const top = tornEdge(`t${k}`, 1080, 40, 40, false);
        const bot = tornEdge(`b${k}`, 1080, h - 40, 40, true).reverse();
        return (
          <div key={s.key} style={{ position: "absolute", left: 0, top: y, width: 1080, height: h, filter: "drop-shadow(0 20px 18px rgba(0,0,0,0.45))" }}>
            <svg width={1080} height={h} style={{ position: "absolute", inset: 0 }}>
              <polygon points={[`0,${h}`, "0,0", ...top, `1080,0`].join(" ")} fill="none" />
              <polygon points={[...top, ...bot].join(" ")} fill="#1c1c1f" />
              <polyline points={top.join(" ")} fill="none" stroke="#f4f1ea" strokeWidth="10" />
              <polyline points={bot.join(" ")} fill="none" stroke="#f4f1ea" strokeWidth="10" />
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: h / 2 - 250, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
              <Img src={staticFile("reference-icons/parcel-box.png")} style={{ width: 300 }} />
              <Outlined text={`${k + 1}`} size={440} color={C.green} extrude={C.black} rim={18} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: h - 150, textAlign: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: "0.1em" }}>
              TIP {k + 1}
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ hook */
export const Hook: React.FC = () => {
  const t = L(0);
  return (
    <>
      <Title t="3 TIPS BEFORE" at={t(0)} y={380} color={C.green} />
      <Title t="SHIPPING OUT!" at={t(4)} y={500} />
      <Sticker src="reference-icons/parcel-box.png" x={520} y={1060} w={500} delay={t(1)} />
      <Sticker src="reference-icons/coin-stack.png" x={200} y={1250} w={220} delay={t(6)} from="left" rot={-8} />
      <Sticker src="reference-icons/thumbs-up.png" x={880} y={1250} w={190} delay={t(7)} rot={10} />
      <Pop x={850} y={800} delay={t(9)} from="slam" rot={10} pulse={0.03}>
        <Img src={staticFile(LOGO)} style={{ width: 230, display: "block" }} />
      </Pop>
      <Sfx at={0} name="paper-rustle" vol={0.6} />
      <Sfx at={t(1)} name="whoosh" vol={0.4} />
      <Sfx at={t(4)} name="impact" vol={0.5} />
      <Sfx at={t(6)} name="coins" vol={0.4} />
      <Sfx at={t(9)} name="impact" vol={0.45} />
    </>
  );
};

/* ------------------------------------------------------------------ 1: free rehearsal */
const Receipt: React.FC = () => (
  <div style={{ width: 600, background: "#fff", border: `8px solid ${C.black}`, borderRadius: 24, padding: "26px 34px", boxShadow: `10px 12px 0 ${C.black}`, fontFamily: FONT.display }}>
    <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "0.1em", color: "#777" }}>REHEARSAL RESULT</div>
    {[["Parcel weight", "measured"], ["Volume", "measured"], ["Shipping price", "EXACT"]].map(([a, b], i) => (
      <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderBottom: i < 2 ? "4px dashed #ddd" : "none", fontSize: 38, fontWeight: 800 }}>
        <span>{a}</span>
        <span style={{ color: i === 2 ? C.green : C.black, fontWeight: 900 }}>{b}</span>
      </div>
    ))}
  </div>
);

export const Tip1: React.FC = () => {
  const t = L(1);
  const f = useCurrentFrame();
  const price = t(19); // "the exact shipping price"
  const days = t(23); // "and you have ninety days"
  const mx = interpolate(f, [t(12), t(15) + 10], [340, 700], { ...clamp, easing: EASE.inOut });
  return (
    <>
      <Chip n={1} />
      <Title t="REHEARSAL" at={t(14) - 6} />
      <Sticker src="reference-icons/parcel-box.png" x={540} y={1060} w={470} delay={t(12) - 4} out={price - 6} />
      {f >= t(12) && f < price - 6 && (
        <div style={{ position: "absolute", left: mx, top: 900, transform: "rotate(-8deg)" }}><Magnifier size={190} /></div>
      )}
      <Pop x={830} y={760} delay={t(16)} from="slam" rot={12} pulse={0.05} out={days - 4}>
        <RoundBadge d={250} top="IT'S" big="FREE" />
      </Pop>
      <Title t="EXACT SHIPPING PRICE" at={price} y={600} color={C.white} max={80} out={days - 4} />
      <Pop x={540} y={1060} delay={price + 4} out={days - 4}><Receipt /></Pop>
      <Sticker src={CHECK} x={830} y={1260} w={140} delay={t(22)} rot={10} out={days - 4} />
      <Title t="90 DAYS TO SHIP" at={days} y={600} color={C.white} />
      <Sticker src="reference-icons/calendar.png" x={540} y={1090} w={600} delay={days + 2} />
      <Pop x={540} y={1150} delay={t(26)} from="slam" rot={-4} pulse={0.04}>
        <Banner text="90 DAYS" size={96} bg={C.red} color={C.white} />
      </Pop>
      <Sfx at={t(12)} name="whoosh" vol={0.35} />
      <Sfx at={t(13) + 6} name="camera-shutter" vol={0.5} />
      <Sfx at={t(16)} name="stamp" vol={0.6} />
      <Sfx at={t(16) + 4} name="coupon-confirm" vol={0.4} />
      <Sfx at={price + 4} name="pop" vol={0.45} />
      <Sfx at={t(22)} name="checkmark" vol={0.5} />
      <Sfx at={days + 2} name="page-flip" vol={0.6} />
      <Sfx at={t(26)} name="stamp" vol={0.6} />
      {[0, 1, 2].map((i) => <Sfx key={i} at={t(28) + i * 12} name={i % 2 ? "tock" : "tick"} vol={0.45} />)}
    </>
  );
};

/* ------------------------------------------------------------------ 2: coupons */
export const Tip2: React.FC = () => {
  const t = L(2);
  const link = t(44); // "through the link in my bio"
  return (
    <>
      <Chip n={2} />
      <Title t="COUPONS" at={t(34)} />
      <Pop x={540} y={980} delay={t(35)} from="left" rot={-6} pulse={0.04}>
        <Img src={staticFile(COUPON)} style={{ width: 900, display: "block" }} />
      </Pop>
      <Title t="FOR NEW SIGN-UPS" at={t(36)} y={600} color={C.white} max={88} />
      <Sticker src="reference-icons/coin-stack.png" x={220} y={1260} w={210} delay={t(41)} from="bottom" rot={-8} />
      <Sticker src="reference-icons/zigzag-arrow.png" x={420} y={1290} w={220} delay={t(42)} rot={0} />
      <Pop x={600} y={1320} delay={link} from="slam" rot={-3} pulse={0.05}>
        <Banner text="LINK IN MY BIO" size={60} bg={C.red} color={C.white} />
      </Pop>
      <div style={{ position: "absolute", left: 880, top: 1280 }}><PointArrow delay={link + 8} w={170} /></div>
      <Sfx at={t(35)} name="whoosh" vol={0.45} />
      <Sfx at={t(35) + 6} name="coupon-confirm" vol={0.6} />
      <Sfx at={t(39)} name="cash-register" vol={0.5} />
      <Sfx at={t(41)} name="coins" vol={0.45} />
      <Sfx at={link} name="stamp" vol={0.55} />
      <Sfx at={link + 8} name="pop-high" vol={0.4} />
    </>
  );
};

/* ------------------------------------------------------------------ 3: remove packaging */
export const Tip3: React.FC = () => {
  const t = L(3);
  const f = useCurrentFrame();
  const box = t(57); // "like shoeboxes"
  const lid = interpolate(f, [box + 6, box + 16], [0, 1], clamp);
  const away = interpolate(f, [box + 14, box + 30], [0, 1], { ...clamp, easing: (v) => v * v });
  return (
    <>
      <Chip n={3} />
      <Title t="REMOVE THE" at={t(53)} color={C.white} />
      <Title t="PACKAGING" at={t(55)} y={590} />
      {f >= box + 14 && <div style={{ position: "absolute", left: 540, top: 1080, transform: "translate(-50%,-50%)" }}><Sneaker w={360} /></div>}
      {away < 1 && (
        <Pop x={540 - 760 * away} y={1060} delay={t(53)}>
          <div style={{ transform: `rotate(${-24 * away}deg)` }}><ShoeBox w={500} lid={lid} /></div>
        </Pop>
      )}
      <Pop x={540} y={1320} delay={t(59)} from="slam" rot={-3} pulse={0.05}>
        <Banner text="SAVE $$$" size={92} bg={C.green} color={C.white} />
      </Pop>
      <Sticker src="reference-icons/coin-stack.png" x={180} y={1250} w={200} delay={t(59) + 6} from="bottom" rot={-8} />
      <Sticker src="reference-icons/coin-stack.png" x={900} y={1250} w={190} delay={t(59) + 10} from="bottom" rot={8} />
      <Sticker src={CHECK} x={850} y={860} w={150} delay={t(59) + 14} rot={10} />
      <Sfx at={t(53)} name="pop" vol={0.45} />
      <Sfx at={box + 6} name="tick" vol={0.7} />
      <Sfx at={box + 14} name="whoosh" vol={0.5} />
      <Sfx at={t(59)} name="cash-register" vol={0.6} />
      <Sfx at={t(59) + 6} name="coins" vol={0.45} />
      <Sfx at={t(59) + 14} name="checkmark" vol={0.5} />
    </>
  );
};

/* ------------------------------------------------------------------ end card */
export const End: React.FC = () => (
  <>
    <AbsoluteFill />
    <Pop x={540} y={760} delay={0} from="slam" pulse={0.03}>
      <Img src={staticFile(LOGO)} style={{ width: 420, display: "block" }} />
    </Pop>
    <Title t="SHIP SMARTER" at={10} y={1080} color={C.red} />
    <Pop x={460} y={1230} delay={20} from="slam" rot={-3} pulse={0.05}>
      <Banner text="LINK IN MY BIO" size={62} bg={C.black} color={C.white} />
    </Pop>
    <div style={{ position: "absolute", left: 790, top: 1185 }}><PointArrow delay={28} w={180} /></div>
    <Sticker src="stickers/pikobuy-mascot.png" x={870} y={470} w={260} delay={14} from="right" rot={6} />
    <Sfx at={0} name="impact-cinematic" vol={0.7} />
    <Sfx at={20} name="stamp" vol={0.5} />
    <Sfx at={28} name="pop-high" vol={0.4} />
  </>
);

export const SCENES = [Hook, Tip1, Tip2, Tip3, End];
