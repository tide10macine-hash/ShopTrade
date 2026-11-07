import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { Banner, Outlined, Pop, PopText, Sticker } from "../components/core";
import { Sfx } from "../components/Sfx";
import { Phone } from "../reasons/graphics";
import { CheckoutCard, PhotoCard, ToggleRow } from "./cards";
import { Ban, Battery, Bottle, Camera, Hoodie, OpenBox, Puffer, ShoeBox, Sneaker, TShirt, VacuumBag } from "./icons";
import { L, SECTIONS, T } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const COUPON = "stickers/pikobuy-coupon-2x40-shipping.png";
const LOGO = "logos/pikobuy-logo-official.png";
const CHECK = "reference-icons/checkmark.png";

/* ------------------------------------------------------------------ shared pieces */

/** text size that fits a line into ~900 px */
const fit = (s: string, max = 118) => Math.min(max, Math.round(900 / (s.length * 0.74)));

/** "MISTAKE #N" chip that flips to a green "FIX" chip at `fixAt` (local frames) */
const Chip: React.FC<{ n: number; fixAt: number }> = ({ n, fixAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fixed = f >= fixAt;
  const s = spring({ frame: f - (fixed ? fixAt : 0), fps, config: { damping: 10, stiffness: 260, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", left: 540, top: 365, transform: `translate(-50%,-50%) rotate(${fixed ? 2 : -3}deg) scale(${0.3 + 0.7 * s})` }}>
      <Banner text={fixed ? "THE FIX" : `MISTAKE #${n}`} size={58} bg={fixed ? C.green : C.red} color={C.white} />
    </div>
  );
};

/** big red X stamped over the mistake */
const RedX: React.FC<{ size?: number }> = ({ size = 420 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: "visible" }}>
    {[
      ["M 18 18 L 82 82", "M 82 18 L 18 82"],
    ].flat().map((d, i) => (
      <g key={i}>
        <path d={d} stroke={C.black} strokeWidth="21" strokeLinecap="round" />
        <path d={d} stroke={C.red} strokeWidth="13" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

/** one or two caption lines (sticker letters), each popping in on its word */
const Lines: React.FC<{ lines: { t: string; at: number; color?: string }[]; out?: number; y?: number }> = ({ lines, out, y = 490 }) => (
  <>
    {lines.map((l, k) => (
      <PopText key={k} text={l.t} x={540} y={y + k * 112} size={fit(l.t)} delay={l.at} stagger={1} color={l.color ?? C.red} rim={10} out={out} idle={0.6} />
    ))}
  </>
);

/** 5-4-3-2-1 countdown tracker at the top: current mistake red, finished ones ticked */
export const Tracker: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SECTIONS[1].from - 10) return null;
  const cur = SECTIONS.findIndex((s, i) => f >= s.from && (i + 1 >= SECTIONS.length || f < SECTIONS[i + 1].from));
  return (
    <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22 }}>
      {[5, 4, 3, 2, 1].map((n, k) => {
        const idx = k + 1; // section index of mistake n
        const done = cur > idx;
        const active = cur === idx;
        const appear = interpolate(f, [SECTIONS[1].from - 10 + k * 3, SECTIONS[1].from + k * 3], [0, 1], clamp);
        return (
          <div
            key={n}
            style={{
              width: 74, height: 74, borderRadius: 37, display: "flex", alignItems: "center", justifyContent: "center",
              background: done ? C.green : active ? C.red : C.white, border: `6px solid ${C.black}`,
              transform: `scale(${appear * (active ? 1.18 : 1)})`, boxShadow: "0 6px 0 rgba(0,0,0,0.25)",
              fontFamily: FONT.display, fontWeight: 900, fontSize: 38, color: done || active ? C.white : C.black,
            }}
          >
            {done ? (
              <svg viewBox="0 0 24 24" width={38} height={38}><path d="M 4 12.5 L 9.5 18 L 20 6.5" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : n}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ hook */
export const Hook: React.FC = () => {
  const t = L(0);
  const mid = t(10) - 6; // "Here are five mistakes"
  return (
    <>
      <PopText text="YOUR CHINA HAULS" x={540} y={360} size={fit("YOUR CHINA HAULS", 92)} delay={t(0)} stagger={1} color={C.white} rim={9} out={mid} />
      <PopText text="COST WAY MORE" x={540} y={480} size={fit("COST WAY MORE")} delay={t(4)} stagger={1} color={C.red} rim={10} out={mid} />
      <PopText text="THAN THEY SHOULD!" x={540} y={590} size={fit("THAN THEY SHOULD!", 76)} delay={t(7)} stagger={1} color={C.white} rim={8} out={mid} />
      <Sticker src="reference-icons/parcel-box.png" x={540} y={1060} w={430} delay={t(1)} out={mid} />
      {[0, 1, 2].map((i) => (
        <Pop key={i} x={[230, 850, 760][i]} y={[880, 900, 1270][i]} delay={t(5) + i * 6} from="slam" rot={[-12, 10, -6][i]} out={mid}>
          <Banner text="$$$" size={70} bg={C.red} color={C.white} />
        </Pop>
      ))}
      <Sticker src="reference-icons/zigzag-arrow.png" x={300} y={1300} w={260} delay={t(6)} rot={180} flip out={mid} />

      {/* "5 MISTAKES" */}
      <Pop x={540} y={780} from="slam" delay={t(12)} idle={0.5} pulse={0.04}>
        <Outlined text="5" size={520} color={C.red} extrude={C.black} rim={20} />
      </Pop>
      <PopText text="MISTAKES" x={540} y={1090} size={150} delay={t(13)} stagger={2} color={C.red} rim={12} />
      <PopText text="ALMOST EVERYONE MAKES" x={540} y={1215} size={64} delay={t(14)} stagger={1} color={C.white} rim={7} />
      {[0, 1, 2].map((i) => (
        <Pop key={i} x={[200, 880, 540][i]} y={[600, 620, 1330][i]} delay={t(15) + i * 5} from="slam" rot={[-14, 12, 0][i]}>
          <RedX size={110} />
        </Pop>
      ))}

      <Sfx at={0} name="paper-rustle" vol={0.6} />
      <Sfx at={t(1)} name="pop" vol={0.5} />
      <Sfx at={t(4)} name="impact" vol={0.45} />
      {[0, 1, 2].map((i) => <Sfx key={i} at={t(5) + i * 6} name="stamp" vol={0.35} />)}
      <Sfx at={t(6)} name="whoosh" vol={0.35} />
      <Sfx at={t(7)} name="coins" vol={0.4} />
      <Sfx at={mid} name="whoosh-reverse" vol={0.45} />
      <Sfx at={t(12)} name="impact-cinematic" vol={0.7} />
      <Sfx at={t(13)} name="pop" vol={0.45} />
      {[0, 1, 2].map((i) => <Sfx key={`x${i}`} at={t(15) + i * 5} name="stamp" vol={0.35} />)}
    </>
  );
};

/* ------------------------------------------------------------------ #5 shoeboxes */
export const M5: React.FC = () => {
  const t = L(1);
  const f = useCurrentFrame();
  const fix = t(28); // "Remove them."
  const away = interpolate(f, [fix + 10, fix + 26], [0, 1], { ...clamp, easing: (v) => v * v });
  const lid = interpolate(f, [fix + 2, fix + 12], [0, 1], clamp);
  return (
    <>
      <Chip n={5} fixAt={fix} />
      <Lines lines={[{ t: "SHIPPING", at: t(20) }, { t: "SHOEBOXES", at: t(22) }]} out={t(24) - 4} />
      <Lines lines={[{ t: "= PAYING TO", at: t(24), color: C.white }, { t: "SHIP AIR!", at: t(26) }]} out={fix - 4} />
      <Lines lines={[{ t: "REMOVE THEM!", at: fix + 2, color: C.green }]} y={530} />
      {f >= fix + 10 && (
        <div style={{ position: "absolute", left: 540, top: 1080, transform: "translate(-50%,-50%)" }}><Sneaker w={340} /></div>
      )}
      {away < 1 && (
        <Pop x={540 - 760 * away} y={1060} delay={t(20)}>
          <div style={{ transform: `rotate(${-24 * away}deg)` }}><ShoeBox w={440} lid={lid} /></div>
        </Pop>
      )}
      {f >= t(24) && f < fix && (
        <div style={{ position: "absolute", left: 540, top: 1040, width: 520, height: 360, transform: "translate(-50%,-50%)", border: `7px dashed ${C.red}`, borderRadius: 20 }}>
          <div style={{ position: "absolute", bottom: -64, left: 0, right: 0, textAlign: "center" }}>
            <Outlined text="AIR = $$$" size={52} color={C.red} rim={6} />
          </div>
        </div>
      )}
      <Pop x={540} y={1040} delay={t(26) + 12} from="slam" out={fix - 4}><RedX size={380} /></Pop>
      <Pop x={540} y={800} delay={fix + 6} idle={0.3}><ToggleRow onAt={fix + 2} /></Pop>
      <Sticker src={CHECK} x={830} y={1230} w={150} delay={fix + 26} rot={10} />

      <Sfx at={t(17)} name="stamp" vol={0.6} />
      <Sfx at={t(20)} name="pop" vol={0.5} />
      <Sfx at={t(24)} name="whoosh-reverse" vol={0.35} />
      <Sfx at={t(26) + 12} name="stamp" vol={0.7} />
      <Sfx at={fix + 2} name="tick" vol={0.8} />
      <Sfx at={fix + 10} name="whoosh" vol={0.5} />
      <Sfx at={fix + 26} name="checkmark" vol={0.55} />
    </>
  );
};

/* ------------------------------------------------------------------ #4 puffers */
export const M4: React.FC = () => {
  const t = L(2);
  const f = useCurrentFrame();
  const fix = t(38); // "Ask for vacuum packing"
  const puff = interpolate(f, [t(34), t(36) + 10], [0.7, 1.35], clamp);
  const squeeze = interpolate(f, [t(41), t(45) + 10], [0, 1], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 2) });
  return (
    <>
      <Chip n={4} fixAt={fix} />
      <Lines lines={[{ t: "SENDING PUFFERS", at: t(33) }, { t: "AS THEY ARE", at: t(35), color: C.white }]} out={fix - 4} />
      <Lines lines={[{ t: "VACUUM PACKING", at: fix + 4, color: C.green }, { t: "WAY LESS SPACE", at: t(44), color: C.white }]} />
      <Pop x={540} y={1100} delay={t(33)} out={fix - 2}>
        <OpenBox w={440} flap={0.6}>
          <div style={{ position: "absolute", left: 70, top: -40 - 70 * (puff - 0.7) }}><Puffer w={300} puff={puff} /></div>
        </OpenBox>
      </Pop>
      <Pop x={540} y={1060} delay={t(37)} from="slam" out={fix - 4}><RedX size={400} /></Pop>
      <Pop x={540} y={1060} delay={fix + 6}>
        <div style={{ position: "relative" }}>
          <VacuumBag w={420} squeeze={squeeze}><Puffer w={300} puff={1 - 0.5 * squeeze} /></VacuumBag>
          {squeeze > 0.6 && (
            <div style={{ position: "absolute", bottom: -84, left: 0, right: 0, textAlign: "center" }}>
              <Outlined text="LESS VOLUME" size={50} color={C.green} rim={6} />
            </div>
          )}
        </div>
      </Pop>
      <Sticker src={CHECK} x={840} y={880} w={150} delay={t(46)} rot={10} />

      <Sfx at={t(30)} name="stamp" vol={0.6} />
      <Sfx at={t(33)} name="pop" vol={0.5} />
      <Sfx at={t(34)} name="paper-rustle" vol={0.4} />
      <Sfx at={t(37)} name="stamp" vol={0.7} />
      <Sfx at={fix} name="whoosh" vol={0.45} />
      <Sfx at={t(41)} name="vacuum" vol={0.7} />
      <Sfx at={t(46)} name="checkmark" vol={0.55} />
    </>
  );
};

/* ------------------------------------------------------------------ #3 seller photos */
export const M3: React.FC = () => {
  const t = L(3);
  const f = useCurrentFrame();
  const fix = t(55); // "Always check your real QC photos"
  const flash = interpolate(f, [t(59), t(59) + 2, t(59) + 14], [0, 1, 0], clamp);
  const slide = interpolate(f, [fix, fix + 12], [0, 1], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
  return (
    <>
      <Chip n={3} fixAt={fix} />
      <Lines lines={[{ t: "TRUSTING THE", at: t(51), color: C.white }, { t: "SELLER PHOTOS", at: t(53) }]} out={fix - 4} />
      <Lines lines={[{ t: "CHECK YOUR REAL", at: fix + 4, color: C.white }, { t: "QC PHOTOS!", at: t(59), color: C.green }]} />
      <Pop x={540 - 220 * slide} y={1060} delay={t(53)} scale={1 - 0.15 * slide}><PhotoCard kind="seller" w={340} /></Pop>
      <Pop x={540} y={1060} delay={t(54) + 16} from="slam" out={fix - 4}><RedX size={380} /></Pop>
      <Pop x={790} y={1000} delay={t(56)} out={t(59) + 16}><Camera w={300} flash={flash} /></Pop>
      <Pop x={770} y={1060} delay={t(59) + 12} from="right" scale={0.85}><PhotoCard kind="qc" w={340} /></Pop>
      <Sticker src={CHECK} x={900} y={1270} w={140} delay={t(60) + 20} rot={10} />

      <Sfx at={t(48)} name="stamp" vol={0.6} />
      <Sfx at={t(53)} name="pop" vol={0.5} />
      <Sfx at={t(54) + 16} name="stamp" vol={0.7} />
      <Sfx at={fix} name="whoosh" vol={0.4} />
      <Sfx at={t(56)} name="pop" vol={0.45} />
      <Sfx at={t(59)} name="camera-shutter" vol={0.8} />
      <Sfx at={t(59) + 12} name="whoosh-reverse" vol={0.4} />
      <Sfx at={t(60) + 20} name="checkmark" vol={0.55} />
    </>
  );
};

/* ------------------------------------------------------------------ #2 risky first haul */
export const M2: React.FC = () => {
  const t = L(4);
  const f = useCurrentFrame();
  const fix = t(69); // "Keep it simple"
  const drop = (at: number) => interpolate(f, [at, at + 12], [-420, 0], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
  return (
    <>
      <Chip n={2} fixAt={fix} />
      <Lines lines={[{ t: "A RISKY", at: t(65), color: C.white }, { t: "FIRST HAUL", at: t(67) }]} out={fix - 4} />
      <Lines lines={[{ t: "KEEP IT SIMPLE:", at: fix + 2, color: C.white }, { t: "START WITH CLOTHES", at: t(72), color: C.green }]} />
      {/* risky items: become "banned" at the fix */}
      <Pop x={260} y={f >= fix ? 1260 : 1040} delay={t(66)} rot={-8}>
        {f >= fix ? <Ban size={190}><Bottle w={90} /></Ban> : <Bottle w={130} />}
      </Pop>
      <Pop x={820} y={f >= fix ? 1260 : 1040} delay={t(66) + 6} rot={8}>
        {f >= fix ? <Ban size={190}><Battery w={84} /></Ban> : <Battery w={120} />}
      </Pop>
      <Pop x={540} y={1040} delay={t(68)} from="slam" out={fix - 4}><RedX size={300} /></Pop>
      <Pop x={540} y={1020} delay={t(72) - 4}>
        <OpenBox w={420}>
          {f >= t(74) - 6 && <div style={{ position: "absolute", left: 60, top: 40 + drop(t(74) - 6) }}><Hoodie w={170} /></div>}
          {f >= t(74) + 4 && <div style={{ position: "absolute", left: 200, top: 52 + drop(t(74) + 4) }}><TShirt w={150} /></div>}
        </OpenBox>
      </Pop>
      <Sticker src={CHECK} x={800} y={820} w={140} delay={t(74) + 18} rot={10} />

      <Sfx at={t(62)} name="stamp" vol={0.6} />
      <Sfx at={t(66)} name="pop" vol={0.45} />
      <Sfx at={t(66) + 6} name="pop" vol={0.45} />
      <Sfx at={t(68)} name="stamp" vol={0.7} />
      <Sfx at={fix} name="stamp" vol={0.4} />
      <Sfx at={t(72) - 4} name="pop" vol={0.5} />
      <Sfx at={t(74) - 6} name="whoosh-reverse" vol={0.35} />
      <Sfx at={t(74) + 4} name="whoosh-reverse" vol={0.35} />
      <Sfx at={t(74) + 18} name="checkmark" vol={0.55} />
    </>
  );
};

/* ------------------------------------------------------------------ #1 full shipping price -> PIKOBUY */
export const M1: React.FC = () => {
  const t = L(5);
  const f = useCurrentFrame();
  const fix = t(83); // "New sign-ups on PikoBuy ..."
  const link = t(93);
  const tap = t(93) + 10;
  const tapP = interpolate(f, [tap, tap + 16], [0, 1], clamp);
  return (
    <>
      <Chip n={1} fixAt={fix} />
      <Lines lines={[{ t: "PAYING FULL", at: t(79), color: C.white }, { t: "SHIPPING PRICE", at: t(81) }]} out={fix - 4} />
      <Lines lines={[{ t: "NEW SIGN-UPS GET", at: fix + 2, color: C.white }]} y={490} out={link - 4} />
      <Pop x={540} y={1060} delay={t(79)} out={fix - 2} idle={0.25}>
        <CheckoutCard warnAt={t(80)} applyAt={1e9} />
      </Pop>
      <Pop x={540} y={1060} delay={t(82)} from="slam" out={fix - 4}><RedX size={380} /></Pop>
      {/* PIKOBUY + coupon */}
      <Pop x={540} y={820} delay={t(86)} from="slam" out={link - 4} pulse={0.03}>
        <Img src={staticFile(LOGO)} style={{ width: 300, display: "block" }} />
      </Pop>
      <Pop x={540} y={1170} delay={t(88)} from="bottom" rot={-5} out={link - 4} pulse={0.04}>
        <Img src={staticFile(COUPON)} style={{ width: 860, display: "block" }} />
      </Pop>
      <Sticker src={CHECK} x={900} y={1330} w={130} delay={t(92)} rot={10} out={link - 4} />
      {/* link in bio */}
      <PopText text="LINK IN MY BIO!" x={540} y={500} size={fit("LINK IN MY BIO!", 104)} delay={link} stagger={1} color={C.red} rim={10} />
      <Pop x={540} y={1010} delay={link - 2} from="bottom" idle={0.2}>
        <div style={{ position: "relative" }}>
          <Phone w={400} src="stickers/link-in-bio-reezy-repz.jpg" />
          {f >= tap && (
            <div style={{ position: "absolute", left: 200, top: 345, width: 30 + 140 * tapP, height: 30 + 140 * tapP, borderRadius: "50%", border: `6px solid ${C.red}`, transform: "translate(-50%,-50%)", opacity: 1 - tapP }} />
          )}
          <div style={{ position: "absolute", left: 290, top: 360 + 30 * Math.max(0, 1 - Math.abs((f - tap) / 6)), opacity: interpolate(f, [link + 2, link + 10], [0, 1], clamp) }}>
            <svg viewBox="0 0 60 70" width={90} height={105} style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.4))" }}>
              <path d="M 20 6 Q 20 0 26 0 Q 32 0 32 6 L 32 30 L 46 32 Q 56 34 54 46 L 50 62 Q 48 70 40 70 L 22 70 Q 16 70 12 64 L 2 46 Q 0 40 6 38 Q 12 36 16 42 L 20 48 Z" fill="#fff" stroke="#111" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Pop>
      <Sticker src="stickers/pikobuy-mascot.png" x={880} y={1300} w={300} delay={link + 16} from="right" rot={4} />

      <Sfx at={t(75)} name="stamp" vol={0.7} />
      <Sfx at={t(79)} name="pop" vol={0.5} />
      <Sfx at={t(80)} name="tock" vol={0.6} />
      <Sfx at={t(82)} name="stamp" vol={0.7} />
      <Sfx at={fix} name="whoosh" vol={0.45} />
      <Sfx at={t(86) - 30} name="riser" vol={0.35} />
      <Sfx at={t(86)} name="impact" vol={0.6} />
      <Sfx at={t(88)} name="whoosh" vol={0.45} />
      <Sfx at={t(88) + 6} name="coupon-confirm" vol={0.7} />
      <Sfx at={t(90)} name="cash-register" vol={0.5} />
      <Sfx at={t(92)} name="checkmark" vol={0.5} />
      <Sfx at={link - 2} name="whoosh" vol={0.45} />
      <Sfx at={tap} name="pop-high" vol={0.6} />
      <Sfx at={link + 16} name="whoosh-reverse" vol={0.4} />
    </>
  );
};

export const SCENES = [Hook, M5, M4, M3, M2, M1];
export { T };
