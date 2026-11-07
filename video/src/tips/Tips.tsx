import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, staticFile } from "remotion";
import { Fonts } from "../components/core";
import { DuckContext, Sfx, SfxName } from "../components/Sfx";
import { makeVoiceActivity } from "../voice";
import { Glitch, NeonBackground } from "./Background";
import { BottomCaptions, TopCaptions } from "./Captions";
import { Visuals } from "./Visuals";
import { DURATION, SECTIONS, T, W } from "./timeline";

// voice activity from the word timings: duck music + effects while words are spoken
const voiceAct = makeVoiceActivity(W.map((w, i) => ({ clip: String(i), at: w.start, dur: w.end - w.start })));

const musicVolume = (f: number) => {
  const end = interpolate(f, [DURATION - 50, DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return 0.3 * (1 - 0.6 * voiceAct(f)) * end;
};

// every sound cue, at global frames, tied to the word it illustrates
const CUES: [number, SfxName, number][] = [
  [0, "whoosh-reverse", 0.5], [2, "pop", 0.5], [10, "pop-high", 0.35], [18, "pop-high", 0.35],
  [T(8), "whoosh", 0.45], [T(10), "pop", 0.5],
  // tip 1
  [T(20), "whoosh", 0.5], [T(20) + 8, "whoosh-reverse", 0.45], [T(20) + 4, "coupon-confirm", 0.5],
  [T(22), "pop", 0.5], [T(24), "tock", 0.6], [T(30) - 8, "whoosh", 0.4], [T(30) + 4, "cash-register", 0.6], [T(30) + 8, "checkmark", 0.45],
  // tip 2
  [T(36), "pop", 0.5], [T(38) - 6, "whoosh-reverse", 0.35], [T(38) + 4, "whoosh-reverse", 0.35], [T(40), "stamp", 0.45], [T(42), "stamp", 0.45], [T(44), "checkmark", 0.55],
  // tip 3
  [T(47), "pop", 0.5], [T(50), "camera-shutter", 0.8], [T(52), "pop", 0.5], [T(56), "coupon-confirm", 0.35],
  [T(59), "whoosh", 0.45], [T(64), "impact", 0.45],
  // tip 4
  [T(67), "pop", 0.5], [T(70), "pop-high", 0.45], [T(75), "tick", 0.8], [T(75) + 10, "whoosh", 0.5], [T(76), "stamp", 0.35], [T(80), "whoosh-reverse", 0.4],
  // tip 5
  [T(83), "pop", 0.5], [T(84), "vacuum", 0.7], [T(86), "pop", 0.5], [T(87), "paper-rustle", 0.4], [T(90), "stamp", 0.5], [T(90) + 8, "stamp", 0.45], [T(90) + 16, "coins", 0.5],
  // recap
  [SECTIONS[6].from + 4, "pop", 0.5], ...[0, 1, 2, 3, 4].map((k) => [T(95) + k * 9, "checkmark", 0.4] as [number, SfxName, number]),
  [T(102), "cash-register", 0.6], [T(102) + 4, "coins", 0.45],
  // plug
  [T(108), "pop", 0.4], [T(108) + 6, "pop", 0.4], [T(108) + 12, "pop", 0.4], [T(113) - 30, "riser", 0.4], [T(113), "impact", 0.65],
  [T(118), "whoosh-reverse", 0.35], [T(121), "whoosh", 0.5], [T(121) + 6, "coupon-confirm", 0.7], [T(126), "whoosh", 0.45], [T(129) + 4, "pop-high", 0.6],
  [DURATION - 40, "impact", 0.5],
];

/** PIKOBUY - "5 things I'd do starting China hauls from zero" (faceless explainer, 9:16, 60 fps) */
export const Tips: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#03081f" }}>
    <Fonts />
    <DuckContext.Provider value={voiceAct}>
      <NeonBackground />
      <Glitch>
        <Visuals />
        <TopCaptions />
        <BottomCaptions />
      </Glitch>
      <Html5Audio src={staticFile("audio/voice-tips/voice.wav")} />
      <Html5Audio src={staticFile("audio/music/music-bed-tips-120bpm.wav")} volume={musicVolume} />
      {SECTIONS.slice(1).map((s) => (
        <Sfx key={s.key} at={s.from - 3} name="glitch" vol={0.55} />
      ))}
      {CUES.map(([at, name, vol], i) => (
        <Sfx key={i} at={Math.max(0, at)} name={name} vol={vol} />
      ))}
    </DuckContext.Provider>
  </AbsoluteFill>
);
