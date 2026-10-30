import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { AGENTS, compareCopy, days } from "../copy";
import { Pill, SceneShell } from "../../components/layers";
import { clamp, Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { Footnote, Parcel } from "../../tips/parts";
import { AgentMark } from "../parts";

const MAX_DAYS = 5;
const TRACK_W = 470;

const TimelineRow: React.FC<{ index: number; delay: number }> = ({ index, delay }) => {
  const agent = AGENTS[index];
  const grow = useSpring(delay + 4, theme.spring.smooth);
  const [min, max] = agent.arrivalDays;
  const left = (min / MAX_DAYS) * TRACK_W;
  const width = ((max - min) / MAX_DAYS) * TRACK_W * Math.min(1, grow);
  return (
    <Entrance delay={delay} from="left" distance={60}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, width: 960 }}>
        <div style={{ width: 210, display: "flex", justifyContent: "flex-end" }}>
          <AgentMark agent={agent} tone="dark" size={28} />
        </div>
        <div style={{ position: "relative", width: TRACK_W, height: 30, borderRadius: 15, background: theme.colors.uiDark }}>
          <div
            style={{
              position: "absolute",
              left,
              width,
              top: 0,
              bottom: 0,
              borderRadius: 15,
              background: agent.highlight ? theme.colors.brand : "#8E8E96",
              boxShadow: agent.highlight ? `0 0 30px ${theme.colors.glow}` : undefined,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontWeight: 900,
            fontSize: 42,
            whiteSpace: "nowrap",
            color: agent.highlight ? theme.colors.text : theme.colors.textDim,
          }}
        >
          {days(agent.arrivalDays)}
        </div>
      </div>
    </Entrance>
  );
};

export const WarehouseCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = compareCopy.warehouse;

  const arrive = interpolate(frame, [sec(0.2), sec(1.0)], [-600, 0], { ...clamp, easing: theme.ease.out });
  const scan = interpolate(frame, [sec(1.0), sec(1.6)], [0, 1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 250, width: 920 }}>
          <WordReveal text={copy.headline} delay={2} style={display(96, theme.colors.text)} />
          <Entrance delay={12} distance={20}>
            <div style={{ marginTop: 20, fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 40, color: theme.colors.textDim, textAlign: "center" }}>
              {copy.support}
            </div>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 640, display: "flex", alignItems: "center", gap: 30, transform: `translateX(${arrive}px)` }}>
          <Parcel width={210} />
          <div style={{ position: "relative", width: 380 }}>
            <Img src={staticFile("img/label.png")} style={{ width: "100%", display: "block", transform: "rotate(-3deg)" }} />
            {scan > 0 && scan < 1 && (
              <div
                style={{
                  position: "absolute",
                  left: -14,
                  right: -14,
                  top: scan * 190,
                  height: 5,
                  borderRadius: 3,
                  background: theme.colors.brand,
                  opacity: Math.sin(Math.PI * scan),
                  boxShadow: `0 0 26px ${theme.colors.glow}`,
                }}
              />
            )}
          </div>
        </div>
        <div style={{ position: "absolute", top: 890 }}>
          <Entrance delay={sec(1.6)} config={theme.spring.bouncy}>
            <Pill tone="dark">{copy.scanned}</Pill>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 1030, display: "flex", flexDirection: "column", gap: 44 }}>
          {AGENTS.map((agent, i) => (
            <TimelineRow key={agent.name} index={i} delay={sec(1.4) + i * sec(0.3)} />
          ))}
        </div>

        <Footnote tone="dark" text={copy.caption} delay={sec(2.4)} top={1440} />
        <Footnote tone="dark" text={compareCopy.sourceNote} delay={sec(2.6)} top={1530} />
      </AbsoluteFill>
    </SceneShell>
  );
};
