import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DrawCircle, PhotoCard, Ref } from "../components/Graphics";
import { Whip } from "../components/Layers";
import { clamp, shake } from "../components/motion";
import { Pop } from "../components/Pop";
import { Sfx } from "../components/Sfx";
import { BounceText, Center, LinePop, Outlined } from "../components/Type";
import { C, COPY, EASE, SCENES } from "../theme";

/** 13-16s — the calendar: November 11 circled, ticking clock, fast punch zooms. */
export const S6Countdown: React.FC = () => {
  const f = useCurrentFrame();
  const { dur } = SCENES.countdown;
  const zoom = interpolate(f, [0, dur], [1, 1.07], { ...clamp, easing: EASE.inOut }) +
    0.06 * Math.exp(-Math.max(0, f - 96) / 8) * (f >= 96 ? 1 : 0);
  // calendar extracted icon is 931x823; the highlighted red day sits at ~(61%, 62%)
  const calW = 760, calH = (calW * 823) / 931;
  return (
    <Whip dur={dur} inFrom="bottom">
      <AbsoluteFill style={{ transform: `${shake(f, [4, 96])} scale(${zoom})` }}>
        <Pop at={22} x={860} y={520} rot={9} z={1}><PhotoCard file="stickers/singles-day-banner.jpg" w={330} h={220} kbFrom={22} /></Pop>
        <Center y={210} z={2}><BounceText text="11.11!" at={3} size={250} fill={C.red} stagger={3} /></Center>
        <Pop at={12} x={540} y={850} rot={-3} z={3}>
          <div style={{ position: "relative", width: calW, height: calH }}>
            <Ref name="calendar-pencil" w={calW} />
            <div style={{ position: "absolute", left: calW * 0.61 - 95, top: calH * 0.62 - 72 }}>
              <DrawCircle w={190} h={144} at={34} />
            </div>
          </div>
        </Pop>
        <Pop at={44} x={190} y={560} rot={-12} z={4}>
          <div style={{ background: C.yellow, padding: "8px 22px", borderRadius: 16, boxShadow: `0 0 0 6px ${C.black}, 0 0 0 14px ${C.white}` }}>
            <Outlined text="NOV 11" size={64} fill={C.red} strokes={[{ w: 12, color: C.black }]} />
          </div>
        </Pop>
        <Center y={1220} z={5}>
          <LinePop text={COPY.countdown.head} at={54} size={74} fill={C.white} strokes={[{ w: 28, color: C.white }, { w: 15, color: C.black }]} />
        </Center>
        <Center y={1320} z={5}><BounceText text={COPY.countdown.sub} at={96} size={128} fill={C.yellow} stagger={2} /></Center>
      </AbsoluteFill>
      <Sfx at={0} name="whoosh" vol={0.7} />
      <Sfx at={2} name="impact" vol={0.55} />
      <Sfx at={10} name="clock-ticks" vol={0.8} />
      <Sfx at={20} name="pop" vol={0.6} />
      <Sfx at={33} name="paper" vol={0.7} />
      <Sfx at={43} name="pop" vol={0.6} />
      <Sfx at={53} name="whoosh-fast" vol={0.5} />
      <Sfx at={94} name="impact" vol={0.8} />
      <Sfx at={110} name="clock-ticks" vol={0.6} />
    </Whip>
  );
};
