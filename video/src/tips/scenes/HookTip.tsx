import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { tipsCopy } from "../copy";
import { SceneShell } from "../../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring } from "../../components/motion";
import { display } from "../../components/type";
import { Bar, Card, Label, Parcel } from "../parts";

const SlamWord: React.FC<{ word: string; delay: number }> = ({ word, delay }) => {
  const p = useSpring(delay, theme.spring.snappy);
  return (
    <span
      style={{
        display: "inline-block",
        opacity: Math.min(1, p * 2),
        transform: `scale(${interpolate(p, [0, 1], [1.7, 1])})`,
        filter: `blur(${interpolate(p, [0, 1], [10, 0], clamp)}px)`,
      }}
    >
      {word}
    </span>
  );
};

export const HookTip: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();
  const copy = tipsCopy.hook;

  const float = useSpring(0, theme.spring.smooth);
  const shrink = interpolate(frame, [sec(1.6), sec(2.4)], [1, 0.62], { ...clamp, easing: theme.ease.inOut });
  const zoom = interpolate(frame, [sec(1.4), durationInFrames], [1, 1.12], { ...clamp, easing: theme.ease.inOut });
  const shake = frame > sec(0.9) && frame < sec(1.5) ? Math.sin(frame * 2.2) * 4 : 0;
  const toWhite = interpolate(frame, [durationInFrames - 5, durationInFrames], [0, 1], clamp);

  return (
    <SceneShell tone="dark" exitAt={durationInFrames + 1}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <div style={{ position: "absolute", top: 240, left: 80, width: 920 }}>
          <div style={{ ...display(116, theme.colors.text), display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 24 }}>
            {copy.headline.split(" ").map((w, i) => (
              <SlamWord key={w} word={w} delay={sec(0.15) + i * 4} />
            ))}
          </div>
          <Entrance delay={sec(0.95)} distance={24}>
            <div style={{ marginTop: 28, fontFamily: theme.fonts.body, fontWeight: 600, fontSize: 44, color: theme.colors.textDim, textAlign: "center" }}>
              {copy.sub}
            </div>
          </Entrance>
        </div>

        <div
          style={{
            position: "absolute",
            top: 840,
            left: 120,
            opacity: Math.min(1, float * 1.5),
            transform: `translateY(${interpolate(float, [0, 1], [380, 0])}px) scale(${shrink})`,
          }}
        >
          <Breathe amplitude={8} period={24}>
            <Parcel width={420} />
          </Breathe>
        </div>

        <div style={{ position: "absolute", top: 900, left: 600, transform: `translateX(${shake}px)` }}>
          <Entrance delay={sec(0.5)} from="right" distance={120} config={theme.spring.bouncy}>
            <Card tone="dark" style={{ width: 360 }}>
              <Label tone="dark">{copy.priceLabel}</Label>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 10 }}>
                <span style={{ ...display(96, theme.colors.warn), textAlign: "left" }}>$$$</span>
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
                  <path d="M4 17l6-6 4 4 6-7M14 8h6v6" stroke={theme.colors.warn} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                <Bar tone="dark" width={260} />
                <Bar tone="dark" width={190} />
              </div>
            </Card>
          </Entrance>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.white, opacity: toWhite }} />
    </SceneShell>
  );
};
