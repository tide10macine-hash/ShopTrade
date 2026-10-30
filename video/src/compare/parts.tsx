import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../theme";
import { Tone } from "../components/layers";
import { Agent } from "./copy";

export const LogoTile: React.FC<{ agent: Agent; size: number; glow?: boolean }> = ({ agent, size, glow = false }) => (
  <Img
    src={staticFile(agent.logo)}
    style={{
      width: size,
      height: size,
      display: "block",
      borderRadius: size * 0.22,
      boxShadow: glow ? `0 0 ${size * 0.4}px ${theme.colors.glow}` : "0 10px 24px -10px rgba(0,0,0,0.35)",
    }}
  />
);

// Only Pikobuy gets the brand accent on its name.
export const AgentName: React.FC<{ agent: Agent; tone: Tone; size: number }> = ({ agent, tone, size }) => (
  <span
      style={{
        fontFamily: theme.fonts.display,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "0.02em",
        color: agent.highlight
          ? tone === "dark"
            ? theme.colors.brand
            : theme.colors.inkText
          : tone === "dark"
            ? theme.colors.textDim
            : theme.colors.inkDim,
      }}
    >
      {agent.name}
  </span>
);

export const AgentMark: React.FC<{ agent: Agent; tone: Tone; size?: number }> = ({ agent, tone, size = 34 }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, height: size * 1.6 }}>
    <LogoTile agent={agent} size={size * 1.5} />
    <AgentName agent={agent} tone={tone} size={size} />
  </div>
);

export const highlightRing = (on: number): React.CSSProperties => ({
  border: `5px solid ${on > 0 ? theme.colors.brand : "transparent"}`,
  boxShadow: on > 0 ? `0 0 ${50 * on}px ${theme.colors.glow}, 0 30px 60px -28px rgba(0,0,0,0.3)` : undefined,
});

export const Money: React.FC<{ value: number; size: number; color: string }> = ({ value, size, color }) => (
  <span
    style={{
      fontFamily: theme.fonts.display,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: "-0.03em",
      color,
      fontVariantNumeric: "tabular-nums",
      lineHeight: 1,
    }}
  >
    ${Math.round(value)}
  </span>
);
