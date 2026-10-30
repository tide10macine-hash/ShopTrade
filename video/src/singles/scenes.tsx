import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { PLATFORMS, singlesCopy } from "./copy";
import { Pill, SceneShell } from "../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring } from "../components/motion";
import { Bar, Card, Check, Label, Parcel, Sneaker } from "../tips/parts";
import { AlarmClock, ChinaFlag, ShoppingBag, Stamp, Sticker } from "./parts";

const FloatingBags: React.FC<{ tone: "dark" | "light" }> = ({ tone }) => {
  const frame = useCurrentFrame();
  const spots = [
    { x: 70, y: 1500, s: 120, p: 0 },
    { x: 860, y: 1420, s: 150, p: 1.5 },
    { x: 900, y: 300, s: 100, p: 3 },
    { x: 60, y: 380, s: 90, p: 4.2 },
  ];
  return (
    <>
      {spots.map((b) => (
        <div
          key={b.x}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y + Math.sin(frame / 25 + b.p) * 14,
            opacity: tone === "dark" ? 0.18 : 0.12,
            transform: `rotate(${Math.sin(frame / 40 + b.p) * 10}deg)`,
          }}
        >
          <ShoppingBag size={b.s} color={theme.colors.festive} />
        </div>
      ))}
    </>
  );
};

export const HookSingles: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = singlesCopy.hook;

  const card = useSpring(sec(0.6), theme.spring.smooth);
  const flip = interpolate(frame, [sec(1.0), sec(2.2)], [1, copy.day], { ...clamp, easing: theme.ease.out });
  const toWhite = interpolate(frame, [durationInFrames - 5, durationInFrames], [0, 1], clamp);

  return (
    <SceneShell tone="dark" exitAt={durationInFrames + 1}>
      <FloatingBags tone="dark" />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 250 }}>
          <Entrance delay={0} distance={60} config={theme.spring.bouncy}>
            <ChinaFlag width={300} />
          </Entrance>
        </div>
        <div style={{ position: "absolute", top: 540, width: 960 }}>
          <Sticker text={copy.headline} delay={sec(0.25)} size={104} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 820,
            width: 520,
            opacity: Math.min(1, card * 1.5),
            transform: `perspective(1200px) rotateY(${interpolate(card, [0, 1], [70, 0])}deg) translateY(${interpolate(card, [0, 1], [120, 0])}px)`,
          }}
        >
          <div style={{ borderRadius: 48, overflow: "hidden", background: theme.colors.white, boxShadow: "0 50px 90px -30px rgba(0,0,0,0.7)" }}>
            <div
              style={{
                background: theme.colors.festive,
                padding: "26px 0",
                textAlign: "center",
                fontFamily: theme.fonts.display,
                fontWeight: 900,
                fontSize: 64,
                letterSpacing: "0.06em",
                color: theme.colors.white,
              }}
            >
              {copy.month}
            </div>
            <div
              style={{
                textAlign: "center",
                fontFamily: theme.fonts.display,
                fontWeight: 900,
                fontSize: 300,
                lineHeight: 1.1,
                color: theme.colors.inkText,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(flip)}
            </div>
          </div>
          <Stamp kind="check" delay={sec(2.4)} size={150} style={{ position: "absolute", right: -50, bottom: -40 }} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.white, opacity: toWhite }} />
    </SceneShell>
  );
};

const PRODUCTS = [
  { label: "SNEAKERS", side: -1, top: 720, kind: "shoe" },
  { label: "JACKETS", side: 1, top: 860, kind: "jacket" },
  { label: "BAGS", side: -1, top: 1120, kind: "bag" },
] as const;

const ProductArt: React.FC<{ kind: "shoe" | "jacket" | "bag" }> = ({ kind }) => {
  if (kind === "shoe") return <Sneaker width={200} tone="light" />;
  if (kind === "bag") return <ShoppingBag size={130} color={theme.colors.inkText} />;
  return (
    <svg width="130" height="130" viewBox="0 0 24 24" fill="none">
      <path d="M8 3l4 2 4-2 5 4-2 4-2-1v11H7V10l-2 1-2-4z" fill="#D8CBB3" stroke={theme.colors.inkDim} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M12 5v16" stroke={theme.colors.inkDim} strokeWidth="0.8" />
    </svg>
  );
};

