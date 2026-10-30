import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring } from "../../components/motion";
import { Bar, Card, Check, Footnote, Label, TipHeader } from "../parts";

const GHOSTS = [
  { left: 20, top: 640, width: 380, rotate: -12, delay: 0.15 },
  { left: 690, top: 600, width: 360, rotate: 10, delay: 0.25 },
];

export const CouponsTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.coupons;

  const enter = useSpring(sec(0.1), theme.spring.bouncy);
  const snap = interpolate(frame, [sec(1.0), sec(1.45)], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const applied = useSpring(sec(1.45), theme.spring.snappy);
  const shippingBar = interpolate(applied, [0, 1], [300, 150], clamp);

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill>
        <TipHeader tone="dark" title={copy.title} support={copy.support} delay={2} />

        {GHOSTS.map((g) => (
          <div key={g.left} style={{ position: "absolute", left: g.left, top: g.top, width: g.width, opacity: 0.4 * (1 - snap * 0.5) }}>
            <Entrance delay={sec(g.delay)} distance={60}>
              <Breathe amplitude={6} period={22}>
                <Img src={staticFile("img/coupon.png")} style={{ width: "100%", display: "block", transform: `rotate(${g.rotate}deg)` }} />
              </Breathe>
            </Entrance>
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: 260,
            top: 640,
            width: 560,
            opacity: Math.min(1, enter * 1.5) * (1 - interpolate(snap, [0.8, 1], [0, 1], clamp)),
            transform: `translateY(${interpolate(snap, [0, 1], [0, 520])}px) scale(${interpolate(enter, [0, 1], [0.6, 1]) * interpolate(snap, [0, 1], [1, 0.35])}) rotate(${interpolate(enter, [0, 1], [-14, -3])}deg)`,
            filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.5))",
            zIndex: 2,
          }}
        >
          <Img src={staticFile("img/coupon.png")} style={{ width: "100%", display: "block" }} />
        </div>

        <div style={{ position: "absolute", top: 1010, left: 130 }}>
          <Entrance delay={sec(0.4)} distance={60}>
            <Card tone="dark" style={{ width: 820, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 26 }}>
              <Label tone="dark">CHECKOUT</Label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 34, color: theme.colors.text }}>Items</span>
                <Bar tone="dark" width={220} height={20} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 34, color: theme.colors.text }}>Eligible shipping</span>
                <Bar tone="dark" width={shippingBar} height={20} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 22px",
                  borderRadius: 20,
                  border: `2px solid ${theme.colors.brand}`,
                  boxShadow: `0 0 ${40 * applied}px ${theme.colors.glow}`,
                  opacity: Math.min(1, applied * 1.5),
                  transform: `scale(${interpolate(applied, [0, 1], [0.9, 1])})`,
                }}
              >
                <Check size={40} color={theme.colors.brand} />
                <span style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 36, color: theme.colors.brand, letterSpacing: "0.02em" }}>
                  {copy.applied}
                </span>
              </div>
            </Card>
          </Entrance>
        </div>

        <Footnote tone="dark" text={copy.footnote} delay={sec(1.7)} top={1500} />
      </AbsoluteFill>
    </SceneShell>
  );
};
