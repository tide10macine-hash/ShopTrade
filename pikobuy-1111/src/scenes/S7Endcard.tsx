import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { asset, Burst, DownArrow, DrawCircle, Flash, LogoCard, Ref } from "../components/Graphics";
import { Whip } from "../components/Layers";
import { clamp, shake } from "../components/motion";
import { Pop } from "../components/Pop";
import { Sfx } from "../components/Sfx";
import { BounceText, Center, LinePop } from "../components/Type";
import { C, COPY, EASE, SCENES, SHOW_PARTNER_ROW } from "../theme";

const PARTNERS = ["dhl.png", "weidian.png", "p-app.png", "litbuy.png", "cow-agent.jpg"];
const A_OUT = 112; // phase A (logo hero) exits, phase B (link-in-bio CTA) enters

/** 16-20s — PIKOBUY hero end card, then the "first link in my bio" CTA, closing impact. */
export const S7Endcard: React.FC = () => {
  const f = useCurrentFrame();
  const { dur } = SCENES.endcard;
  const finalBump = 1 + 0.08 * Math.exp(-Math.max(0, f - 200) / 10) * (f >= 200 ? 1 : 0);
  const shotH = (380 * 1672) / 941;
  const endFade = interpolate(f, [dur - 6, dur], [0, 0], clamp);
  return (
    <Whip dur={dur} noOut>
      <AbsoluteFill style={{ transform: shake(f, [6, 128, 200], 18), opacity: 1 - endFade }}>
        {/* ---------- Phase A: logo hero ---------- */}
        <Pop at={6} x={540} y={620} shadow={false} z={0} exit={A_OUT}><Burst size={900} spinAt={6} color={C.yellow} /></Pop>
        <Pop at={4} x={540} y={600} from="slam" z={4} exit={A_OUT}><LogoCard file="pikobuy.jpg" w={400} pad={16} radius={70} /></Pop>
        <Pop at={14} x={160} y={380} rot={-12} exit={A_OUT}><Ref name="bag-1111" w={220} /></Pop>
        <Pop at={18} x={920} y={390} rot={10} exit={A_OUT}><Ref name="box-price-drop" w={240} /></Pop>
        <Pop at={22} x={150} y={820} rot={-10} exit={A_OUT}><Ref name="coupon-ticket" w={240} /></Pop>
        <Pop at={26} x={925} y={830} rot={8} exit={A_OUT}><Ref name="truck-yellow" w={280} /></Pop>
        <Center y={900}><BounceText text="PIKOBUY 11.11" at={18} size={118} fill={C.red} stagger={1} exit={A_OUT} /></Center>
        <Center y={1020}><BounceText text="MEGA SALE" at={28} size={130} fill={C.yellow} stagger={2} exit={A_OUT} /></Center>
        <Center y={1180}><LinePop text={COPY.endcard.l1} at={46} size={52} fill={C.white} strokes={[{ w: 22, color: C.white }, { w: 12, color: C.black }]} exit={A_OUT} /></Center>
        <Center y={1255}><LinePop text={COPY.endcard.l2} at={56} size={62} fill={C.red} strokes={[{ w: 24, color: C.white }, { w: 13, color: C.black }]} exit={A_OUT} /></Center>
        {SHOW_PARTNER_ROW && PARTNERS.map((p, i) => (
          <Pop key={p} at={70 + i * 4} x={540 + (i - 2) * 168} y={1420} rot={(i % 2 ? 5 : -5)} exit={A_OUT}>
            <LogoCard file={p} w={112} pad={6} radius={22} />
          </Pop>
        ))}

        {/* ---------- Phase B: link-in-bio CTA + closing ---------- */}
        <Center y={175} z={6}><LinePop text={COPY.endcard.slogan} at={190} size={76} fill={C.red} rot={-2} /></Center>
        <Pop at={124} x={540} y={410} from="slam" z={5}>
          <div style={{ transform: `scale(${finalBump})` }}><LogoCard file="pikobuy.jpg" w={190} pad={10} radius={34} /></div>
        </Pop>
        <Pop at={130} x={540} y={870} from="bottom" rot={-2} z={4}>
          <div style={{ position: "relative", width: 380 + 28, padding: 14, background: C.white, borderRadius: 30, boxShadow: `0 0 0 6px ${C.black}` }}>
            <Img src={asset("stickers/link-in-bio.jpg")} style={{ width: 380, height: shotH, display: "block", borderRadius: 20 }} />
            <div style={{ position: "absolute", left: -40, top: 14 + shotH * 0.465 - 70 }}>
              <DrawCircle w={490} h={140} at={150} />
            </div>
          </div>
        </Pop>
        <Pop at={156} x={150} y={870 - shotH / 2 + 14 + shotH * 0.465} z={7}>
          <div style={{ transform: "rotate(-90deg)" }}><DownArrow w={110} h={190} growAt={156} /></div>
        </Pop>
        <Pop at={160} x={935} y={680} rot={12} z={7}><Ref name="thumbs-up" w={150} /></Pop>
        <Center y={1255} z={8}><BounceText text="CHECK THE FIRST LINK" at={140} size={82} fill={C.white} stagger={1}
          strokes={[{ w: 28, color: C.white }, { w: 15, color: C.black }]} /></Center>
        <Center y={1345} z={8}><BounceText text="IN MY BIO!" at={160} size={118} fill={C.yellow} stagger={2} /></Center>
      </AbsoluteFill>
      <Flash at={4} len={8} />
      <Flash at={200} len={10} />
      <Sfx at={0} name="riser" vol={0.4} />
      <Sfx at={3} name="impact-big" vol={0.85} />
      <Sfx at={13} name="pop" vol={0.6} />
      <Sfx at={17} name="pop" vol={0.6} />
      <Sfx at={21} name="pop" vol={0.6} />
      <Sfx at={25} name="truck" vol={0.35} />
      <Sfx at={45} name="whoosh-fast" vol={0.5} />
      <Sfx at={55} name="coupon-confirm" vol={0.6} />
      <Sfx at={70} name="pop" vol={0.5} />
      <Sfx at={110} name="whoosh" vol={0.7} />
      <Sfx at={122} name="impact" vol={0.6} />
      <Sfx at={128} name="whoosh-fast" vol={0.6} />
      <Sfx at={148} name="paper" vol={0.6} />
      <Sfx at={154} name="whoosh-fast" vol={0.5} />
      <Sfx at={158} name="pop" vol={0.7} />
      <Sfx at={188} name="cash-register" vol={0.7} />
      <Sfx at={198} name="impact-big" vol={1} />
    </Whip>
  );
};
