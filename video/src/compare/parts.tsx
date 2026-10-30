import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../theme";
import { Tone } from "../components/layers";
import { Agent } from "./copy";

// Pikobuy gets its logo and the brand accent; competitors stay neutral text.
export const AgentMark: React.FC<{ agent: Agent; tone: Tone; size?: number }> = ({ agent, tone, size = 34 }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, height: size * 1.6 }}>
    {agent.highlight && (
      <Img src={staticFile("img/logo.png")} style={{ width: size * 1.5, height: size * 1.5, borderRadius: size * 0.36 }} />
    )}
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
