import React from "react";
import { Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE, FONT } from "../theme";
import { Banner, Outlined, Pop, PopText, SpeedLines, Sticker } from "../components/core";
import { Sfx, SfxName } from "../components/Sfx";
import { PointArrow } from "../reasons/graphics";
import { ShoeBox, Sneaker } from "../tips/icons";
import { L, SECTIONS } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CHECK = "reference-icons/checkmark.png";
const LOGO = "logos/pikobuy-logo-official.png";
const COUPON = "stickers/pikobuy-coupon-2x40-shipping.png";
const PARCEL = "reference-icons/parcel-box.png";
const fit = (s: string, max = 130) => Math.min(max, Math.round(900 / (s.length * 0.74)));
const outBack = (v: number) => 1 + 2.2 * Math.pow(v - 1, 3) + 1.2 * Math.pow(v - 1, 2);

/* ------------------------------------------------------------------ shared pieces */

/** sticker title; optional marker highlight that wipes in behind it */
const Title: React.FC<{
  t: string; at: number; y?: number; color?: string; out?: number; max?: number; hl?: string; sfx?: SfxName | null;
}> = ({ t, at, y = 480, color = C.red, out, max, hl, sfx = "pop" }) => {
  const f = useCurrentFrame();
  const size = fit(t, max);
  const w = t.length * size * 0.66 + 50;
  const wipe = interpolate(f, [at + 4, at + 14], [0, 1], { ...clamp, easing: EASE.out });
  const gone = out !== undefined ? interpolate(f, [out, out + 8], [1, 0], clamp) : 1;
  return (
    <>
      {hl && f >= at + 4 && (
        <div
          style={{
            position: "absolute", left: 540 - w / 2, top: y - size * 0.55, width: w, height: size * 1.1, background: hl,
            borderRadius: 14, transform: `scaleX(${wipe}) rotate(-1.5deg)`, transformOrigin: "left center", opacity: gone,
            border: `6px solid ${C.black}`,
          }}
        />
      )}
      <PopText text={t} x={540} y={y} size={size} delay={at} stagger={1} color={color} rim={11} out={out} idle={0.6} />
      {sfx && <Sfx at={at} name={sfx} vol={0.3} />}
    </>
  );
};

const Chip: React.FC<{ n: number; bg: string }> = ({ n, bg }) => (
  <Pop x={540} y={330} delay={26} from="top" rot={-3}>
    <Banner text={`TIP ${n}/3`} size={48} bg={bg} color={C.white} />
  </Pop>
);

/** ink splash ring + dots around a stamp */
const Splash: React.FC<{ at: number; x: number; y: number; color: string }> = ({ at, x, y, color }) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < 0 || d > 30) return null;
  const p = interpolate(d, [0, 18], [0, 1], { ...clamp, easing: EASE.out });
  const o = interpolate(d, [8, 30], [1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: 420 * p, height: 420 * p, borderRadius: "50%", border: `${12 * (1 - p) + 2}px solid ${color}`, transform: "translate(-50%,-50%)", opacity: o }} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + random(`sp${at}${i}`);
        const r = 120 + 160 * p * (0.6 + 0.4 * random(`sr${at}${i}`));
        const s = 10 + 16 * random(`ss${at}${i}`);
        return <div key={i} style={{ position: "absolute", left: x + Math.cos(a) * r, top: y + Math.sin(a) * r, width: s, height: s, borderRadius: "50%", background: color, transform: "translate(-50%,-50%)", opacity: o }} />;
      })}
    </>
  );
};

