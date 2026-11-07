import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { C, EASE, FONT, SHADOW, SPRING } from "../theme";
import { WHIP } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ fonts */
export const Fonts: React.FC = () => {
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const faces = [
      new FontFace("Montserrat", `url(${staticFile("fonts/Montserrat-Variable.ttf")})`, { weight: "100 900" }),
      new FontFace("Poppins", `url(${staticFile("fonts/Poppins-Black.ttf")})`, { weight: "900" }),
      new FontFace("Instrument Serif", `url(${staticFile("fonts/InstrumentSerif-Italic.ttf")})`, { style: "italic", weight: "400" }),
    ];
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [continueRender, handle]);
  return null;
};

/* ------------------------------------------------------------------ background */
export const Paper: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // very slow drift so the paper never looks like a frozen still
  const sc = 1.06 + 0.015 * Math.sin((frame / fps) * 0.5);
  const x = 8 * Math.sin((frame / fps) * 0.37);
  const y = 10 * Math.cos((frame / fps) * 0.29);
  return (
    <AbsoluteFill style={{ backgroundColor: "#f1f1f3", overflow: "hidden" }}>
      <Img
        src={staticFile("backgrounds/crumpled-paper.png")}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${x}px,${y}px) scale(${sc})` }}
      />
    </AbsoluteFill>
  );
};

/** soft vignette + light grain: keeps the paper from looking like a flat render */
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 80% 70% at 50% 46%, rgba(0,0,0,0) 60%, rgba(30,20,20,0.20) 100%)" }}
      />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "multiply" }}>
        <svg width="100%" height="100%">
          <filter id={`g${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#g${seed})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ camera */
export type Shake = { at: number; amp: number };
/** camera-shake hits for the composition being rendered (global frames) */
export const ShakeContext = createContext<Shake[]>([]);

export const useShake = () => {
  const frame = useCurrentFrame();
  const shakes = useContext(ShakeContext);
  let x = 0, y = 0, r = 0;
  for (const s of shakes) {
    const d = frame - s.at;
    if (d < 0 || d > 22) continue;
    const k = s.amp * Math.exp(-d / 5);
    x += k * Math.sin(d * 2.7 + s.at);
    y += k * Math.cos(d * 3.3 + s.at * 0.5);
    r += (k / 30) * Math.sin(d * 2.1);
  }
  return { x, y, r };
};

export const Camera: React.FC<{ shakes: Shake[]; children: React.ReactNode }> = ({ shakes, children }) => (
  <ShakeContext.Provider value={shakes}>
    <CameraInner>{children}</CameraInner>
  </ShakeContext.Provider>
);

const CameraInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { x, y, r } = useShake();
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px,${y}px) rotate(${r}deg)` }}>{children}</AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ scene shell with whip pan */
type Dir = "up" | "left" | "right" | "down";
const vec = (d: Dir) =>
  d === "up" ? [0, -1] : d === "down" ? [0, 1] : d === "left" ? [-1, 0] : [1, 0];

/**
 * Wraps a scene. Incoming whip: content flies in from opposite of `dir` with motion blur.
 * Outgoing whip: content leaves toward `exitDir` during the final WHIP frames (sequence runs dur + WHIP).
 */
export const SceneShell: React.FC<{
  dur: number;
  enter?: Dir | null;
  exit?: Dir | null;
  children: React.ReactNode;
}> = ({ dur, enter = "up", exit = "up", children }) => {
  const frame = useCurrentFrame();
  let tx = 0, ty = 0, blur = 0, sc = 1;
  if (enter && frame < WHIP + 2) {
    const p = interpolate(frame, [0, WHIP + 2], [1, 0], { ...clamp, easing: EASE.out });
    const [vx, vy] = vec(enter);
    tx = -vx * 1400 * p;
    ty = -vy * 2100 * p;
    blur = 26 * p;
    sc = 1 + 0.12 * p;
  }
  if (exit && frame >= dur) {
    const p = interpolate(frame, [dur, dur + WHIP], [0, 1], { ...clamp, easing: EASE.in });
    const [vx, vy] = vec(exit);
    tx += vx * 1400 * p;
    ty += vy * 2100 * p;
    blur += 26 * p;
    sc *= 1 + 0.1 * p;
  }
  const dirBlur = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : "none";
  return (
    <AbsoluteFill style={{ transform: `translate(${tx}px,${ty}px) scale(${sc})`, filter: dirBlur }}>
      {children}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ stickers */
type From = "pop" | "left" | "right" | "top" | "bottom" | "slam" | "drop";
export const Sticker: React.FC<{
  src: string;
  x: number; // centre x
  y: number; // centre y
  w: number; // width px
  delay?: number;
  rot?: number;
  from?: From;
  idle?: number; // idle wobble amount
  out?: number; // frame to pop out
  shadow?: boolean;
  z?: number;
  flip?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ src, x, y, w, delay = 0, rot = 0, from = "pop", idle = 1, out, shadow = true, z, flip, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  if (f < 0) return null;
  const cfg = from === "slam" ? SPRING.slam : SPRING.pop;
  const s = spring({ frame: f, fps, config: cfg });
  let sc = s, tx = 0, ty = 0, r = rot;
  const travel = 1300;
  if (from === "pop") r = rot + (1 - s) * -28;
  if (from === "slam") { sc = interpolate(Math.min(s, 1.03), [0, 1], [2.8, 1]); }
  if (from === "left") { tx = -travel * (1 - s); sc = 1; r = rot - (1 - s) * 20; }
  if (from === "right") { tx = travel * (1 - s); sc = 1; r = rot + (1 - s) * 20; }
  if (from === "top") { ty = -travel * (1 - s); sc = 1; }
  if (from === "bottom") { ty = travel * (1 - s); sc = 1; }
  if (from === "drop") { ty = -500 * (1 - s); sc = 1; r = rot + (1 - s) * 14; }
  // idle breathing
  const seed = random(src + x + y) * 10;
  const t = frame / fps;
  ty += idle * 5 * Math.sin(t * 2.4 + seed);
  r += idle * 1.3 * Math.sin(t * 1.9 + seed * 2);
  sc *= 1 + idle * 0.012 * Math.sin(t * 3.1 + seed);
  let op = from === "slam" ? interpolate(f, [0, 3], [0, 1], clamp) : interpolate(s, [0, 0.15], [0, 1], clamp);
  if (out !== undefined && frame >= out) {
    const p = interpolate(frame - out, [0, 8], [0, 1], { ...clamp, easing: EASE.in });
    sc *= 1 - p;
    op *= 1 - p;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        transform: `translate(-50%,-50%) translate(${tx}px,${ty}px) rotate(${r}deg) scale(${sc}) ${flip ? "scaleX(-1)" : ""}`,
        opacity: op,
        zIndex: z,
        filter: shadow ? SHADOW.sticker : undefined,
        ...style,
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      {children}
    </div>
  );
};

/** Generic pop wrapper for any element (badges, built graphics, logo) */
export const Pop: React.FC<{
  x: number; y: number; delay?: number; rot?: number; from?: From; idle?: number; out?: number;
  shadow?: boolean; z?: number; children: React.ReactNode; scale?: number;
  /** beat pulse amount (e.g. 0.04) synced to the 120 BPM music once the element has landed */
  pulse?: number;
}> = ({ x, y, delay = 0, rot = 0, from = "pop", idle = 1, out, shadow = true, z, children, scale = 1, pulse = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  if (f < 0) return null;
  const s = spring({ frame: f, fps, config: from === "slam" ? SPRING.slam : SPRING.pop });
  let sc = s, tx = 0, ty = 0, r = rot + (1 - s) * -24;
  if (from === "slam") { sc = interpolate(Math.min(s, 1.03), [0, 1], [3.2, 1]); r = rot; }
  if (from === "left") { tx = -1300 * (1 - s); sc = 1; }
  if (from === "right") { tx = 1300 * (1 - s); sc = 1; }
  if (from === "top") { ty = -1300 * (1 - s); sc = 1; r = rot; }
  if (from === "bottom") { ty = 1300 * (1 - s); sc = 1; r = rot; }
  if (from === "drop") { ty = -500 * (1 - s); sc = 1; }
  const t = frame / fps;
  const seed = (x * 13 + y * 7) % 10;
  ty += idle * 4 * Math.sin(t * 2.2 + seed);
  r += idle * 1.1 * Math.sin(t * 1.7 + seed);
  let op = from === "slam" ? interpolate(f, [0, 3], [0, 1], clamp) : interpolate(s, [0, 0.15], [0, 1], clamp);
  if (pulse && f > 24) sc *= 1 + pulse * Math.exp(-(frame % 30) / 5);
  if (out !== undefined && frame >= out) {
    const p = interpolate(frame - out, [0, 8], [0, 1], { ...clamp, easing: EASE.in });
    sc *= 1 - p; op *= 1 - p;
  }
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, zIndex: z, opacity: op,
        transform: `translate(-50%,-50%) translate(${tx}px,${ty}px) rotate(${r}deg) scale(${sc * scale})`,
        filter: shadow ? SHADOW.sticker : undefined,
      }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ typography */
/** Sticker text: colour fill, heavy black outline, optional white outer rim (cut-out look). */
export const Outlined: React.FC<{
  text: string;
  size: number;
  color?: string;
  stroke?: number;
  rim?: number; // white outer rim
  extrude?: string; // colour of offset block shadow
  extrudeOffset?: number;
  spacing?: number;
  style?: React.CSSProperties;
  /** render only one layer; used by multi-letter animations so outlines never cover a neighbour's fill */
  pass?: "all" | "rim" | "extrude" | "stroke" | "fill";
}> = ({ text, size, color = C.red, stroke, rim = 0, extrude, extrudeOffset, spacing = -0.02, style, pass = "all" }) => {
  const sw = stroke ?? Math.max(6, Math.min(size * 0.11, 10 + size * 0.035));
  const base: React.CSSProperties = {
    fontFamily: FONT.display,
    fontWeight: FONT.heavy,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${spacing}em`,
    whiteSpace: "pre",
    textTransform: "uppercase",
  };
  const layer = (extra: React.CSSProperties, key: string) => (
    <span key={key} style={{ ...base, position: "absolute", left: 0, top: 0, ...extra }}>{text}</span>
  );
  const eo = extrudeOffset ?? size * 0.07;
  return (
    <span style={{ position: "relative", display: "inline-block", ...base, ...style }}>
      <span style={{ ...base, visibility: "hidden" }}>{text}</span>
      {rim > 0 && (pass === "all" || pass === "rim") &&
        layer({ color: C.white, WebkitTextStroke: `${(sw + rim) * 2}px ${C.white}`, transform: extrude ? `translate(${eo * 0.3}px, ${eo * 0.5}px)` : undefined }, "rim")}
      {rim > 0 && extrude && (pass === "all" || pass === "rim") &&
        layer({ color: C.white, WebkitTextStroke: `${(sw + rim) * 2}px ${C.white}`, transform: `translate(${eo * 0.6}px, ${eo}px)` }, "rim2")}
      {extrude && (pass === "all" || pass === "extrude") &&
        layer(
          { color: extrude, WebkitTextStroke: `${sw * 2}px ${C.black}`, transform: `translate(${eo * 0.6}px, ${eo}px)` },
          "ex"
        )}
      {extrude && (pass === "all" || pass === "extrude") && layer({ color: extrude, transform: `translate(${eo * 0.6}px, ${eo}px)` }, "exf")}
      {(pass === "all" || pass === "stroke") && layer({ color, WebkitTextStroke: `${sw * 2}px ${C.black}` }, "st")}
      {(pass === "all" || pass === "fill") && layer({ color }, "fill")}
    </span>
  );
};

