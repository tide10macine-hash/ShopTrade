import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { AGENTS, compareCopy, PIKOBUY } from "../copy";
import { SceneShell } from "../../components/layers";
import { clamp, Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { Card, Footnote, Label } from "../../tips/parts";
import { AgentName, highlightRing, LogoTile, Money } from "../parts";

// Local seconds where the voiceover reads each agent's price.
const PRICE_AT = [2.6, 5.6, 7.9];

const PriceCard: React.FC<{ index: number }> = ({ index }) => {
  const sec = useSec();
  const agent = AGENTS[index];
  const count = useSpring(sec(PRICE_AT[index]), theme.spring.smooth);
  const focus = useSpring(sec(PRICE_AT[0] + 0.4), theme.spring.snappy);
  const ring = agent.highlight ? Math.min(1, focus) : 0;
  const diff = agent.shipping5kg - PIKOBUY.shipping5kg;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ transform: `scale(${1 + ring * 0.07})` }}>
        <Card
          tone="light"
          style={{
            width: 296,
            boxSizing: "border-box",
            padding: "28px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            ...highlightRing(ring),
          }}
        >
          <LogoTile agent={agent} size={150} />
          <AgentName agent={agent} tone="light" size={32} />
          <Label tone="light">5 KG</Label>
          {count > 0.01 ? (
            <Money value={interpolate(count, [0, 1], [0, agent.shipping5kg], clamp)} size={96} color={theme.colors.inkText} />
          ) : (
            // Not yet spoken: a placeholder, never a misleading $0.
            <span style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 96, lineHeight: 1, color: theme.colors.uiStrong }}>$—</span>
          )}
        </Card>
      </div>
      {diff > 0 && (
        <Entrance delay={sec(PRICE_AT[index] + 0.5)} config={theme.spring.bouncy}>
          <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 40, color: theme.colors.inkDim }}>+${diff}</div>
        </Entrance>
      )}
    </div>
  );
};

export const ShippingCompare: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = compareCopy.shipping;

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 260, width: 920 }}>
          <WordReveal text={copy.headline} delay={2} style={display(100, theme.colors.inkText)} />
        </div>
        <div style={{ position: "absolute", top: 640, display: "flex", gap: 22, alignItems: "flex-start" }}>
          {AGENTS.map((agent, i) => (
            <Entrance key={agent.name} delay={sec(0.4) + i * sec(0.15)} distance={160}>
              <PriceCard index={i} />
            </Entrance>
          ))}
        </div>
        <Footnote tone="light" text={copy.caption} delay={sec(2)} top={1460} />
        <Footnote tone="light" text={compareCopy.sourceNote} delay={sec(2.2)} top={1510} />
      </AbsoluteFill>
    </SceneShell>
  );
};
