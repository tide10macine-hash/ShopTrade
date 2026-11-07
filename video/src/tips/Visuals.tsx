import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Pop } from "../components/core";
import { Phone } from "../reasons/graphics";
import { useTheme } from "./Background";
import { CheckoutCard, PhotoCard, PlanCard, ToggleRow } from "./cards";
import {
  Ban, Battery, Bottle, Camera, Hoodie, NeonCheck, OpenBox, Puffer, QuestionTile, RefreshRing, ShoeBox, Sneaker, Sparkle, TShirt, VacuumBag,
} from "./icons";
import { DURATION, SECTIONS, T, TE, sectionEnd } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const COUPON = "stickers/pikobuy-coupon-2x40-shipping.png";
const LOGO = "logos/pikobuy-logo-official.png";
const glow = (c: string, r = 26) => ({ filter: `drop-shadow(0 0 ${r}px ${c})` });

/** neon "#N" that slams in on "Number ..." and blows out before the tip */
const NumberCard: React.FC<{ n: number; from: number; until: number }> = ({ n, from, until }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  if (f < from || f > until + 8) return null;
  const s = spring({ frame: f - from, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const o = interpolate(f, [until, until + 8], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute", left: 540, top: 960, transform: `translate(-50%,-50%) scale(${(0.4 + 0.6 * s) * (1 + 0.6 * o)})`,
        opacity: 1 - o, filter: o > 0 ? `blur(${10 * o}px)` : undefined,
        fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 380, color: t.accent, letterSpacing: "-0.04em",
        textShadow: `0 0 30px ${t.accent}, 0 0 80px ${t.accent}, 0 10px 0 rgba(0,0,0,0.35)`,
      }}
    >
      #{n}
    </div>
  );
};

const Coupon: React.FC<{ w: number }> = ({ w }) => <Img src={staticFile(COUPON)} style={{ width: w, display: "block", ...glow("rgba(90,220,255,0.7)", 22) }} />;

