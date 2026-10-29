import React from "react";
import { interpolate, spring, SpringConfig, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const useSec = () => {
  const { fps } = useVideoConfig();
  return (seconds: number) => Math.round(seconds * fps);
};

export const useSpring = (delay: number, config: Partial<SpringConfig> = theme.spring.smooth) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

type Direction = "up" | "down" | "left" | "right";

const translateFor = (from: Direction, distance: number) => {
  switch (from) {
    case "up":
      return `translateY(${distance}px)`;
    case "down":
      return `translateY(${-distance}px)`;
    case "left":
      return `translateX(${-distance}px)`;
    case "right":
      return `translateX(${distance}px)`;
  }
};

export const Entrance: React.FC<{
  delay?: number;
  from?: Direction;
  distance?: number;
  config?: Partial<SpringConfig>;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, from = "up", distance = 40, config = theme.spring.smooth, style, children }) => {
  const p = useSpring(delay, config);
  return (
    <div
      style={{
        opacity: Math.min(1, p * 1.4),
        transform: `${translateFor(from, interpolate(p, [0, 1], [distance, 0]))} scale(${interpolate(p, [0, 1], [0.94, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  highlight?: readonly string[];
  highlightColor?: string;
  wordGap?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, per = 3, highlight = [], highlightColor = theme.colors.brand, wordGap = 22, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: wordGap, ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              opacity: Math.min(1, p * 1.5),
              transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
              color: highlight.includes(word) ? highlightColor : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const useExit = (start: number, length: number): React.CSSProperties => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + length], [0, 1], { ...clamp, easing: theme.ease.in });
  return {
    opacity: 1 - p,
    transform: `scale(${1 + 0.1 * p})`,
    filter: p > 0 ? `blur(${p * 12}px)` : undefined,
  };
};

export const Breathe: React.FC<{
  amplitude?: number;
  period?: number;
  phase?: number;
  children: React.ReactNode;
}> = ({ amplitude = 6, period = 34, phase = 0, children }) => {
  const frame = useCurrentFrame();
  const y = Math.sin(frame / period + phase) * amplitude;
  const s = 1 + Math.sin(frame / (period * 0.8) + phase) * 0.012;
  return <div style={{ transform: `translateY(${y}px) scale(${s})` }}>{children}</div>;
};
