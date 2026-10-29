import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { copy } from "../copy";
import { theme } from "../theme";
import { SceneShell } from "../components/layers";
import { Breathe, Entrance, useSec, useSpring, WordReveal } from "../components/motion";
import { display } from "../components/type";

const CouponCard: React.FC<{ index: number; delay: number }> = ({ index, delay }) => {
  const coupon = copy.coupons[index];
  const count = useSpring(delay + 4, theme.spring.counter);
  const value = Math.round(interpolate(count, [0, 1], [0, coupon.percent]));
  return (
    <Entrance delay={delay} from="right" distance={120}>
      <Breathe amplitude={3} period={30} phase={index * 1.4}>
        <div
          style={{
            width: 860,
            display: "flex",
            alignItems: "center",
            gap: 28,
            padding: "24px 32px",
            borderRadius: 30,
            background: theme.colors.white,
            boxShadow: "0 24px 50px -24px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              background: theme.colors.inkText,
              color: theme.colors.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.fonts.display,
              fontWeight: 900,
              fontSize: 42,
            }}
          >
            {index + 1}
          </div>
          <div>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontWeight: 600,
                fontSize: 24,
                letterSpacing: "0.16em",
                color: theme.colors.inkDim,
              }}
            >
              {coupon.label}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: 900,
                fontSize: 52,
                letterSpacing: "-0.02em",
                color: theme.colors.inkText,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
              {coupon.suffix}
            </div>
          </div>
        </div>
      </Breathe>
    </Entrance>
  );
};

export const OfferScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();

  const swing = useSpring(sec(0.35), theme.spring.bouncy);
  const sway = Math.sin(frame / 26) * 1.2;

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 290, width: 920 }}>
          <WordReveal text={copy.offerKicker} delay={sec(0.05)} style={display(88, theme.colors.inkText)} />
        </div>

        <div
          style={{
            position: "absolute",
            top: 470,
            width: 960,
            opacity: Math.min(1, swing * 1.5),
            transform: `translateX(${interpolate(swing, [0, 1], [900, 0])}px) rotate(${interpolate(swing, [0, 1], [24, -3]) + sway}deg) scale(${interpolate(swing, [0, 1], [0.8, 1])})`,
            filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.22))",
          }}
        >
          <Img src={staticFile("img/coupon.png")} style={{ width: "100%", display: "block" }} />
        </div>

        <div style={{ position: "absolute", top: 930, display: "flex", flexDirection: "column", gap: 20 }}>
          {copy.coupons.map((c, i) => (
            <CouponCard key={c.label} index={i} delay={sec(1.5) + i * sec(0.3)} />
          ))}
        </div>

        <div style={{ position: "absolute", top: 1300, width: 920 }}>
          <WordReveal text={copy.offerLine} delay={sec(2.8)} style={display(74, theme.colors.inkText)} />
        </div>

        <div style={{ position: "absolute", top: 1510, width: 920 }}>
          <Entrance delay={sec(3.6)} distance={20}>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontWeight: 500,
                fontSize: 30,
                color: theme.colors.inkDim,
                textAlign: "center",
              }}
            >
              {copy.offerFootnote}
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