const PhoneShell: React.FC<{ width: number; children: React.ReactNode }> = ({ width, children }) => (
  <div
    style={{
      width,
      height: width * 1.95,
      borderRadius: width * 0.16,
      background: "#0E0F11",
      padding: width * 0.035,
      boxSizing: "border-box",
      boxShadow: "0 50px 90px -30px rgba(0,0,0,0.45)",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: width * 0.13,
        background: theme.colors.paper,
        overflow: "hidden",
        padding: "48px 22px 22px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {children}
    </div>
  </div>
);

export const DealsSingles: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = singlesCopy.deals;

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <FloatingBags tone="light" />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 240, width: 960 }}>
          <Sticker text={copy.headline} delay={2} size={100} color={theme.colors.festive} />
          <Entrance delay={sec(0.5)} distance={20}>
            <div style={{ marginTop: 26, fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 42, color: theme.colors.inkText, textAlign: "center" }}>
              {copy.support}
            </div>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 600 }}>
          <Entrance delay={sec(0.2)} distance={200}>
            <PhoneShell width={380}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", background: theme.colors.white, borderRadius: 18, padding: 12 }}>
                  <div style={{ width: 70, height: 70, borderRadius: 14, background: theme.colors.ui }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Bar tone="light" width={150} height={14} />
                    <Bar tone="light" width={90} height={14} />
                  </div>
                </div>
              ))}
            </PhoneShell>
          </Entrance>
        </div>

        {PRODUCTS.map((p, i) => (
          <div key={p.label} style={{ position: "absolute", top: p.top, left: p.side < 0 ? 40 : 700 }}>
            <Entrance delay={sec(0.7) + i * sec(0.3)} from={p.side < 0 ? "right" : "left"} distance={260} config={theme.spring.smooth}>
              <Breathe amplitude={6} period={24} phase={i}>
                <Card tone="light" style={{ width: 300, boxSizing: "border-box", padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative" }}>
                  <div style={{ height: 130, display: "flex", alignItems: "center" }}>
                    <ProductArt kind={p.kind} />
                  </div>
                  <Label tone="light">{p.label}</Label>
                  <div
                    style={{
                      position: "absolute",
                      top: -16,
                      right: -14,
                      padding: "8px 16px",
                      borderRadius: 999,
                      background: theme.colors.festive,
                      color: theme.colors.white,
                      fontFamily: theme.fonts.display,
                      fontWeight: 900,
                      fontSize: 26,
                      transform: "rotate(8deg)",
                    }}
                  >
                    {copy.tag}
                  </div>
                </Card>
              </Breathe>
            </Entrance>
          </div>
        ))}
      </AbsoluteFill>
    </SceneShell>
  );
};

// Local seconds where the voiceover names each platform.
const NAMED_AT = [1.4, 2.4, 3.3];