const Sparkles: React.FC<{ at: number; x: number; y: number; spread?: number; color?: string }> = ({ at, x, y, spread = 260, color }) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < 0 || d > 40) return null;
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r = interpolate(d, [0, 24], [40, spread], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
        const sc = interpolate(d, [0, 6, 40], [0, 1, 0], clamp);
        return (
          <div key={i} style={{ position: "absolute", left: x + Math.cos(a) * r, top: y + Math.sin(a) * r, transform: `translate(-50%,-50%) scale(${sc})` }}>
            <Sparkle size={44} color={color} />
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ sections */
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const t = useTheme();
  const boxOut = T(10) - 4;
  return (
    <>
      <Pop x={540} y={1010} delay={0} out={boxOut} shadow={false} idle={0.4}>
        <OpenBox w={430}>
          <div style={{ position: "absolute", left: 70, top: interpolate(f, [8, 20], [140, 40], clamp) }}><Hoodie w={170} /></div>
          <div style={{ position: "absolute", left: 200, top: interpolate(f, [16, 28], [150, 60], clamp) }}><TShirt w={150} /></div>
        </OpenBox>
      </Pop>
      {f >= T(8) && f < boxOut + 8 && (
        <div style={{ position: "absolute", left: 540, top: 990, transform: `translate(-50%,-50%) scale(${interpolate(f, [T(8), T(8) + 10, boxOut, boxOut + 8], [0.6, 1, 1, 0], clamp)})` }}>
          <RefreshRing size={640} color={t.accent} rot={(f - T(8)) * 6} />
        </div>
      )}
      <Pop x={540} y={980} delay={T(10)} shadow={false} idle={0.3}>
        <PlanCard ticks={[1e9, 1e9, 1e9, 1e9, 1e9]} reveal={false} />
      </Pop>
    </>
  );
};

const Tip1: React.FC = () => (
  <>
    <NumberCard n={1} from={SECTIONS[1].from} until={T(18) - 4} />
    <Pop x={520} y={900} delay={T(20)} from="left" rot={-8} out={T(22) - 4} shadow={false}><Coupon w={640} /></Pop>
    <Pop x={570} y={1110} delay={T(20) + 8} from="right" rot={6} out={T(22) - 2} shadow={false}><Coupon w={640} /></Pop>
    <Pop x={540} y={1000} delay={T(22)} shadow={false} idle={0.25}>
      <CheckoutCard warnAt={T(24)} applyAt={T(30) + 4} />
    </Pop>
    <Pop x={880} y={760} delay={T(30) - 8} from="right" rot={12} out={T(32)} shadow={false}><Coupon w={300} /></Pop>
    <Sparkles at={T(30) + 6} x={540} y={1000} spread={360} color="#7dffa8" />
  </>
);

const Tip2: React.FC = () => {
  const f = useCurrentFrame();
  const drop = (at: number) => interpolate(f, [at, at + 12], [-420, 0], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
  return (
    <>
      <NumberCard n={2} from={SECTIONS[2].from} until={T(36) - 4} />
      <Pop x={540} y={1030} delay={T(36)} shadow={false} idle={0.3}>
        <OpenBox w={420}>
          {f >= T(38) - 6 && <div style={{ position: "absolute", left: 60, top: 40 + drop(T(38) - 6) }}><Hoodie w={170} /></div>}
          {f >= T(38) + 4 && <div style={{ position: "absolute", left: 200, top: 52 + drop(T(38) + 4) }}><TShirt w={150} /></div>}
        </OpenBox>
      </Pop>
      <Pop x={200} y={1220} delay={T(40)} shadow={false}><Ban size={190}><Bottle w={90} /></Ban></Pop>
      <Pop x={880} y={1220} delay={T(42)} shadow={false}><Ban size={190}><Battery w={84} /></Ban></Pop>
      <Pop x={540} y={720} delay={T(44)} shadow={false}><NeonCheck size={150} /></Pop>
    </>
  );
};

const Tip3: React.FC = () => {
  const f = useCurrentFrame();
  const t = useTheme();
  const flash = interpolate(f, [T(50), T(50) + 2, T(50) + 14], [0, 1, 0], clamp);
  const slide = interpolate(f, [T(57), T(57) + 12], [0, 1], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
  return (
    <>
      <NumberCard n={3} from={SECTIONS[3].from} until={T(47) - 4} />
      <Pop x={540} y={1000} delay={T(47)} out={T(52) - 6} shadow={false} idle={0.3}>
        <Camera w={420} flash={flash} />
      </Pop>
      <Pop x={540 - 210 * slide} y={1000} delay={T(52)} shadow={false} idle={0.3}>
        <PhotoCard kind="seller" w={330} />
      </Pop>
      <Sparkles at={T(56)} x={540} y={960} spread={240} />
      <Pop x={750} y={1000} delay={T(59)} from="right" shadow={false} idle={0.3}>
        <PhotoCard kind="qc" w={330} />
      </Pop>
      <Pop x={540} y={1000} delay={T(64)} from="slam" shadow={false}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 200, color: "#ff4d4d", textShadow: "0 0 30px #ff4d4d", lineHeight: 1 }}>≠</div>
      </Pop>
      {f >= T(50) && f < T(52) && (
        <div style={{ position: "absolute", left: 540, top: 1260, transform: "translateX(-50%)", fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 40, color: t.accent, letterSpacing: "0.1em", textShadow: `0 0 16px ${t.accent}` }}>
          REAL ITEM PHOTOS
        </div>
      )}
    </>
  );
};

const Tip4: React.FC = () => {
  const f = useCurrentFrame();
  const on = T(75);
  const lid = interpolate(f, [on + 2, on + 12], [0, 1], clamp);
  const away = interpolate(f, [on + 10, on + 24], [0, 1], { ...clamp, easing: (v) => v * v });
  const ghost = interpolate(f, [T(76), T(76) + 8], [0, 1], clamp);
  return (
    <>
      <NumberCard n={4} from={SECTIONS[4].from} until={T(67) - 4} />
      {/* sneaker is revealed when the box is removed */}
      {f >= on && (
        <div style={{ position: "absolute", left: 540, top: 1060, transform: "translate(-50%,-50%)" }}>
          <Sneaker w={320} />
        </div>
      )}
      {away < 1 && (
        <Pop x={540 - 700 * away} y={1040} delay={T(67)} shadow={false} idle={0.3}>
          <div style={{ opacity: 1 - away, transform: `rotate(${-20 * away}deg)` }}><ShoeBox w={420} lid={lid} /></div>
        </Pop>
      )}
      <Pop x={540} y={780} delay={T(70)} shadow={false} idle={0.2}>
        <ToggleRow onAt={on} />
      </Pop>
      {ghost > 0 && (
        <div
          style={{
            position: "absolute", left: 540, top: 1050, width: 440, height: 300, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * ghost})`, opacity: ghost,
            border: "6px dashed #ff5a5a", borderRadius: 18, boxShadow: "0 0 30px rgba(255,80,80,0.6), inset 0 0 30px rgba(255,80,80,0.25)",
          }}
        >
          <div style={{ position: "absolute", top: -58, left: 0, right: 0, textAlign: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 38, color: "#ff6b6b", textShadow: "0 0 14px #ff4d4d" }}>
            YOU PAY FOR THIS
          </div>
          {f >= T(80) &&
            [0, 1, 2].map((i) => {
              const d = f - T(80) - i * 4;
              const p = interpolate(d, [0, 20], [0, 1], clamp);
              return <div key={i} style={{ position: "absolute", left: 300 + i * 30, top: 60 + i * 50, width: 70 - i * 10, height: 50 - i * 6, borderRadius: 40, background: "rgba(255,255,255,0.85)", opacity: p * (1 - p * 0.3), transform: `translateX(${p * 60}px) scale(${p})` }} />;
            })}
        </div>
      )}
    </>
  );
};

const Tip5: React.FC = () => {
  const f = useCurrentFrame();
  const squeeze = interpolate(f, [T(84), T(85) + 20], [0, 1], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 2) });
  const puff = interpolate(f, [T(86), T(88) + 10], [0.7, 1.35], clamp);
  return (
    <>
      <NumberCard n={5} from={SECTIONS[5].from} until={T(83) - 4} />
      <Pop x={540} y={1000} delay={T(83)} out={T(86) - 6} shadow={false} idle={0.3}>
        <div style={{ position: "relative" }}>
          <VacuumBag w={400} squeeze={squeeze}><Puffer w={300} puff={1 - 0.5 * squeeze} /></VacuumBag>
          {squeeze > 0.6 && (
            <div style={{ position: "absolute", top: -64, left: 0, right: 0, textAlign: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 40, color: "#7dffa8", textShadow: "0 0 16px #2bd46a" }}>
              LESS VOLUME
            </div>
          )}
        </div>
      </Pop>
      <Pop x={540} y={1060} delay={T(86)} shadow={false} idle={0.3}>
        <OpenBox w={420} flap={0.6}>
          <div style={{ position: "absolute", left: 60, top: -40 - 60 * (puff - 0.7) }}><Puffer w={300} puff={puff} /></div>
        </OpenBox>
      </Pop>
      {[0, 1, 2].map((i) => (
        <Pop key={i} x={[200, 880, 540][i]} y={[1180, 1180, 720][i]} delay={T(90) + i * 8} from="slam" rot={[-12, 10, -4][i]} shadow={false}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 84, color: "#ff5a5a", textShadow: "0 0 20px #ff3b3b", border: "6px solid #ff5a5a", borderRadius: 18, padding: "0 18px" }}>$$$</div>
        </Pop>
      ))}
    </>
  );
};

const Recap: React.FC = () => {
  const ticks = [0, 1, 2, 3, 4].map((k) => T(95) + k * 9);
  return (
    <>
      <Pop x={540} y={930} delay={SECTIONS[6].from + 4} shadow={false} idle={0.25}>
        <PlanCard ticks={ticks} />
      </Pop>
      <Pop x={540} y={1250} delay={T(102)} from="slam" shadow={false} pulse={0.05}>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 70, color: "#7dffa8", textShadow: "0 0 24px #2bd46a", border: "6px solid #7dffa8", borderRadius: 22, padding: "4px 26px" }}>SAVED $$$</div>
      </Pop>
      <Sparkles at={T(102)} x={540} y={1250} spread={320} color="#7dffa8" />
    </>
  );
};

const Plug: React.FC = () => {
  const f = useCurrentFrame();
  const t = useTheme();
  const up = interpolate(f, [T(118), T(118) + 14], [0, 1], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
  const logoOut = T(126) - 6;
  const rays = interpolate(f, [T(113), T(113) + 10], [0, 1], clamp) * (1 - up * 0.6);
  const tap = T(129) + 4;
  const tapP = interpolate(f, [tap, tap + 16], [0, 1], clamp);
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Pop key={i} x={300 + i * 240} y={1000} delay={T(108) + i * 6} out={T(113) - 6} shadow={false}>
          <QuestionTile size={170} color={t.accent} />
        </Pop>
      ))}
      {f >= T(113) && f < logoOut + 10 && (
        <div
          style={{
            position: "absolute", left: 540, top: 1000 - 230 * up, width: 900, height: 900, transform: `translate(-50%,-50%) rotate(${(f - T(113)) * 0.8}deg) scale(${1 - 0.4 * up})`,
            opacity: rays * 0.55 * interpolate(f, [logoOut, logoOut + 10], [1, 0], clamp),
            background: `repeating-conic-gradient(from 0deg, ${t.accent} 0deg 8deg, transparent 8deg 22deg)`,
            maskImage: "radial-gradient(circle, black 15%, transparent 65%)", WebkitMaskImage: "radial-gradient(circle, black 15%, transparent 65%)",
          }}
        />
      )}
      <Pop x={540} y={1000 - 230 * up} delay={T(113)} from="slam" out={logoOut} shadow={false} scale={1 - 0.4 * up} idle={0.3}>
        <Img src={staticFile(LOGO)} style={{ width: 380, display: "block", ...glow("rgba(120,240,255,0.8)", 30) }} />
      </Pop>
      <Sparkles at={T(113) + 4} x={540} y={1000} spread={330} />
      <Pop x={540} y={1100} delay={T(121)} from="bottom" rot={-6} out={T(126) - 4} shadow={false} pulse={0.04}>
        <Coupon w={820} />
      </Pop>
      <Pop x={540} y={1010} delay={T(126)} from="bottom" shadow={false} idle={0.2}>
        <div style={{ position: "relative" }}>
          <Phone w={400} src="stickers/link-in-bio-reezy-repz.jpg" />
          {f >= tap && (
            <div style={{ position: "absolute", left: 200, top: 345, width: 30 + 140 * tapP, height: 30 + 140 * tapP, borderRadius: "50%", border: `5px solid ${t.accent}`, transform: "translate(-50%,-50%)", opacity: 1 - tapP, boxShadow: `0 0 20px ${t.accent}` }} />
          )}
          <div style={{ position: "absolute", left: 290, top: 360 + 30 * Math.max(0, 1 - Math.abs((f - tap) / 6)), opacity: interpolate(f, [T(129) - 10, T(129)], [0, 1], clamp) }}>
            <svg viewBox="0 0 60 70" width={90} height={105} style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.5))" }}>
              <path d="M 20 6 Q 20 0 26 0 Q 32 0 32 6 L 32 30 L 46 32 Q 56 34 54 46 L 50 62 Q 48 70 40 70 L 22 70 Q 16 70 12 64 L 2 46 Q 0 40 6 38 Q 12 36 16 42 L 20 48 Z" fill="#fff" stroke="#111" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Pop>
    </>
  );
};

const COMPONENTS = [Intro, Tip1, Tip2, Tip3, Tip4, Tip5, Recap, Plug];

/** renders only the active section's visuals (the glitch covers the hard cut) */
export const Visuals: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, transform: "scale(1.1)", transformOrigin: "540px 1000px" }}>
      {SECTIONS.map((s, i) => {
        const C = COMPONENTS[i];
        const end = i + 1 < SECTIONS.length ? sectionEnd(i) : DURATION;
        if (f < s.from || f >= end) return null;
        return <C key={s.key} />;
      })}
    </div>
  );
};

export { TE };