/** falling coin shower */
const CoinRain: React.FC<{ at: number; n?: number }> = ({ at, n = 14 }) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < 0 || d > 90) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = 120 + random(`cx${i}`) * 840;
        const start = random(`cd${i}`) * 24;
        const y = interpolate(d - start, [0, 40], [-120, 1500 + random(`cy${i}`) * 300], { ...clamp, easing: (v) => v * v });
        const r = (d - start) * (6 + 10 * random(`cr${i}`));
        if (d < start) return null;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${r}deg) scaleX(${Math.cos(r / 30)})` }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #ffe68a, #e9a815 60%, #b87a0a)", border: "5px solid #7a4d05", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 36, color: "#7a4d05" }}>$</div>
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ torn-paper band between tips */
const tornEdge = (seed: string, w: number, y: number, amp: number, down: boolean) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 36) pts.push(`${x},${y + (down ? 1 : -1) * random(`${seed}${x}`) * amp}`);
  return pts;
};

const BAND_COLORS = [C.green, C.red, C.white];
/** dark torn strip with a giant number; enters from a different side each tip (global frames) */
export const TornBand: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {SECTIONS.slice(1, 4).map((s, k) => {
        const d = f - (s.from - 8);
        if (d < 0 || d > 46) return null;
        const p = interpolate(d, [0, 12, 30, 46], [-1, 0, 0.05, 1], { ...clamp, easing: EASE.inOut });
        const h = 680;
        const rot = [-4, 5, -6][k];
        const tx = k === 1 ? -1300 * p : 0; // tip 2 sweeps sideways
        const ty = k === 1 ? 0 : -1500 * p * (k === 2 ? -1 : 1);
        const numScale = interpolate(d, [8, 16, 22], [2.4, 0.92, 1], { ...clamp, easing: EASE.out });
        const top = tornEdge(`t${k}`, 1200, 40, 40, false);
        const bot = tornEdge(`b${k}`, 1200, h - 40, 40, true).reverse();
        return (
          <div key={s.key} style={{ position: "absolute", left: -60, top: 620, width: 1200, height: h, transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`, filter: "drop-shadow(0 22px 18px rgba(0,0,0,0.45))" }}>
            <svg width={1200} height={h} style={{ position: "absolute", inset: 0 }}>
              <polygon points={[...top, ...bot].join(" ")} fill="#1c1c1f" />
              <polyline points={top.join(" ")} fill="none" stroke="#f4f1ea" strokeWidth="10" />
              <polyline points={bot.join(" ")} fill="none" stroke="#f4f1ea" strokeWidth="10" />
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: h / 2 - 250, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
              <div style={{ transform: `scale(${numScale})` }}>
                <Outlined text={`TIP ${k + 1}`} size={300} color={BAND_COLORS[k]} extrude={k === 2 ? C.red : C.black} rim={16} />
              </div>
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
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const boxIn = 10;
  const three = spring({ frame: f, fps, config: { damping: 9, stiffness: 200, mass: 0.7 } });
  return (
    <>
      {/* giant "3" + TIPS */}
      <div style={{ position: "absolute", left: 300, top: 380, transform: `translate(-50%,-50%) scale(${interpolate(three, [0, 1], [2.2, 1])}) rotate(${-8 + 8 * three}deg)` }}>
        <Outlined text="3" size={340} color={C.red} extrude={C.black} rim={18} />
      </div>
      <Pop x={680} y={330} delay={t(1)} from="pop" rot={-4}><Outlined text="TIPS" size={170} color={C.green} rim={12} /></Pop>
      <Title t="BEFORE SHIPPING OUT" at={t(2)} y={580} color={C.white} max={96} sfx="zip-up" />
      {/* delivery truck races in, plane flies over */}
      <SpeedLines x={620} y={940} w={520} h={260} delay={boxIn} />
      <Sticker src="reference-icons/delivery-truck.png" x={520} y={1080} w={720} delay={boxIn} from="right" idle={0.5}>
        <div style={{ position: "absolute", left: "66%", top: "16%", transform: "skewY(5deg) rotate(2deg)" }}>
          <Img src={staticFile(LOGO)} style={{ width: 170, display: "block" }} />
        </div>
      </Sticker>
      {f >= t(6) && (
        <div
          style={{
            position: "absolute", width: 340,
            left: interpolate(f, [t(6), t(6) + 30], [-380, 840], { ...clamp, easing: EASE.out }),
            top: interpolate(f, [t(6), t(6) + 30], [960, 700], { ...clamp, easing: EASE.out }) + 6 * Math.sin(f / 9),
            transform: "translate(-50%,-50%) rotate(-14deg)", filter: `drop-shadow(0 14px 10px rgba(40,30,30,0.3)) blur(${interpolate(f, [t(6), t(6) + 14, t(6) + 22], [10, 3, 0], clamp)}px)`,
          }}
        >
          <Img src={staticFile("reference-icons/airplane.png")} style={{ width: "100%" }} />
        </div>
      )}
      <Sfx at={t(0)} name="kick-boom" vol={0.8} />
      <Sfx at={t(1)} name="rubber-stretch" vol={0.4} />
      <Sfx at={boxIn} name="truck" vol={0.7} />
      <Sfx at={t(6)} name="airplane" vol={0.65} />
      <Sfx at={t(9)} name="shine" vol={0.4} />
    </>
  );
};

