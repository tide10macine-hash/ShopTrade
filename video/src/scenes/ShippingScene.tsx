import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { copy } from "../copy";
import { theme } from "../theme";
import { Pill, SceneShell } from "../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring, WordReveal } from "../components/motion";
import { display } from "../components/type";

const LABEL_TOP = 1010;
const LABEL_HEIGHT = 280;

const usePlane = (start: number, end: number) => {
  const frame = useCurrentFrame();
  const progressAt = (f: number) => interpolate(f, [start, end], [0, 1], { ...clamp, easing: theme.ease.cruise });
  const p = progressAt(frame);
  const speed = Math.abs(p - progressAt(frame - 1)) * 2000;
  return {
    x: interpolate(p, [0, 1], [-560, 1180]),
    y: interpolate(p, [0, 1], [820, 330]),
    blur: Math.min(4, speed / 25),
    visible: p > 0 && p < 1,
  };
};

export const ShippingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();

  const push = interpolate(frame, [0, durationInFrames], [1, 1.06], { ...clamp, easing: theme.ease.inOut });
  const plane = usePlane(sec(0.2), sec(2.0));
  const drop = useSpring(sec(1.1), theme.spring.bouncy);
  const slap = useSpring(sec(2.0), theme.spring.snappy);
  const scan = interpolate(frame, [sec(2.6), sec(3.3)], [0, 1], { ...clamp, easing: theme.ease.inOut });

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center", transform: `scale(${push})` }}>
        <div style={{ position: "absolute", top: 270, width: 920 }}>
          <WordReveal text={copy.shippingQuestion} delay={sec(0.1)} style={display(100, theme.colors.text)} />
        </div>

        {plane.visible && (
          <Img
            src={staticFile("img/plane.png")}
            style={{
              position: "absolute",
              left: plane.x,
              top: plane.y,
              width: 420,
              filter: `blur(${plane.blur}px)`,
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 1170,
            width: 460,
            height: 70,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.75), transparent 70%)",
            transform: `scale(${interpolate(drop, [0, 1], [0.3, 1])})`,
            opacity: Math.min(1, drop),
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 700,
            width: 500,
            transform: `translateY(${interpolate(drop, [0, 1], [-1300, 0])}px)`,
          }}
        >
          <Breathe amplitude={4} period={30}>
            <Img src={staticFile("img/box.png")} style={{ width: "100%", display: "block" }} />
          </Breathe>
        </div>

        <div
          style={{
            position: "absolute",
            top: LABEL_TOP,
            left: 290,
            width: 560,
            opacity: Math.min(1, slap * 2),
            transform: `scale(${interpolate(slap, [0, 1], [1.7, 1])}) rotate(${interpolate(slap, [0, 1], [-16, -5])}deg)`,
            filter: "drop-shadow(0 24px 30px rgba(0,0,0,0.5))",
          }}
        >
          <Img src={staticFile("img/label.png")} style={{ width: "100%", display: "block" }} />
          {scan > 0 && scan < 1 && (
            <div
              style={{
                position: "absolute",
                left: -20,
                right: -20,
                top: scan * LABEL_HEIGHT,
                height: 6,
                borderRadius: 3,
                background: theme.colors.brand,
                opacity: Math.sin(Math.PI * scan),
                boxShadow: `0 0 30px ${theme.colors.glow}, 0 0 60px ${theme.colors.glow}`,
              }}
            />
          )}
        </div>

        <div style={{ position: "absolute", top: 1340, width: 920 }}>
          <WordReveal text={copy.shippingLine} delay={sec(3.0)} style={display(86, theme.colors.text)} />
        </div>

        <div style={{ position: "absolute", top: 1570, display: "flex", gap: 18 }}>
          {copy.shippingChips.map((chip, i) => (
            <Entrance key={chip} delay={sec(3.7) + i * sec(0.15)} config={theme.spring.snappy}>
              <Breathe amplitude={3} period={28} phase={i * 1.3}>
                <Pill tone="dark">{chip}</Pill>
              </Breathe>
            </Entrance>
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
