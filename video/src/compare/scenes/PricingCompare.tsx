import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { compareCopy, LITBUY, PIKOBUY } from "../copy";
import { SceneShell } from "../../components/layers";
import { Breathe, Entrance, useSec, useSpring, WordReveal } from "../../components/motion";
import { display } from "../../components/type";
import { Card, Footnote, Label, Sneaker } from "../../tips/parts";
import { AgentMark, highlightRing, Money } from "../parts";

const Row: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong = false }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
    <span
      style={{
        fontFamily: strong ? theme.fonts.display : theme.fonts.body,
        fontWeight: strong ? 900 : 600,
        fontSize: strong ? 34 : 25,
        letterSpacing: strong ? "0.08em" : undefined,
        color: strong ? theme.colors.inkText : theme.colors.inkDim,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
    {value}
  </div>
);

export const PricingCompare: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = compareCopy.pricing;
  const extra = (LITBUY.itemTotal ?? copy.basePrice) - copy.basePrice;

  // The voiceover reaches "two-twenty on Litbuy" around 3.6s into this scene.
  const charge = useSpring(sec(3.3), theme.spring.snappy);
  const total = useSpring(sec(3.6), theme.spring.counter);
  const ring = Math.min(1, useSpring(sec(5.0), theme.spring.snappy));

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ position: "absolute", top: 250, width: 920 }}>
          <WordReveal text={copy.headline} delay={2} style={display(96, theme.colors.inkText)} />
        </div>

        <div style={{ position: "absolute", top: 560, display: "flex", alignItems: "center", gap: 24 }}>
          <Entrance delay={sec(0.4)} config={theme.spring.bouncy}>
            <Breathe amplitude={6} period={26}>
              <Sneaker width={340} tone="light" />
            </Breathe>
          </Entrance>
          <Entrance delay={sec(0.7)} from="right" distance={60}>
            <div style={{ padding: "12px 26px", borderRadius: 999, background: theme.colors.inkText }}>
              <Money value={copy.basePrice} size={56} color={theme.colors.white} />
            </div>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 820, display: "flex", gap: 28 }}>
          <Entrance delay={sec(1.0)} from="left" distance={100}>
            <div style={{ transform: `scale(${1 + ring * 0.04})` }}>
              <Card tone="light" style={{ width: 440, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 22, ...highlightRing(ring) }}>
                <AgentMark agent={PIKOBUY} tone="light" size={30} />
                <Row label={copy.productLabel} value={<Money value={copy.basePrice} size={40} color={theme.colors.inkText} />} />
                <div style={{ height: 52 }} />
                <div style={{ height: 2, background: theme.colors.ui }} />
                <Row strong label={copy.totalLabel} value={<Money value={PIKOBUY.itemTotal ?? copy.basePrice} size={64} color={theme.colors.inkText} />} />
              </Card>
            </div>
          </Entrance>
          <Entrance delay={sec(1.15)} from="right" distance={100}>
            <Card tone="light" style={{ width: 440, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 22, border: "5px solid transparent" }}>
              <AgentMark agent={LITBUY} tone="light" size={30} />
              <Row label={copy.productLabel} value={<Money value={copy.basePrice} size={40} color={theme.colors.inkText} />} />
              <div style={{ height: 52, opacity: Math.min(1, charge * 1.5), transform: `translateY(${interpolate(charge, [0, 1], [-16, 0])}px)` }}>
                <Row
                  label={`+ ${copy.extraLabel}`}
                  value={
                    <span style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 40, color: theme.colors.warn }}>+${extra}</span>
                  }
                />
              </div>
              <div style={{ height: 2, background: theme.colors.ui }} />
              <Row
                strong
                label={copy.totalLabel}
                value={<Money value={interpolate(total, [0, 1], [copy.basePrice, copy.basePrice + extra])} size={64} color={theme.colors.inkText} />}
              />
            </Card>
          </Entrance>
        </div>

        <div style={{ position: "absolute", top: 1240 }}>
          <Label tone="light">SAME $200 EXAMPLE ITEM</Label>
        </div>
        <Footnote tone="light" text={copy.caption} delay={sec(2)} top={1460} />
        <Footnote tone="light" text={compareCopy.sourceNote} delay={sec(2.2)} top={1530} />
      </AbsoluteFill>
    </SceneShell>
  );
};