/** Per-letter pop-in (letters fly in rotated with elastic overshoot, like the reference captions). */
export const PopText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  delay?: number;
  stagger?: number;
  color?: string;
  rim?: number;
  extrude?: string;
  rot?: number;
  idle?: number;
  out?: number;
}> = ({ text, x, y, size, delay = 0, stagger = 2, color = C.red, rim = 0, extrude, rot = 0, idle = 1, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let outScale = 1, outOp = 1;
  if (out !== undefined && frame >= out) {
    const p = interpolate(frame - out, [0, 8], [0, 1], { ...clamp, easing: EASE.in });
    outScale = 1 - p; outOp = 1 - p;
  }
  const chars = Array.from(text);
  const passes = ["rim", "extrude", "stroke", "fill"] as const;
  const row = (pass: (typeof passes)[number] | null) => (
    <div style={{ display: "flex", position: pass === null ? "relative" : "absolute", left: 0, top: 0, visibility: pass === null ? "hidden" : undefined }}>
      {chars.map((ch, i) => {
        const f = frame - delay - i * stagger;
        const s = f < 0 ? 0 : spring({ frame: f, fps, config: SPRING.letter });
        const rr = (random(text + i) - 0.5) * 70 * (1 - s);
        const dy = (random(text + i + "y") - 0.3) * -size * 1.2 * (1 - s);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: pass === null ? undefined : `translateY(${dy}px) rotate(${rr}deg) scale(${s})`,
              opacity: pass === null ? 1 : interpolate(s, [0, 0.2], [0, 1], clamp),
            }}
          >
            <Outlined text={ch} size={size} color={color} rim={rim} extrude={extrude} pass={pass ?? "all"} />
          </span>
        );
      })}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot + idle * 0.8 * Math.sin(t * 1.6 + x)}deg) scale(${outScale})`,
        filter: SHADOW.text,
        opacity: outOp,
        whiteSpace: "pre",
      }}
    >
      {row(null)}
      {passes.map((p) => (rim > 0 || p !== "rim") && (extrude || p !== "extrude") ? <React.Fragment key={p}>{row(p)}</React.Fragment> : null)}
    </div>
  );
};

/** Word-level punch-in for supporting lines (faster read than per-letter). */
export const PunchWords: React.FC<{
  words: { t: string; color?: string }[];
  x: number;
  y: number;
  size: number;
  delay?: number;
  stagger?: number;
  rim?: number;
  gap?: number;
  out?: number;
}> = ({ words, x, y, size, delay = 0, stagger = 5, rim = 0, gap, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let outScale = 1;
  if (out !== undefined && frame >= out) outScale = 1 - interpolate(frame - out, [0, 8], [0, 1], { ...clamp, easing: EASE.in });
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${outScale})`,
        display: "flex", gap: gap ?? size * 0.28, filter: SHADOW.text, whiteSpace: "pre",
      }}
    >
      {words.map((w, i) => {
        const f = frame - delay - i * stagger;
        const s = f < 0 ? 0 : spring({ frame: f, fps, config: SPRING.pop });
        return (
          <span key={i} style={{ display: "inline-block", transform: `scale(${s}) translateY(${(1 - s) * 40}px)`, opacity: s > 0.02 ? 1 : 0 }}>
            <Outlined text={w.t} size={size} color={w.color ?? C.white} rim={rim} />
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ graphics */
export const SpeedLines: React.FC<{ x: number; y: number; w: number; h: number; delay?: number; dir?: 1 | -1 }> = ({
  x, y, w, h, delay = 0, dir = 1,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  if (f < 0) return null;
  const lines = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "visible" }}>
      {lines.map((i) => {
        const yy = (i / 8) * h;
        const len = 120 + random(`sl${i}`) * 220;
        const speed = 40 + random(`sp${i}`) * 30;
        const off = ((f * speed + random(`o${i}`) * w) % (w + len)) - len;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: yy,
              left: dir === 1 ? w - off - len : off,
              width: len,
              height: 9,
              borderRadius: 9,
              background: C.black,
              opacity: 0.75,
            }}
          />
        );
      })}
    </div>
  );
};