export const PlatformsSingles: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const slots = [
    { left: 330, top: 600, size: 420 },
    { left: 70, top: 1130, size: 330 },
    { left: 680, top: 1130, size: 330 },
  ];

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 260, width: 960 }}>
          <Sticker text={singlesCopy.platforms.headline} delay={2} size={100} />
        </div>
        {PLATFORMS.map((platform, i) => {
          const slot = slots[i];
          return (
            <div key={platform.name} style={{ position: "absolute", left: slot.left - (i === 0 ? 0 : 0), top: slot.top, width: slot.size }}>
              <Entrance delay={sec(NAMED_AT[i]) - 3} distance={80} config={theme.spring.bouncy}>
                <Breathe amplitude={6} period={26} phase={i * 1.3}>
                  <div style={{ position: "relative" }}>
                    <Img
                      src={staticFile(platform.logo)}
                      style={{
                        width: slot.size,
                        height: slot.size,
                        display: "block",
                        borderRadius: slot.size * 0.22,
                        boxShadow: "0 40px 70px -24px rgba(0,0,0,0.8)",
                      }}
                    />
                    <Stamp kind="check" delay={sec(NAMED_AT[i] + 0.35)} size={slot.size * 0.34} style={{ position: "absolute", right: -24, bottom: -24 }} />
                  </div>
                </Breathe>
              </Entrance>
              <div style={{ marginTop: 26 }}>
                <Sticker text={platform.name} delay={sec(NAMED_AT[i]) + 3} size={i === 0 ? 72 : 60} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </SceneShell>
  );
};

export const QuickSingles: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = singlesCopy.quick;

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <FloatingBags tone="light" />
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 300 }}>
          <Entrance delay={0} distance={30}>
            <Pill tone="light" style={{ fontSize: 34, padding: "20px 36px" }}>
              {copy.support}
            </Pill>
          </Entrance>
        </div>
        <div style={{ position: "absolute", top: 480 }}>
          <Entrance delay={sec(0.15)} config={theme.spring.bouncy} distance={120}>
            <AlarmClock size={620} />
          </Entrance>
        </div>
        <div style={{ position: "absolute", top: 1160, width: 960 }}>
          <Sticker text={copy.headline} delay={sec(0.9)} size={190} color={theme.colors.festive} />
        </div>
        <div style={{ position: "absolute", top: 1440 }}>
          <Entrance delay={sec(1.3)} config={theme.spring.snappy}>
            <div
              style={{
                padding: "14px 34px",
                borderRadius: 22,
                background: theme.colors.inkText,
                color: theme.colors.gold,
                fontFamily: theme.fonts.display,
                fontWeight: 900,
                fontSize: 64,
                letterSpacing: "0.04em",
              }}
            >
              {copy.date}
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

const CouponRow: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const tick = useSpring(delay, theme.spring.bouncy);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 6px", borderBottom: `1px solid ${theme.colors.glassEdge}` }}>
      <div>
        <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 46, color: theme.colors.text }}>{text}</div>
        <div style={{ marginTop: 8 }}>
          <Bar tone="dark" width={240} height={14} />
        </div>
      </div>
      <div style={{ transform: `scale(${Math.min(1.1, tick)})`, opacity: Math.min(1, tick * 2) }}>
        <Check size={64} color={theme.colors.brand} />
      </div>
    </div>
  );
};

export const CouponsSingles: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = singlesCopy.coupons;
  const fan = useSpring(sec(0.4), theme.spring.smooth);
  const sway = Math.sin(frame / 24) * 1.5;

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 240, display: "flex", alignItems: "center", gap: 24 }}>
          <Entrance delay={0} config={theme.spring.bouncy}>
            <Img src={staticFile("img/logo.png")} style={{ width: 130, height: 130, borderRadius: 30, boxShadow: `0 0 50px ${theme.colors.glow}` }} />
          </Entrance>
          <Sticker text={copy.headline} delay={sec(0.15)} size={70} />
        </div>

        <div style={{ position: "absolute", top: 480, width: 760, height: 360 }}>
          {[-1, 1, 0].map((dir) => (
            <div
              key={dir}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 760,
                opacity: dir === 0 ? Math.min(1, fan * 1.5) : 0.45 * Math.min(1, fan),
                transform: `translateX(${dir * 70 * fan}px) translateY(${dir === 0 ? 0 : -30 * fan}px) rotate(${dir * 9 * fan + (dir === 0 ? sway - 3 : 0)}deg) scale(${dir === 0 ? interpolate(fan, [0, 1], [0.7, 1]) : 0.86})`,
                filter: dir === 0 ? `drop-shadow(0 0 40px ${theme.colors.glow})` : undefined,
              }}
            >
              <Img src={staticFile("img/coupon.png")} style={{ width: "100%", display: "block" }} />
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", top: 900 }}>
          <Entrance delay={sec(0.9)} distance={60}>
            <Card tone="dark" style={{ width: 820, boxSizing: "border-box", padding: "26px 34px" }}>
              <Label tone="dark">{copy.panel}</Label>
              <CouponRow text={copy.row} delay={sec(1.8)} />
              <CouponRow text={copy.row} delay={sec(2.2)} />
            </Card>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 1330, width: 960 }}>
          <Sticker text={copy.offer} delay={sec(2.6)} size={86} />
        </div>
        <div style={{ position: "absolute", top: 1480 }}>
          <Entrance delay={sec(3.0)} config={theme.spring.snappy}>
            <Pill tone="dark" style={{ color: theme.colors.brand, fontSize: 32 }}>
              {copy.who}
            </Pill>
          </Entrance>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

