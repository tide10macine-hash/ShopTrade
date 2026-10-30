import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { useSpring } from "../components/motion";

// Chunky outlined headline, the reference video's signature look.
export const Sticker: React.FC<{
  text: string;
  delay: number;
  size: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ text, delay, size, color = theme.colors.gold, style }) => {
  const p = useSpring(delay, theme.spring.bouncy);
  return (
    <div
      style={{
        fontFamily: theme.fonts.display,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.01em",
        textAlign: "center",
        color,
        WebkitTextStroke: `${Math.round(size * 0.09)}px ${theme.colors.inkText}`,
        paintOrder: "stroke fill",
        textShadow: `0 ${Math.round(size * 0.07)}px 0 ${theme.colors.inkText}`,
        opacity: Math.min(1, p * 2),
        transform: `scale(${interpolate(p, [0, 1], [1.8, 1])}) rotate(${interpolate(p, [0, 1], [-6, -2])}deg)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export const Stamp: React.FC<{ kind: "check" | "cross"; delay: number; size: number; style?: React.CSSProperties }> = ({
  kind,
  delay,
  size,
  style,
}) => {
  const p = useSpring(delay, theme.spring.bouncy);
  const ok = kind === "check";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: ok ? theme.colors.go : theme.colors.festive,
        border: `${size * 0.06}px solid ${theme.colors.white}`,
        boxShadow: "0 16px 30px -10px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: Math.min(1, p * 2),
        transform: `scale(${interpolate(p, [0, 1], [2.2, 1])}) rotate(${interpolate(p, [0, 1], [-25, -8])}deg)`,
        ...style,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d={ok ? "M4 12.5l5 5L20 6.5" : "M5 5l14 14M19 5L5 19"}
          stroke={theme.colors.white}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// Five-star flag of China, drawn so it stays crisp and waves gently.
export const ChinaFlag: React.FC<{ width: number }> = ({ width }) => {
  const frame = useCurrentFrame();
  const star = (cx: number, cy: number, r: number, rot: number) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = ((i * 36 + rot - 90) * Math.PI) / 180;
      const rr = i % 2 === 0 ? r : r * 0.382;
      return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
    });
    return <polygon points={pts.join(" ")} fill="#FFDE00" />;
  };
  return (
    <svg
      width={width}
      height={(width * 2) / 3}
      viewBox="0 0 30 20"
      style={{
        transform: `perspective(600px) rotateY(${Math.sin(frame / 18) * 8}deg) skewY(${Math.sin(frame / 14) * 2}deg)`,
        borderRadius: 6,
        boxShadow: "0 24px 40px -16px rgba(0,0,0,0.6)",
      }}
    >
      <rect width="30" height="20" fill="#EE1C25" />
      {star(5, 5, 3, 0)}
      {star(10, 2, 1, 23)}
      {star(12, 4, 1, 46)}
      {star(12, 7, 1, 70)}
      {star(10, 9, 1, 21)}
    </svg>
  );
};

export const AlarmClock: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const ring = Math.sin(frame * 1.6) * 7;
  const minute = (frame * 18) % 360;
  const hour = (frame * 1.5) % 360;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${ring}deg)` }}>
      <circle cx="26" cy="18" r="12" fill={theme.colors.festive} />
      <circle cx="74" cy="18" r="12" fill={theme.colors.festive} />
      <path d="M30 88l-8 8M70 88l8 8" stroke={theme.colors.inkText} strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="55" r="38" fill={theme.colors.festive} />
      <circle cx="50" cy="55" r="31" fill={theme.colors.white} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={50 + Math.sin(a) * 25}
            y1={55 - Math.cos(a) * 25}
            x2={50 + Math.sin(a) * 28}
            y2={55 - Math.cos(a) * 28}
            stroke={theme.colors.inkText}
            strokeWidth="2"
          />
        );
      })}
      <line x1="50" y1="55" x2="50" y2="36" stroke={theme.colors.inkText} strokeWidth="3" strokeLinecap="round" transform={`rotate(${minute} 50 55)`} />
      <line x1="50" y1="55" x2="50" y2="43" stroke={theme.colors.inkText} strokeWidth="4" strokeLinecap="round" transform={`rotate(${hour} 50 55)`} />
      <circle cx="50" cy="55" r="3" fill={theme.colors.festive} />
    </svg>
  );
};

export const ShoppingBag: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" fill={color} />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
