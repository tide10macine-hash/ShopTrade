import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FONT } from "../theme";
import { clamp } from "./motion";

export const asset = (p: string) => staticFile(`assets/${p}`);

/** Reference-video icon (extracted transparent PNG) at a given width. */
export const Ref: React.FC<{ name: string; w: number }> = ({ name, w }) => (
  <Img src={asset(`reference-icons/${name}.png`)} style={{ width: w, height: "auto", display: "block" }} />
);

/** Official logo shown untouched inside a white sticker card (aspect ratio preserved). */
export const LogoCard: React.FC<{ file: string; w: number; pad?: number; radius?: number; bg?: string }> = ({
  file, w, pad = 14, radius = 34, bg = C.white,
}) => (
  <div style={{ background: bg, padding: pad, borderRadius: radius + pad, boxShadow: `0 0 0 6px ${C.black}` }}>
    <Img src={asset(`logos/${file}`)} style={{ width: w, height: "auto", display: "block", borderRadius: radius }} />
  </div>
);

/** Photo card (white border, slight rotation is handled by the parent). Ken Burns inside. */
export const PhotoCard: React.FC<{ file: string; w: number; h: number; kbFrom?: number }> = ({ file, w, h, kbFrom = 0 }) => {
  const f = useCurrentFrame();
  const k = interpolate(f - kbFrom, [0, 180], [1, 1.1], { ...clamp, easing: EASE.inOut });
  return (
    <div style={{ width: w, height: h, padding: 14, background: C.white, borderRadius: 18, boxShadow: `0 0 0 5px ${C.black}` }}>
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 8 }}>
        <Img src={asset(file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${k}) translateX(${(k - 1) * -120}px)` }} />
      </div>
    </div>
  );
};

/** Green check badge, matching the reference's sticker check. Tick draws on. */
export const CheckBadge: React.FC<{ size: number; drawAt?: number }> = ({ size, drawAt = 0 }) => {
  const f = useCurrentFrame();
  const d = interpolate(f, [drawAt + 3, drawAt + 13], [1, 0], { ...clamp, easing: EASE.out });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      <circle cx="50" cy="50" r="49" fill={C.white} />
      <circle cx="50" cy="50" r="43" fill={C.green} />
      <circle cx="50" cy="50" r="43" fill="url(#cbg)" />
      <defs>
        <radialGradient id="cbg" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <path d="M27 52 L43 67 L74 34" fill="none" stroke={C.white} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={d} />
    </svg>
  );
};

/** Big red down arrow (price drop). Grows from the top. */
export const DownArrow: React.FC<{ w: number; h: number; growAt?: number }> = ({ w, h, growAt = 0 }) => {
  const f = useCurrentFrame();
  const g = interpolate(f, [growAt, growAt + 14], [0.15, 1], { ...clamp, easing: EASE.back });
  return (
    <svg width={w} height={h} viewBox="0 0 100 160" style={{ display: "block", overflow: "visible", transformOrigin: "50% 0%", transform: `scaleY(${g})` }}>
      <path d="M32 0 H68 V98 H96 L50 156 L4 98 H32 Z" fill={C.red} stroke={C.white} strokeWidth="9" strokeLinejoin="round" paintOrder="stroke" />
      <path d="M32 0 H68 V98 H96 L50 156 L4 98 H32 Z" fill={C.red} stroke={C.black} strokeWidth="4" strokeLinejoin="round" />
      <path d="M38 6 H46 V100 H38 Z" fill="#fff" opacity="0.22" />
    </svg>
  );
};

/** Coupon card: perforated ticket, red & yellow. */
export const Coupon: React.FC<{ w: number; value: string; label?: string; tone?: "red" | "yellow" }> = ({
  w, value, label = "COUPON", tone = "red",
}) => {
  const h = w * 0.46;
  const bg = tone === "red" ? C.red : C.yellow;
  const fg = tone === "red" ? C.yellow : C.red;
  const notch = h * 0.16;
  const mask = `radial-gradient(circle at 0 50%, transparent ${notch}px, #000 ${notch + 1}px) left/51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent ${notch}px, #000 ${notch + 1}px) right/51% 100% no-repeat`;
  return (
    <div style={{ filter: `drop-shadow(0 0 0 ${C.black}) drop-shadow(3px 0 0 ${C.black}) drop-shadow(-3px 0 0 ${C.black}) drop-shadow(0 3px 0 ${C.black}) drop-shadow(0 -3px 0 ${C.black}) drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff)` }}>
      <div style={{ width: w, height: h, background: bg, WebkitMask: mask, mask, borderRadius: 18, position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: w * 0.68, top: 12, bottom: 12, borderLeft: `5px dashed ${fg}`, opacity: 0.9 }} />
        <div style={{ width: w * 0.68, textAlign: "center", fontFamily: FONT.display, color: fg, fontSize: h * 0.5, lineHeight: 1, WebkitTextStroke: `3px ${C.black}` }}>
          {value}
          <div style={{ fontFamily: FONT.condensed, fontSize: h * 0.17, letterSpacing: "0.08em", WebkitTextStroke: "0px", color: fg }}>OFF {label}</div>
        </div>
        <div style={{ width: w * 0.32, textAlign: "center", fontFamily: FONT.condensed, color: fg, fontSize: h * 0.16, lineHeight: 1.05, transform: "rotate(-90deg)" }}>
          11.11
        </div>
      </div>
    </div>
  );
};

/** Swinging price tag sticker with a crossed-out higher price and a lower one. */
export const PriceTag: React.FC<{ w: number; old: string; now: string; swingAt?: number }> = ({ w, old, now, swingAt = 0 }) => {
  const f = useCurrentFrame();
  const sw = Math.sin((f - swingAt) / 7) * 14 * Math.exp(-(Math.max(0, f - swingAt)) / 35);
  const h = w * 0.62;
  const strike = interpolate(f, [swingAt + 10, swingAt + 20], [0, 1], { ...clamp, easing: EASE.out });
  return (
    <div style={{ transform: `rotate(${sw}deg)`, transformOrigin: "8% 50%" }}>
      <svg width={w} height={h} viewBox="0 0 160 100" style={{ display: "block", overflow: "visible" }}>
        <path d="M30 4 H152 a6 6 0 0 1 6 6 V90 a6 6 0 0 1 -6 6 H30 L2 50 Z" fill={C.yellow} stroke={C.white} strokeWidth="10" strokeLinejoin="round" />
        <path d="M30 4 H152 a6 6 0 0 1 6 6 V90 a6 6 0 0 1 -6 6 H30 L2 50 Z" fill={C.yellow} stroke={C.black} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="26" cy="50" r="7" fill="#fff" stroke={C.black} strokeWidth="3" />
        <text x="96" y="42" textAnchor="middle" fontFamily="Anton" fontSize="30" fill={C.ink}>{old}</text>
        <line x1="62" y1="32" x2={62 + 70 * strike} y2="32" stroke={C.red} strokeWidth="6" strokeLinecap="round" />
        <text x="96" y="84" textAnchor="middle" fontFamily="LilitaOne" fontSize="40" fill={C.red} stroke={C.black} strokeWidth="1.5">{now}</text>
      </svg>
    </div>
  );
};

/** Speed lines behind moving vehicles. */
export const SpeedLines: React.FC<{ w: number; h: number; seed?: number }> = ({ w, h, seed = 0 }) => {
  const f = useCurrentFrame();
  const lines = Array.from({ length: 7 }, (_, i) => {
    const y = ((i * 37 + seed * 13) % 100) / 100 * h;
    const len = 80 + ((i * 53) % 5) * 40;
    const x = ((f * 38 + i * 170 + seed * 90) % (w + 400)) - 200;
    return <rect key={i} x={w - x} y={y} width={len} height={i % 2 ? 7 : 11} rx={5} fill={C.black} opacity={0.75} />;
  });
  return <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>{lines}</svg>;
};

/** Burst of yellow rays behind hero elements (comic-style promo). */
export const Burst: React.FC<{ size: number; spinAt?: number; color?: string }> = ({ size, spinAt = 0, color = C.yellow }) => {
  const f = useCurrentFrame();
  const rays = 16;
  const pts: string[] = [];
  for (let i = 0; i < rays * 2; i++) {
    const a = (i / (rays * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 50 : 34;
    pts.push(`${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", transform: `rotate(${(f - spinAt) * 0.35}deg)` }}>
      <polygon points={pts.join(" ")} fill={color} stroke={C.black} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
};

/** Hand-drawn style circle that draws around a target. */
export const DrawCircle: React.FC<{ w: number; h: number; at: number; color?: string }> = ({ w, h, at, color = C.red }) => {
  const f = useCurrentFrame();
  const d = interpolate(f, [at, at + 16], [1, 0], { ...clamp, easing: EASE.inOut });
  return (
    <svg width={w} height={h} viewBox="0 0 100 60" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <path d="M50 4 C82 3 97 16 96 31 C95 48 72 57 48 56 C22 55 4 46 5 30 C6 14 26 5 56 7" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={d} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 12 }} />
    </svg>
  );
};

export const Flash: React.FC<{ at: number; len?: number; color?: string }> = ({ at, len = 8, color = "#fff" }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 1, at + len], [0, 0.85, 0], { ...clamp, easing: EASE.out });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, zIndex: 50 }} />;
};
