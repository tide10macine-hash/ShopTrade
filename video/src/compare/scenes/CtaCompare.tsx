import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { compareCopy } from "../copy";
import { Pill, SceneShell } from "../../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { Parcel } from "../../tips/parts";

export const CtaCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = compareCopy.cta;

  const intro = useSpring(sec(0.1), theme.spring.bouncy);
  const spin = Math.sin(frame / 24) * 16;
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.05], { ...clamp, easing: theme.ease.inOut });
  const bounce = Math.abs(Math.sin(frame / 7)) * 10;

  return (
    // Final scene holds to the last frame.
    <SceneShell tone="dark" exitAt={durationInFrames + 1}>
      <AbsoluteFill style={{ alignItems: "center", transform: `scale(${zoom})` }}>
        <div
          style={{
            position: "absolute",
            top: 330,
            display: "flex",
            alignItems: "center",
            gap: 50,
            opacity: Math.min(1, intro * 1.5),
            transform: `scale(${interpolate(intro, [0, 1], [0.6, 1])})`,
          }}
        >
          <div style={{ transform: `perspective(900px) rotateY(${spin}deg)` }}>
            <Parcel width={270} />
          </div>
          <Breathe amplitude={5} period={28}>
            <Img
              src={staticFile("img/logo.png")}
              style={{ width: 270, display: "block", borderRadius: 62, boxShadow: `0 0 70px ${theme.colors.glow}` }}
            />
          </Breathe>
        </div>

        <div style={{ position: "absolute", top: 740, width: 920 }}>
          <WordReveal
            text={copy.headline}
            delay={sec(0.5)}
            style={{ ...display(112, theme.colors.text), textShadow: `0 0 40px ${theme.colors.glow}` }}
          />
        </div>

        <div style={{ position: "absolute", top: 1010, display: "flex", gap: 16 }}>
          {copy.categories.map((c, i) => (
            <Entrance key={c} delay={sec(1.1) + i * sec(0.15)} config={theme.spring.snappy}>
              <Pill tone="dark" style={{ fontSize: 28 }}>
                {c}
              </Pill>
            </Entrance>
          ))}
        </div>

        <div style={{ position: "absolute", top: 1150, width: 920, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Entrance delay={sec(1.7)} distance={20}>
            <div style={{ fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 44, color: theme.colors.textDim, textAlign: "center" }}>
              {copy.sub}
            </div>
          </Entrance>
          <Entrance delay={sec(2.6)} config={theme.spring.snappy}>
            <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 58, color: theme.colors.text, textAlign: "center" }}>
              {copy.final}
            </div>
          </Entrance>
          <Entrance delay={sec(2.75)} config={theme.spring.snappy}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ transform: `translateY(${bounce}px)` }}>
              <path d="M12 4v15M6 13l6 6 6-6" stroke={theme.colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Entrance>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
