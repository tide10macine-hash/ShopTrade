import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { copy } from "../copy";
import { theme } from "../theme";
import { Pill, SceneShell } from "../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring, WordReveal } from "../components/motion";
import { display, kicker } from "../components/type";

const Arrow: React.FC = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke={theme.colors.inkDim} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();

  const flash = interpolate(frame, [0, 7], [0.85, 0], { ...clamp, easing: theme.ease.out });
  const logo = useSpring(sec(0.15), theme.spring.bouncy);

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 360, width: 920 }}>
          <Entrance delay={sec(0.5)} config={theme.spring.snappy}>
            <div style={kicker(52, theme.colors.inkDim)}>{copy.meetKicker}</div>
          </Entrance>
        </div>

        <div
          style={{
            position: "absolute",
            top: 470,
            width: 500,
            opacity: Math.min(1, logo * 1.5),
            transform: `scale(${interpolate(logo, [0, 1], [0.4, 1])}) rotate(${interpolate(logo, [0, 1], [-14, 0])}deg)`,
          }}
        >
          <Breathe amplitude={6} period={32}>
            <Img
              src={staticFile("img/logo.png")}
              style={{
                width: "100%",
                display: "block",
                borderRadius: 110,
                boxShadow: `0 50px 90px -30px rgba(0,0,0,0.35), 0 0 120px ${theme.colors.glow}`,
              }}
            />
          </Breathe>
        </div>

        <div style={{ position: "absolute", top: 1050, width: 920 }}>
          <WordReveal text={copy.tagline} delay={sec(0.9)} style={display(90, theme.colors.inkText)} />
        </div>

        <div style={{ position: "absolute", top: 1340, display: "flex", alignItems: "center", gap: 12 }}>
          {copy.flow.map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 && (
                <Entrance delay={sec(2.0) + i * sec(0.25) - 3} from="left" distance={16}>
                  <Arrow />
                </Entrance>
              )}
              <Entrance delay={sec(2.0) + i * sec(0.25)} config={theme.spring.snappy}>
                <Breathe amplitude={3} period={28} phase={i * 1.1}>
                  <Pill tone="light" style={{ fontSize: 28, padding: "18px 24px" }}>
                    {step}
                  </Pill>
                </Breathe>
              </Entrance>
            </React.Fragment>
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.white, opacity: flash, pointerEvents: "none" }} />
    </SceneShell>
  );
};
