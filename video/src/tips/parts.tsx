import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../theme";
import { Tone } from "../components/layers";
import { Entrance, WordReveal } from "../components/motion";
import { display } from "../components/type";

const ink = (tone: Tone) => (tone === "dark" ? theme.colors.text : theme.colors.inkText);
const dim = (tone: Tone) => (tone === "dark" ? theme.colors.textDim : theme.colors.inkDim);

export const TipHeader: React.FC<{
  tone: Tone;
  title: string;
  support: readonly string[];
  delay: number;
  top?: number;
}> = ({ tone, title, support, delay, top = 250 }) => (
  <div style={{ position: "absolute", top, width: 920, left: 80 }}>
    <WordReveal text={title} delay={delay} style={display(92, ink(tone))} />
    {support.map((line, i) => (
      <Entrance key={line} delay={delay + 10 + i * 6} distance={24}>
        <div
          style={{
            marginTop: i === 0 ? 26 : 10,
            fontFamily: theme.fonts.body,
            fontWeight: i === 0 ? 600 : 500,
            fontSize: i === 0 ? 42 : 34,
            color: i === 0 ? ink(tone) : dim(tone),
            textAlign: "center",
          }}
        >
          {line}
        </div>
      </Entrance>
    ))}
  </div>
);

export const Footnote: React.FC<{ tone: Tone; text: string; delay: number; top?: number }> = ({
  tone,
  text,
  delay,
  top = 1560,
}) => (
  <div style={{ position: "absolute", top, left: 100, width: 880 }}>
    <Entrance delay={delay} distance={16}>
      <div style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 28, color: dim(tone), textAlign: "center" }}>
        {text}
      </div>
    </Entrance>
  </div>
);

export const Card: React.FC<{ tone: Tone; style?: React.CSSProperties; children: React.ReactNode }> = ({
  tone,
  style,
  children,
}) => (
  <div
    style={{
      borderRadius: 32,
      padding: 32,
      ...(tone === "dark"
        ? { background: theme.colors.inkRaised, border: `1px solid ${theme.colors.glassEdge}` }
        : { background: theme.colors.white, boxShadow: "0 30px 60px -28px rgba(0,0,0,0.28)" }),
      ...style,
    }}
  >
    {children}
  </div>
);

export const Bar: React.FC<{ tone: Tone; width: number; height?: number }> = ({ tone, width, height = 18 }) => (
  <div
    style={{
      width,
      height,
      borderRadius: height,
      background: tone === "dark" ? theme.colors.uiDark : theme.colors.ui,
    }}
  />
);

export const Label: React.FC<{ tone: Tone; children: React.ReactNode; style?: React.CSSProperties }> = ({
  tone,
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: theme.fonts.body,
      fontWeight: 600,
      fontSize: 24,
      letterSpacing: "0.14em",
      color: dim(tone),
      ...style,
    }}
  >
    {children}
  </div>
);

export const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={color} />
    <path d="M7 12.5l3.2 3.2L17 9" stroke={theme.colors.inkText} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Parcel: React.FC<{ width: number; style?: React.CSSProperties }> = ({ width, style }) => (
  <Img
    src={staticFile("img/box.png")}
    style={{ width, display: "block", filter: "drop-shadow(0 30px 34px rgba(0,0,0,0.35))", ...style }}
  />
);

// Generic, unbranded low-top sneaker.
export const Sneaker: React.FC<{ width: number; tone: Tone }> = ({ width, tone }) => (
  <svg width={width} height={width * 0.46} viewBox="0 0 200 92" fill="none">
    <path
      d="M8 70 C8 52 26 42 54 40 L92 22 C102 17 113 19 119 27 L134 46 C152 49 180 53 190 63 L192 72 L8 72 Z"
      fill={theme.colors.white}
      stroke={tone === "dark" ? "#3A3A40" : theme.colors.uiStrong}
      strokeWidth="2"
    />
    <path d="M6 72 H194 C194 80 190 86 182 86 H18 C10 86 6 80 6 72 Z" fill={tone === "dark" ? "#8E8E96" : "#B8BEC5"} />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M${86 + i * 9} ${32 + i * 4} L${98 + i * 9} ${38 + i * 4}`} stroke="#9AA0A8" strokeWidth="3" strokeLinecap="round" />
    ))}
    <path d="M40 60 C70 58 110 56 150 58" stroke={theme.colors.uiStrong} strokeWidth="3" strokeLinecap="round" />
  </svg>
);