/* ------------------------------------------------------------------ 1: free rehearsal */
const RECEIPT = [["Weight", "checked"], ["Size", "checked"], ["Shipping price", "EXACT"]];
const Receipt: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const lines = Math.floor(interpolate(f, [at, at + 36], [0, RECEIPT.length + 0.99], clamp));
  return (
    <div style={{ width: 640, background: "#fff", border: `8px solid ${C.black}`, borderRadius: 24, padding: "24px 34px", boxShadow: `10px 12px 0 ${C.black}`, fontFamily: FONT.display }}>
      <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "0.12em", color: "#666", marginBottom: 6 }}>REHEARSAL RESULT</div>
      {RECEIPT.map(([a, b], i) => (
        <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderBottom: i < 2 ? "4px dashed #ddd" : "none", fontSize: 40, fontWeight: 800, opacity: i < lines ? 1 : 0, transform: `translateY(${i < lines ? 0 : -10}px)` }}>
          <span>{a}</span>
          <span style={{ color: i === 2 ? C.green : C.black, fontWeight: 900, background: i === 2 ? "rgba(29,168,60,0.14)" : undefined, padding: "0 12px", borderRadius: 8 }}>{b}</span>
        </div>
      ))}
    </div>
  );
};

export const Tip1: React.FC = () => {
  const t = L(1);
  const f = useCurrentFrame();
  const scan0 = t(12);
  const free = t(16);
  const price = t(20);
  const pay = t(24);
  const scanY = interpolate(f, [scan0, scan0 + 40], [0, 1], { ...clamp, easing: EASE.inOut });
  const progress = interpolate(f, [scan0, free - 4], [0, 1], clamp);
  return (
    <>
      <Chip n={1} bg={C.green} />
      <Title t="REHEARSAL" at={Math.min(t(14) - 8, 30)} color={C.green} sfx="zip-up" />
      {/* parcel under the scanner */}
      <Pop x={540} y={1050} delay={36} from="bottom" out={price - 6} idle={0.3}>
        <div style={{ position: "relative", width: 480 }}>
          <Img src={staticFile(PARCEL)} style={{ width: 480, display: "block" }} />
          {f >= scan0 && f < free + 20 && (
            <>
              <div style={{ position: "absolute", left: -30, right: -30, top: 30 + 440 * (0.5 - 0.5 * Math.cos(scanY * Math.PI * 2)), height: 10, borderRadius: 5, background: "#29ff6a", boxShadow: "0 0 24px 8px rgba(41,255,106,0.7)" }} />
              <div style={{ position: "absolute", inset: -30, border: "6px solid #29ff6a", borderRadius: 20, opacity: 0.6, boxShadow: "inset 0 0 30px rgba(41,255,106,0.4)" }} />
            </>
          )}
        </div>
      </Pop>
      {f >= scan0 && f < free && (
        <div style={{ position: "absolute", left: 290, top: 1350, width: 500, fontFamily: FONT.display, fontWeight: 900, fontSize: 34, color: C.black, textAlign: "center" }}>
          CHECKING PARCEL…
          <div style={{ marginTop: 10, height: 22, borderRadius: 11, background: "#fff", border: `5px solid ${C.black}`, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: C.green }} />
          </div>
        </div>
      )}
      {/* FREE stamp */}
      <Pop x={790} y={800} delay={free} from="slam" rot={14} out={price - 6} pulse={0.05}>
        <div style={{ border: `12px solid ${C.red}`, borderRadius: 26, padding: "4px 30px", background: "rgba(255,255,255,0.92)", fontFamily: FONT.display, fontWeight: 900, fontSize: 130, color: C.red, letterSpacing: "0.04em", boxShadow: "0 10px 0 rgba(0,0,0,0.2)" }}>FREE</div>
      </Pop>
      <Splash at={free + 2} x={790} y={800} color={C.red} />
      {/* exact price receipt, then "before you pay" */}
      <Title t="EXACT SHIPPING PRICE" at={price} y={600} color={C.red} max={80} sfx={null} out={pay - 4} />
      <Title t="BEFORE YOU PAY!" at={pay} y={600} color={C.green} max={96} sfx="ding-bright" />
      <Pop x={540} y={1050} delay={price + 2} from="pop" idle={0.25}><Receipt at={price + 8} /></Pop>
      <Sticker src={CHECK} x={860} y={1260} w={150} delay={pay + 6} rot={10} />

      <Sfx at={36} name="whoosh-reverse" vol={0.35} />
      <Sfx at={scan0} name="laser-sweep" vol={0.55} />
      {[0, 1, 2].map((i) => <Sfx key={i} at={scan0 + 8 + i * 12} name="scanner-beep" vol={0.4} />)}
      <Sfx at={free} name="stamp" vol={0.75} />
      <Sfx at={free + 3} name="ding-bright" vol={0.45} />
      <Sfx at={price + 8} name="receipt-print" vol={0.55} />
      <Sfx at={pay + 6} name="checkmark" vol={0.45} />
    </>
  );
};

