import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { copy } from "../copy";
import { theme } from "../theme";
import { SceneShell } from "../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring, WordReveal } from "../components/motion";
import { display, kicker } from "../components/type";

const ArrowDown: React.FC<{ bounce: number }> = ({ bounce }) => (
  <svg width="84" height="84" viewBox="0 0 24 24" fill="none" style={{ transform: `translateY(${bounce}px)` }}>
    <path d="M12 4v15M6 13l6 6 6-6" stroke={theme.colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();

  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.05], { ...clamp, easing: theme.ease.inOut });
  const logo = useSpring(sec(2.0), theme.spring.bouncy);
  const bounce = Math.abs(Math.sin(frame / 7)) * 14;
  const [missOut, signUp, bio] = copy.ctaLines;

  return (
    // Final scene holds to the last frame, so the exit starts after it ends.
    <SceneShell tone="dark" exitAt={durationInFrames + 1}>
      <AbsoluteFill style={{ alignItems: "center", transform: `scale(${zoom})` }}>
        <div style={{ position: "absolute", top: 320, width: 920 }}>
          <WordReveal text={missOut} delay={sec(0.1)} style={display(112, theme.colors.text)} />
        </div>

        <div style={{ position: "absolute", top: 500, width: 920 }}>
          <WordReveal
            text={signUp}
            delay={sec(0.7)}
            style={{ ...display(92, theme.colors.text), width: 740, margin: "0 auto" }}
          />
        </div>

        <div style={{ position: "absolute", top: 790, width: 920, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Entrance delay={sec(1.3)} config={theme.spring.snappy}>
            <div style={kicker(50, theme.colors.textDim)}>{bio}</div>
          </Entrance>
          <Entrance delay={sec(1.45)} config={theme.spring.snappy}>
            <ArrowDown bounce={bounce} />
          </Entrance>
        </div>

        <div
          style={{
            position: "absolute",
            top: 1080,
            width: 380,
            opacity: Math.min(1, logo * 1.5),
            transform: `scale(${interpolate(logo, [0, 1], [0.4, 1])}) rotate(${interpolate(logo, [0, 1], [10, 0])}deg)`,
          }}
        >
          <Breathe amplitude={5} period={30}>
            <Img
              src={staticFile("img/logo.png")}
              style={{
                width: "100%",
                display: "block",
                borderRadius: 86,
                boxShadow: `0 0 70px ${theme.colors.glow}, 0 0 140px ${theme.colors.glow}`,
              }}
            />
          </Breathe>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
