import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { Agent, AGENTS, compareCopy, days } from "../copy";
import { SceneShell } from "../../components/layers";
import { Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { Footnote, Label } from "../../tips/parts";
import { AgentMark } from "../parts";

const COLS = [250, 220, 250, 220];

const cells = (agent: Agent) => [
  `$${agent.shipping5kg}`,
  days(agent.arrivalDays).replace(" DAYS", "d"),
  agent.itemTotal === null ? "—" : `$${agent.itemTotal}`,
];

const TableRow: React.FC<{ agent: Agent; lift: number }> = ({ agent, lift }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "26px 10px",
      borderRadius: 26,
      background: agent.highlight ? "rgba(126, 252, 248, 0.08)" : theme.colors.inkRaised,
      border: `${agent.highlight ? 4 : 1}px solid ${agent.highlight ? theme.colors.brand : theme.colors.glassEdge}`,
      boxShadow: agent.highlight ? `0 0 ${40 * lift}px ${theme.colors.glow}, 0 ${30 * lift}px 50px -20px rgba(0,0,0,0.7)` : undefined,
      transform: `scale(${1 + lift * 0.04}) translateY(${-lift * 10}px)`,
      position: "relative",
      zIndex: agent.highlight ? 2 : 1,
    }}
  >
    <div style={{ width: COLS[0], display: "flex", justifyContent: "flex-start", paddingLeft: 12 }}>
      <AgentMark agent={agent} tone="dark" size={28} />
    </div>
    {cells(agent).map((value, i) => (
      <div
        key={i}
        style={{
          width: COLS[i + 1],
          textAlign: "center",
          fontFamily: theme.fonts.display,
          fontWeight: 900,
          fontSize: 48,
          color: agent.highlight ? theme.colors.text : theme.colors.textDim,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    ))}
  </div>
);

export const TableCompare: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = compareCopy.table;
  const lift = Math.min(1, useSpring(sec(1.4), theme.spring.smooth));

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 280, width: 920 }}>
          <WordReveal text={copy.headline} delay={2} style={display(100, theme.colors.text)} />
        </div>

        <div style={{ position: "absolute", top: 690, display: "flex", flexDirection: "column", gap: 22 }}>
          <Entrance delay={sec(0.2)} distance={20}>
            <div style={{ display: "flex", padding: "0 10px" }}>
              <div style={{ width: COLS[0] }} />
              {copy.columns.map((c, i) => (
                <Label key={c} tone="dark" style={{ width: COLS[i + 1], textAlign: "center", fontSize: 20 }}>
                  {c}
                </Label>
              ))}
            </div>
          </Entrance>
          {AGENTS.map((agent, i) => (
            <Entrance key={agent.name} delay={sec(0.3) + i * sec(0.15)} distance={50}>
              <TableRow agent={agent} lift={agent.highlight ? lift : 0} />
            </Entrance>
          ))}
        </div>

        <div style={{ position: "absolute", top: 1290, opacity: interpolate(lift, [0, 1], [0, 1]) }}>
          <Label tone="dark" style={{ fontSize: 22 }}>
            — = NO FIGURE SUPPLIED
          </Label>
        </div>
        <Footnote tone="dark" text={compareCopy.sourceNote} delay={sec(1.2)} top={1500} />
      </AbsoluteFill>
    </SceneShell>
  );
};
