import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { AGENTS, compareCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { AgentName, LogoTile } from "../parts";

const PriceTag: React.FC<{ delay: number; highlight: boolean }> = ({ delay, highlight }) => {
  const drop = useSpring(delay, theme.spring.bouncy);
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        opacity: Math.min(1, drop * 2),
        transform: `translateY(${interpolate(drop, [0, 1], [-700, 0])}px) rotate(${-8 + Math.sin(frame / 14 + delay) * 4}deg)`,
        transformOrigin: "50% 0%",
        padding: "16px 30px 16px 46px",
        borderRadius: "14px 22px 22px 14px",
        background: highlight ? theme.colors.brand : theme.colors.white,
        position: "relative",
        fontFamily: theme.fonts.display,
        fontWeight: 900,
        fontSize: 56,
        color: theme.colors.inkText,
      }}
    >
      <div style={{ position: "absolute", left: 16, top: "50%", width: 16, height: 16, marginTop: -8, borderRadius: "50%", background: theme.colors.ink }} />
      $?
    </div>
  );
};

export const HookCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = compareCopy.hook;

  const zoom = interpolate(frame, [sec(3), durationInFrames], [1, 1.1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center", transform: `scale(${zoom})` }}>
        <div style={{ position: "absolute", top: 260, width: 920 }}>
          <WordReveal text={copy.headline} delay={sec(0.1)} style={display(124, theme.colors.text)} />
          <Entrance delay={sec(0.8)} distance={24}>
            <div style={{ marginTop: 28, fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 46, color: theme.colors.textDim, textAlign: "center" }}>
              {copy.sub}
            </div>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 860, display: "flex", gap: 36 }}>
          {AGENTS.map((agent, i) => (
            <div key={agent.name} style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <PriceTag delay={sec(1.4) + i * sec(0.25)} highlight={agent.highlight} />
              <Entrance delay={sec(0.3) + i * sec(0.15)} distance={80}>
                <Breathe amplitude={6} period={24} phase={i}>
                  <LogoTile agent={agent} size={230} glow={agent.highlight} />
                </Breathe>
              </Entrance>
              <Entrance delay={sec(0.5) + i * sec(0.15)} distance={20}>
                <AgentName agent={agent} tone="dark" size={40} />
              </Entrance>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