/* ------------------------------------------------------------------ 2: coupons */
/** shipping cost bars: the full-price bar shrinks to the coupon price */
const PriceBars: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 18], [0, 1], { ...clamp, easing: EASE.out });
  const shrink = interpolate(f, [at + 22, at + 40], [1, 0.4], { ...clamp, easing: (v) => outBack(v) });
  const bar = (h: number, color: string, label: string, struck = false) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ width: 190, height: 210 * h * p, background: color, border: `7px solid ${C.black}`, borderRadius: 16, position: "relative" }}>
        {struck && f > at + 22 && <div style={{ position: "absolute", left: -20, right: -20, top: "45%", height: 14, background: C.black, transform: "rotate(-24deg)" }} />}
      </div>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 32, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 80 }}>
      {bar(1, C.red, "FULL PRICE", true)}
      {bar(shrink, C.green, "WITH COUPONS")}
    </div>
  );
};

export const Tip2: React.FC = () => {
  const t = L(2);
  const f = useCurrentFrame();
  const cIn = Math.min(t(29), 32);
  const flip = interpolate(f, [cIn, cIn + 16], [90, 0], { ...clamp, easing: EASE.out });
  const two = t(34);
  const link = t(39);
  return (
    <>
      <Chip n={2} bg={C.red} />
      <Title t="COUPONS" at={Math.min(t(29), 30)} color={C.red} sfx="zip-up" />
      <Title t="FOR NEW SIGN-UPS" at={t(31)} y={600} color={C.green} max={88} sfx={null} out={link - 4} />
      {/* coupon flips in, then fans out to two */}
      <div style={{ position: "absolute", left: 540, top: 800, transform: `translate(-50%,-50%) perspective(1200px) rotateY(${flip}deg)`, opacity: f >= cIn ? 1 : 0 }}>
        {[0, 1].map((i) => {
          const fan = interpolate(f, [two, two + 12], [0, 1], { ...clamp, easing: EASE.out });
          return (
            <Img key={i} src={staticFile(COUPON)} style={{ position: i ? "absolute" : "relative", left: 0, top: 0, width: 640, display: "block", transform: `translate(${(i ? 70 : -60) * fan}px, ${(i ? 95 : -55) * fan}px) rotate(${(i ? 6 : -6) * fan}deg)`, filter: "drop-shadow(0 14px 10px rgba(0,0,0,0.3))" }} />
          );
        })}
      </div>
      <Pop x={540} y={1200} delay={t(36)} from="pop" out={link - 4}><PriceBars at={t(36) + 4} /></Pop>
      {/* link in bio card */}
      <Pop x={540} y={1170} delay={link} from="bottom" idle={0.2}>
        <div style={{ width: 640, background: "#fff", border: `8px solid ${C.black}`, borderRadius: 30, boxShadow: `10px 12px 0 ${C.black}`, padding: 26, fontFamily: FONT.display, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Img src={staticFile("stickers/pikobuy-mascot.png")} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 55, background: "#dff6fb", border: `5px solid ${C.black}` }} />
            <div style={{ fontWeight: 900, fontSize: 40 }}>LINK IN BIO</div>
          </div>
          <div style={{ marginTop: 22, background: C.green, color: "#fff", borderRadius: 18, padding: "20px 0", textAlign: "center", fontWeight: 900, fontSize: 38, border: `5px solid ${C.black}`, transform: `scale(${f >= link + 30 && f < link + 38 ? 0.95 : 1})` }}>
            PIKOBUY · 2×40% OFF
          </div>
          <div style={{ position: "absolute", left: 420, top: 160 + 20 * Math.max(0, 1 - Math.abs((f - link - 32) / 6)), opacity: interpolate(f, [link + 14, link + 22], [0, 1], clamp) }}>
            <svg viewBox="0 0 60 70" width={90} height={105} style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.4))" }}>
              <path d="M 20 6 Q 20 0 26 0 Q 32 0 32 6 L 32 30 L 46 32 Q 56 34 54 46 L 50 62 Q 48 70 40 70 L 22 70 Q 16 70 12 64 L 2 46 Q 0 40 6 38 Q 12 36 16 42 L 20 48 Z" fill="#fff" stroke="#111" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Pop>
      <Title t="LINK IN MY BIO" at={link + 4} y={600} color={C.red} max={100} sfx={null} />
      <div style={{ position: "absolute", left: 880, top: 1010 }}><PointArrow delay={link + 10} w={170} /></div>

      <Sfx at={t(29)} name="whoosh" vol={0.5} />
      <Sfx at={t(29) + 6} name="coupon-confirm" vol={0.45} />
      <Sfx at={two} name="bubble-pop" vol={0.6} />
      <Sfx at={two + 6} name="bubble-pop" vol={0.6} />
      <Sfx at={t(36) + 4} name="zip-up" vol={0.35} />
      <Sfx at={t(36) + 22} name="rubber-stretch" vol={0.5} />
      <Sfx at={t(36) + 40} name="cash-register" vol={0.45} />
      <Sfx at={link} name="whoosh-reverse" vol={0.4} />
      <Sfx at={link + 32} name="pop-high" vol={0.5} />
    </>
  );
};

