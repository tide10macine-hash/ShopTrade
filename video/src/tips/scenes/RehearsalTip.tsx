import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { clamp, Entrance, useSec, useSpring } from "../../components/motion";
import { Bar, Card, Check, Label, Parcel, TipHeader } from "../parts";

const PARCEL_W = 330;
const PARCEL_LEFT = 375;
const PARCEL_TOP = 760;

const Dimension: React.FC<{
  style: React.CSSProperties;
  label: string;
  vertical?: boolean;
  labelFirst?: boolean;
  reveal: number;
}> = ({ style, label, vertical = false, labelFirst = false, reveal }) => (
  <div
    style={{
      position: "absolute",
      display: "flex",
      alignItems: "center",
      gap: 12,
      opacity: reveal,
      flexDirection: labelFirst ? "row-reverse" : "row",
      ...style,
    }}
  >
    <div
      style={{
        background: theme.colors.inkDim,
        borderRadius: 2,
        ...(vertical ? { width: 3, height: 230 * reveal } : { height: 3, width: 220 * reveal }),
      }}
    />
    <span style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 34, color: theme.colors.inkText, whiteSpace: "nowrap" }}>
      {label}
    </span>
  </div>
);

export const RehearsalTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.rehearsal;
  const [l, w, h] = copy.example.dims;

  const drop = useSpring(sec(0.3), theme.spring.bouncy);
  const weigh = useSpring(sec(0.75), theme.spring.counter);
  const measure = interpolate(frame, [sec(1.4), sec(2.1)], [0, 1], { ...clamp, easing: theme.ease.out });
  const flash = interpolate(frame, [sec(2.3), sec(2.33), sec(2.55)], [0, 0.85, 0], clamp);
  const flip = interpolate(frame, [sec(3.6), sec(4.0)], [0, 1], { ...clamp, easing: theme.ease.inOut });
  const confirmed = flip > 0.5;
  const quoteTitle = copy.fixedQuoteConfirmed ? copy.quoteFixed : copy.quoteAccurate;

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <AbsoluteFill>
        <TipHeader tone="light" title={copy.title} support={copy.support} delay={2} top={220} />

        <div
          style={{
            position: "absolute",
            left: PARCEL_LEFT,
            top: PARCEL_TOP,
            opacity: Math.min(1, drop * 1.5),
            transform: `translateY(${interpolate(drop, [0, 1], [-500, 0])}px)`,
          }}
        >
          <Parcel width={PARCEL_W} />
        </div>

        <Dimension label={`${l} cm`} reveal={measure} style={{ left: PARCEL_LEFT + 40, top: PARCEL_TOP - 20 }} />
        <Dimension label={`${h} cm`} vertical reveal={measure} style={{ left: PARCEL_LEFT + PARCEL_W + 16, top: PARCEL_TOP + 50 }} />
        <Dimension label={`${w} cm`} vertical labelFirst reveal={measure} style={{ right: 1080 - PARCEL_LEFT + 16, top: PARCEL_TOP + 50 }} />

        <div style={{ position: "absolute", top: 1085, left: 290 }}>
          <Entrance delay={sec(0.1)} distance={40}>
            <div style={{ width: 500, height: 38, borderRadius: 14, background: "linear-gradient(180deg, #3A3F46, #22262B)" }} />
            <div
              style={{
                margin: "0 auto",
                width: 300,
                padding: "12px 0",
                borderRadius: "0 0 18px 18px",
                background: "#1A1D21",
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: 44,
                fontWeight: 700,
                color: theme.colors.brand,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {interpolate(weigh, [0, 1], [0, copy.example.kg]).toFixed(2)} kg
            </div>
            <Label tone="light" style={{ textAlign: "center", marginTop: 10, fontSize: 20 }}>
              {copy.exampleTag}
            </Label>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 1330, left: 140 }}>
          <Entrance delay={sec(2.7)} distance={50}>
            <div style={{ transform: `perspective(1200px) rotateX(${Math.sin(flip * Math.PI) * 70}deg)` }}>
              <Card tone="light" style={{ width: 800, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 24 }}>
                {confirmed && <Check size={64} color={theme.colors.brand} />}
                <div style={{ flex: 1 }}>
                  <Label tone="light">{confirmed ? quoteTitle : copy.estimate}</Label>
                  {confirmed ? (
                    <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 40, color: theme.colors.inkText, marginTop: 8 }}>
                      {copy.example.kg} kg · {l}×{w}×{h} cm
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
                      <span style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 40, color: theme.colors.inkDim }}>≈</span>
                      <Bar tone="light" width={360} height={24} />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </Entrance>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.white, opacity: flash, pointerEvents: "none" }} />
    </SceneShell>
  );
};
