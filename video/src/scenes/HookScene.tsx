import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { copy } from "../copy";
import { theme } from "../theme";
import { SceneShell } from "../components/layers";
import { Breathe, clamp, Entrance, useSec, useSpring, WordReveal } from "../components/motion";
import { display, kicker } from "../components/type";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sec = useSec();

  const pop = useSpring(0, theme.spring.bouncy);
  const blinkAt = sec(1.75);
  const blink = interpolate(frame, [blinkAt, blinkAt + 3, blinkAt + 6], [1, 0.08, 1], {
    ...clamp,
    easing: theme.ease.inOut,
  });
  const glance = interpolate(frame, [sec(1.0), sec(1.25), sec(2.1), sec(2.35)], [0, -36, -36, 20], {
    ...clamp,
    easing: theme.ease.inOut,
  });

  return (
    <SceneShell tone="dark" exitAt={durationInFrames - 8}>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 330,
            width: 700,
            opacity: Math.min(1, pop * 1.5),
            transform: `translateX(${glance}px) scale(${interpolate(pop, [0, 1], [0.35, 1])}) rotate(${interpolate(pop, [0, 1], [-10, 0])}deg) scaleY(${blink})`,
          }}
        >
          <Breathe amplitude={5} period={26}>
            <Img src={staticFile("img/eyes.png")} style={{ width: "100%", display: "block" }} />
          </Breathe>
        </div>

        <div style={{ position: "absolute", top: 880, width: 920 }}>
          <Entrance delay={sec(0.3)} config={theme.spring.snappy}>
            <div style={{ ...kicker(46, theme.colors.textDim), marginBottom: 28 }}>{copy.hookKicker}</div>
          </Entrance>
          <WordReveal
            text={copy.hookHeadline}
            delay={sec(0.55)}
            per={3}
            highlight={copy.hookHighlight}
            style={display(118, theme.colors.text)}
          />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