/* ------------------------------------------------------------------ 3: remove packaging */
export const Tip3: React.FC = () => {
  const t = L(3);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const box = t(51); // "like shoeboxes"
  const lid = interpolate(f, [box + 4, box + 12], [0, 1], clamp);
  const jump = spring({ frame: f - (box + 10), fps, config: { damping: 9, stiffness: 180, mass: 0.7 } });
  const away = interpolate(f, [box + 22, box + 40], [0, 1], { ...clamp, easing: (v) => v * v });
  const small = t(53); // "Smaller parcel"
  const shrink = interpolate(f, [small, small + 20], [1, 0.58], { ...clamp, easing: (v) => outBack(v) });
  const cheap = t(55);
  return (
    <>
      <Chip n={3} bg={C.black} />
      <Title t="REMOVE THE" at={Math.min(t(48), 30)} color={C.white} sfx="zip-up" out={small - 4} />
      <Title t="PACKAGING" at={t(50)} y={590} color={C.red} sfx={null} out={small - 4} />
      {/* shoebox opens, sneaker jumps out, box flies away */}
      {f < small && (
        <>
          {f >= box + 10 && (
            <div style={{ position: "absolute", left: 540, top: 1060 - 220 * jump, transform: `translate(-50%,-50%) rotate(${-12 * jump}deg)` }}><Sneaker w={460} /></div>
          )}
          {away < 1 && (
            <Pop x={540 + 800 * away} y={1120 + 200 * away} delay={Math.min(t(48), 32)} from="drop">
              <div style={{ transform: `rotate(${30 * away}deg)` }}><ShoeBox w={520} lid={lid} /></div>
            </Pop>
          )}
        </>
      )}
      {/* smaller parcel */}
      {f >= small && (
        <>
          <CoinRain at={cheap + 2} />
          <Title t="SMALLER PARCEL" at={small} color={C.red} sfx={null} />
          <div style={{ position: "absolute", left: 540, top: 1040, transform: `translate(-50%,-50%) scale(${shrink})` }}>
            <Img src={staticFile(PARCEL)} style={{ width: 560, display: "block" }} />
          </div>
          <div style={{ position: "absolute", left: 540, top: 1040, width: 600, height: 640, transform: "translate(-50%,-50%)", border: `6px dashed ${C.red}`, borderRadius: 24, opacity: interpolate(f, [small + 4, small + 12], [0, 0.8], clamp) }} />
          <Title t="CHEAPER SHIPPING!" at={cheap} y={600} color={C.green} max={90} sfx={null} />
          <Pop x={540} y={1360} delay={cheap + 4} from="slam" rot={-3} pulse={0.05}>
            <Banner text="SAVE $$$" size={92} bg={C.green} color={C.white} />
          </Pop>
        </>
      )}
      <Sfx at={t(48)} name="whoosh-reverse" vol={0.35} />
      <Sfx at={box + 4} name="cardboard-thud" vol={0.55} />
      <Sfx at={box + 10} name="bubble-pop" vol={0.6} />
      <Sfx at={box + 22} name="slide-whistle" vol={0.5} />
      <Sfx at={small} name="rubber-stretch" vol={0.55} />
      <Sfx at={cheap + 2} name="coin-cascade" vol={0.6} />
      <Sfx at={cheap + 4} name="cash-register" vol={0.45} />
    </>
  );
};

