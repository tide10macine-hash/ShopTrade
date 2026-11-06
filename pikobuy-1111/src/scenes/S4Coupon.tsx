import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Burst, CheckBadge, Coupon, Flash, LogoCard, Ref } from "../components/Graphics";
import { Whip } from "../components/Layers";
import { clamp, shake } from "../components/motion";
import { Pop } from "../components/Pop";
import { Sfx } from "../components/Sfx";
import { BounceText, Center, LinePop, Outlined } from "../components/Type";
import { C, COPY, EASE, FONT, SCENES } from "../theme";

/** 6-10s — THE HOOK: giant 80% slam, two 40% coupons stack, REDEEMED stamp. */
export const S4Coupon: React.FC = () => {
  const f = useCurrentFrame();
  const { dur } = SCENES.coupon;
  // 80% punch-zoom on the beat after landing
  const beatPunch = 1 + 0.05 * Math.max(0, Math.cos(((f - 40) / 30) * Math.PI * 2)) * (f > 40 ? 1 : 0) * Math.exp(-Math.max(0, f - 40) / 120);
  const fine = interpolate(f, [48, 60], [0, 1], { ...clamp, easing: EASE.out });
  return (
    <Whip dur={dur} inFrom="zoom">
      <AbsoluteFill style={{ transform: shake(f, [10, 62, 72, 120], 22) }}>
        <Pop at={8} x={540} y={790} shadow={false} z={0}><Burst size={1150} spinAt={8} /></Pop>
        <Pop at={2} x={540} y={285} z={4}><LogoCard file="pikobuy.jpg" w={210} pad={10} radius={36} /></Pop>
        <Center y={430}><LinePop text={COPY.coupon.head} at={6} size={104} fill={C.white} strokes={[{ w: 34, color: C.white }, { w: 18, color: C.black }]} /></Center>
        <Pop at={10} x={540} y={765} from="slam" z={3}>
          <div style={{ transform: `scale(${beatPunch})` }}>
            <Outlined text={COPY.coupon.big} size={400} fill={C.yellow} spacing={-0.02}
              strokes={[{ w: 70, color: C.white }, { w: 52, color: C.black }, { w: 30, color: C.red }]} />
          </div>
        </Pop>
        <Center y={970} z={4}><BounceText text={COPY.coupon.off} at={22} size={170} fill={C.red} stagger={3} /></Center>
        <Center y={1150} z={4}>
          <LinePop text={COPY.coupon.sub} at={34} size={58} fill={C.white} strokes={[{ w: 24, color: C.white }, { w: 13, color: C.black }]} />
          <div style={{ marginTop: 12, opacity: fine, fontFamily: FONT.condensed, fontSize: 25, color: C.ink, letterSpacing: "0.02em", background: "rgba(255,255,255,0.85)", padding: "4px 12px", borderRadius: 8 }}>
            {COPY.coupon.fine}
          </div>
        </Center>
        <Pop at={60} x={290} y={1400} from="left" rot={-9} z={5}><Coupon w={430} value="40%" tone="red" /></Pop>
        <Pop at={70} x={790} y={1420} from="right" rot={8} z={5}><Coupon w={430} value="40%" tone="yellow" /></Pop>
        <Pop at={84} x={540} y={1410} z={6}><Outlined text="+" size={130} fill={C.yellow} strokes={[{ w: 34, color: C.white }, { w: 20, color: C.black }]} /></Pop>
        <Pop at={96} x={150} y={760} rot={-14} z={2}><Ref name="coupon-ticket" w={250} /></Pop>
        <Pop at={120} x={540} y={1395} from="slam" rot={-11} z={8} exit={176}><Ref name="stamp-redeemed" w={660} /></Pop>
        <Pop at={132} x={110} y={1260} z={9}><CheckBadge size={130} drawAt={132} /></Pop>
        <Pop at={140} x={975} y={1280} z={9}><CheckBadge size={130} drawAt={140} /></Pop>
        <Pop at={180} x={540} y={1420} rot={-4} z={10}>
          <div style={{ background: C.red, padding: "18px 34px", borderRadius: 22, boxShadow: `0 0 0 8px ${C.black}, 0 0 0 18px ${C.white}` }}>
            <Outlined text={COPY.coupon.stack} size={76} fill={C.yellow} strokes={[{ w: 14, color: C.black }]} />
          </div>
        </Pop>
      </AbsoluteFill>
      <Flash at={10} len={10} />
      <Flash at={120} len={6} color={C.yellow} />
      <Sfx at={0} name="whoosh" vol={0.7} />
      <Sfx at={7} name="impact-big" vol={1} />
      <Sfx at={13} name="cash-register" vol={0.7} />
      <Sfx at={20} name="impact" vol={0.6} />
      <Sfx at={33} name="pop" vol={0.6} />
      <Sfx at={58} name="whoosh-fast" vol={0.7} />
      <Sfx at={60} name="coupon-confirm" vol={0.75} />
      <Sfx at={68} name="whoosh-fast" vol={0.7} />
      <Sfx at={70} name="coupon-confirm" vol={0.75} />
      <Sfx at={83} name="pop" vol={0.7} />
      <Sfx at={95} name="paper" vol={0.6} />
      <Sfx at={118} name="stamp" vol={1} />
      <Sfx at={131} name="check" vol={0.8} />
      <Sfx at={139} name="check" vol={0.8} />
      <Sfx at={150} name="coins" vol={0.7} />
      <Sfx at={178} name="impact" vol={0.6} />
      <Sfx at={182} name="cash-register" vol={0.6} />
    </Whip>
  );
};