export const CtaSingles: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const sec = useSec();
  const copy = singlesCopy.cta;

  const wipe = interpolate(frame, [sec(1.9), sec(2.5)], [0, Math.hypot(width, height) / 2 + 40], { ...clamp, easing: theme.ease.inOut });
  const zoom = interpolate(frame, [sec(2.5), durationInFrames], [1, 1.05], { ...clamp, easing: theme.ease.inOut });
  const bounce = Math.abs(Math.sin(frame / 7)) * 12;
  const d = sec(2.5);

  return (
    <SceneShell tone="light" exitAt={durationInFrames + 1}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 420 }}>
          <Entrance delay={0} distance={200}>
            <PhoneShell width={420}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Img src={staticFile("img/logo.png")} style={{ width: 70, height: 70, borderRadius: 18 }} />
                <Bar tone="light" width={160} height={18} />
              </div>
              <Img src={staticFile("img/coupon.png")} style={{ width: "100%", display: "block", marginTop: 20 }} />
              <Img src={staticFile("img/coupon.png")} style={{ width: "100%", display: "block", opacity: 0.8 }} />
              <div style={{ marginTop: "auto", padding: "20px 0", borderRadius: 999, background: theme.colors.brand, textAlign: "center", fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 30, color: theme.colors.inkText }}>
                SIGN UP
              </div>
            </PhoneShell>
          </Entrance>
        </div>
        <div style={{ position: "absolute", top: 1180, left: 40 }}>
          <Entrance delay={sec(0.3)} from="left" distance={160} config={theme.spring.bouncy}>
            <Breathe amplitude={8} period={22}>
              <Parcel width={240} />
            </Breathe>
          </Entrance>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: theme.colors.ink, clipPath: `circle(${wipe}px at 50% 50%)` }}>
        <AbsoluteFill style={{ alignItems: "center", transform: `scale(${zoom})` }}>
          <div style={{ position: "absolute", top: 300 }}>
            <Entrance delay={d} config={theme.spring.bouncy}>
              <Img src={staticFile("img/logo.png")} style={{ width: 260, borderRadius: 60, display: "block", boxShadow: `0 0 70px ${theme.colors.glow}` }} />
            </Entrance>
          </div>
          <div style={{ position: "absolute", top: 650, width: 960 }}>
            <Sticker text={copy.headline} delay={d + 4} size={104} />
          </div>
          <div style={{ position: "absolute", top: 960, width: 920 }}>
            <Entrance delay={d + sec(0.5)} distance={30}>
              <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 60, color: theme.colors.text, textAlign: "center" }}>{copy.support}</div>
            </Entrance>
          </div>
          <div style={{ position: "absolute", top: 1140, width: 960, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Sticker text={copy.final} delay={d + sec(1.0)} size={74} color={theme.colors.festive} />
            <Entrance delay={d + sec(1.3)} config={theme.spring.snappy}>
              <svg width="90" height="90" viewBox="0 0 24 24" fill="none" style={{ transform: `translateY(${bounce}px)` }}>
                <path d="M12 3v16M5 12l7 7 7-7" stroke={theme.colors.gold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Entrance>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneShell>
  );
};
