import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { clamp, useSec, useSpring } from "../../components/motion";
import { Bar, Card, Check, Footnote, Label, TipHeader } from "../parts";

const CARD_W = 400;
const GAP = 28;

const LineCard: React.FC<{ name: string; tag: string | null; selected: number }> = ({ name, tag, selected }) => (
  <div style={{ transform: `scale(${1 + selected * 0.05})`, position: "relative" }}>
    <Card
      tone="light"
      style={{
        width: CARD_W,
        height: 330,
        boxSizing: "border-box",
        border: `6px solid ${selected > 0 ? theme.colors.brand : "transparent"}`,
        boxShadow:
          selected > 0
            ? `0 0 ${50 * selected}px ${theme.colors.glow}, 0 30px 60px -28px rgba(0,0,0,0.28)`
            : "0 30px 60px -28px rgba(0,0,0,0.28)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: 40 }}>
        {tag ? (
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: "0.12em",
              padding: "8px 16px",
              borderRadius: 999,
              background: theme.colors.inkText,
              color: theme.colors.white,
              whiteSpace: "nowrap",
            }}
          >
            {tag}
          </div>
        ) : (
          <Label tone="light" style={{ whiteSpace: "nowrap" }}>
            SHIPPING LINE
          </Label>
        )}
      </div>
      <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 46, color: theme.colors.inkText, marginTop: 14 }}>
        {name}
      </div>
      <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 28, color: theme.colors.inkDim, marginTop: 8 }}>
        → Your destination
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label tone="light" style={{ fontSize: 20 }}>EST. COST</Label>
          <Bar tone="light" width={150} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label tone="light" style={{ fontSize: 20 }}>EST. TIME</Label>
          <Bar tone="light" width={110} />
        </div>
      </div>
    </Card>
    {selected > 0 && (
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 18px",
          borderRadius: 999,
          background: theme.colors.inkText,
          color: theme.colors.white,
          fontFamily: theme.fonts.body,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: "0.12em",
          opacity: selected,
          transform: `scale(${0.7 + selected * 0.3})`,
        }}
      >
        <Check size={28} color={theme.colors.brand} />
        {tipsCopy.lines.selected}
      </div>
    )}
  </div>
);

export const LinesTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.lines;

  const settleLeft = 540 - copy.selectedIndex * (CARD_W + GAP) - CARD_W / 2;
  const rowX = interpolate(frame, [sec(0.2), sec(1.5)], [1100, settleLeft], { ...clamp, easing: theme.ease.out });
  const pick = useSpring(sec(1.6), theme.spring.snappy);

  return (
    <SceneShell tone="light" exitAt={durationInFrames - 8}>
      <AbsoluteFill>
        <TipHeader tone="light" title={copy.title} support={copy.support} delay={2} />
        <div style={{ position: "absolute", top: 820, left: rowX, display: "flex", gap: GAP, alignItems: "center" }}>
          {copy.cards.map((c, i) => (
            <LineCard key={c.name} name={c.name} tag={c.tag} selected={i === copy.selectedIndex ? Math.min(1, pick) : 0} />
          ))}
        </div>
        <Footnote tone="light" text={copy.footnote} delay={sec(1.9)} top={1300} />
      </AbsoluteFill>
    </SceneShell>
  );
};