/** Yellow label banner (tilted), like the reference's highlighted captions. */
export const Banner: React.FC<{ text: string; size: number; bg?: string; color?: string; pad?: number }> = ({
  text, size, bg = C.white, color = C.black, pad,
}) => (
  <div
    style={{
      background: bg,
      border: `7px solid ${C.black}`,
      borderRadius: 18,
      padding: `${pad ?? size * 0.22}px ${size * 0.45}px`,
      boxShadow: `8px 10px 0 ${C.black}`,
      fontFamily: FONT.display,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1,
      color,
      whiteSpace: "pre",
      letterSpacing: "-0.01em",
    }}
  >
    {text}
  </div>
);

export const Logo: React.FC<{ w: number; backing?: boolean; src?: string }> = ({ w, backing = true, src = "logos/pikobuy-logo.png" }) => (
  // Official PIKOBUY icon, used as-is (no recolour / redraw). White backing = sticker cut margin.
  <div
    style={{
      width: w + (backing ? w * 0.06 : 0),
      padding: backing ? w * 0.03 : 0,
      background: backing ? C.white : "transparent",
      borderRadius: w * 0.25,
    }}
  >
    <Img src={staticFile(src)} style={{ width: w, height: "auto", display: "block" }} />
  </div>
);

export const Flash: React.FC<{ at: number; dur?: number; color?: string; max?: number }> = ({ at, dur = 10, color = "#fff", max = 0.85 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + dur], [0, max, 0], { ...clamp, easing: EASE.out });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o }} />;
};
