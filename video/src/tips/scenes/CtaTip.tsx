import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { Bar, Card, Label, Parcel } from "../parts";

const Phone: React.FC = () => (
  <div
    style={{
      width: 400,
      height: 760,
      borderRadius: 64,
      background: "#0E0F11",
      padding: 14,
      boxSizing: "border-box",
      boxShadow: "0 50px 90px -30px rgba(0,0,0,0.45)",
    }}
  >
    <div style={{ width: "100%", height: "100%", borderRadius: 52, background: theme.colors.paper, overflow: "hidden", padding: "56px 28px 28px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={staticFile("img/logo.png")} style={{ width: 64, height: 64, borderRadius: 16 }} />
        <Bar tone="light" width={150} height={20} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", background: theme.colors.white, borderRadius: 20, padding: 14 }}>
          <div style={{ width: 70, height: 70, borderRadius: 14, background: theme.colors.ui }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Bar tone="light" width={170} height={16} />
            <Bar tone="light" width={110} height={16} />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px" }}>
        <Label tone="light" style={{ fontSize: 18 }}>SHIPPING</Label>
        <Bar tone="light" width={100} height={16} />
      </div>
      <div
        style={{
          marginTop: "auto",
          padding: "20px 0",
          borderRadius: 999,
          background: theme.colors.brand,
          textAlign: "center",
          fontFamily: theme.fonts.display,
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: "0.08em",
          color: theme.colors.inkText,
        }}
      >
        {tipsCopy.cta.checkout}
      </div>
    </div>
  </div>
);

export const CtaTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.cta;

  const phone = useSpring(sec(0.15), theme.spring.smooth);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06], { ...clamp, easing: theme.ease.inOut });
  const fade = interpolate(frame, [durationInFrames - sec(0.35), durationInFrames], [0, 1], clamp);
  const bounce = Math.abs(Math.sin(frame / 7)) * 10;

  return (
    // Final scene: the fade-out below replaces the usual exit.
    <SceneShell tone="light" exitAt={durationInFrames + 1}>
      <AbsoluteFill style={{ alignItems: "center", transform: `scale(${zoom})` }}>
        <div style={{ position: "absolute", top: 230, width: 920 }}>
          <WordReveal text={copy.headline} delay={sec(0.05)} style={display(100, theme.colors.inkText)} />
        </div>

        <div
          style={{
            position: "absolute",
            top: 520,
            opacity: Math.min(1, phone * 1.5),
            transform: `translateY(${interpolate(phone, [0, 1], [300, 0])}px)`,
          }}
        >
          <Breathe amplitude={4} period={30}>
            <Phone />
          </Breathe>
        </div>

        <div style={{ position: "absolute", top: 980, left: 40 }}>
          <Entrance delay={sec(0.5)} from="left" distance={100} config={theme.spring.bouncy}>
            <Breathe amplitude={8} period={24}>
              <Parcel width={230} />
            </Breathe>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 640, left: 770 }}>
          <Entrance delay={sec(0.65)} from="right" distance={100} config={theme.spring.bouncy}>
            <Breathe amplitude={6} period={26} phase={1}>
              <Card tone="light" style={{ width: 250, boxSizing: "border-box", padding: 24 }}>
                <Label tone="light" style={{ fontSize: 18 }}>SHIPPING</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  <Bar tone="light" width={180} />
                  <Bar tone="light" width={120} />
                </div>
              </Card>
            </Breathe>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 1330, width: 920, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Entrance delay={sec(0.9)} config={theme.spring.snappy}>
            <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 56, color: theme.colors.inkText, textAlign: "center" }}>
              {copy.final}
            </div>
          </Entrance>
          <Entrance delay={sec(1.05)} config={theme.spring.snappy}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ transform: `translateY(${bounce}px)` }}>
              <path d="M12 4v15M6 13l6 6 6-6" stroke={theme.colors.inkText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Entrance>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.white, opacity: fade, pointerEvents: "none" }} />
    </SceneShell>
  );
};