/* ------------------------------------------------------------------ end card */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const shine = interpolate(f, [18, 42], [-0.4, 1.4], clamp);
  return (
    <>
      <Pop x={540} y={760} delay={0} from="slam" pulse={0.03}>
        <div style={{ position: "relative", width: 440, overflow: "hidden", borderRadius: 96 }}>
          <Img src={staticFile(LOGO)} style={{ width: 440, display: "block" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 120, left: `${shine * 100}%`, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)", transform: "skewX(-20deg)" }} />
        </div>
      </Pop>
      <Title t="SHIP SMARTER" at={10} y={1090} color={C.red} sfx={null} />
      <Pop x={460} y={1240} delay={22} from="left" rot={-3} pulse={0.05}>
        <Banner text="LINK IN MY BIO" size={62} bg={C.black} color={C.white} />
      </Pop>
      <div style={{ position: "absolute", left: 790, top: 1195 }}><PointArrow delay={30} w={180} /></div>
      <Sfx at={0} name="kick-boom" vol={0.8} />
      <Sfx at={18} name="shine" vol={0.5} />
      <Sfx at={22} name="whoosh" vol={0.4} />
      <Sfx at={30} name="pop-high" vol={0.35} />
    </>
  );
};

export const SCENES = [Hook, Tip1, Tip2, Tip3, End];
