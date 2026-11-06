import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CheckBadge, Ref } from "../components/Graphics";
import { Whip } from "../components/Layers";
import { shake } from "../components/motion";
import { Pop } from "../components/Pop";
import { Sfx } from "../components/Sfx";
import { BounceText, Center, LinePop, Outlined } from "../components/Type";
import { C, COPY, SCENES } from "../theme";

const Badge: React.FC<{ text: string; icon: string; iconW: number; hero?: boolean }> = ({ text, icon, iconW, hero }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, background: hero ? C.red : C.yellow, padding: "16px 34px 16px 22px", borderRadius: 30, boxShadow: `0 0 0 8px ${C.black}, 0 0 0 18px ${C.white}` }}>
    <div style={{ width: 150, display: "flex", justifyContent: "center" }}><Ref name={icon} w={iconW} /></div>
    <Outlined text={text} size={74} fill={hero ? C.yellow : C.red} strokes={[{ w: 14, color: C.black }]} />
  </div>
);

/** 10-13s — WHY PAY MORE? the three benefits as stacked stickers. */
export const S5Collage: React.FC = () => {
  const f = useCurrentFrame();
  const { dur } = SCENES.collage;
  const [b1, b2, b3] = COPY.collage.badges;
  return (
    <Whip dur={dur}>
      <AbsoluteFill style={{ transform: shake(f, [6, 50]) }}>
        <Center y={240}><BounceText text={COPY.collage.head} at={3} size={130} fill={C.red} /></Center>
        <Pop at={18} x={540} y={560} from="left" rot={-3}><Badge text={b1} icon="coins-cash" iconW={150} /></Pop>
        <Pop at={32} x={540} y={800} from="right" rot={2.5}><Badge text={b2} icon="airplane" iconW={150} /></Pop>
        <Pop at={46} x={540} y={1050} from="left" rot={-2} scale={1.08}><Badge text={b3} icon="coupon-ticket" iconW={140} hero /></Pop>
        <Pop at={26} x={100} y={470} z={4}><CheckBadge size={110} drawAt={26} /></Pop>
        <Pop at={40} x={985} y={720} z={4}><CheckBadge size={110} drawAt={40} /></Pop>
        <Pop at={54} x={95} y={970} z={4}><CheckBadge size={110} drawAt={54} /></Pop>
        <Pop at={70} x={950} y={1430} rot={10} z={4}><Ref name="thumbs-up" w={190} /></Pop>
        <Pop at={84} x={140} y={1440} rot={-8}><Ref name="box-price-drop" w={230} /></Pop>
        <Center y={1215} z={3}>
          <LinePop text="SHOP SMART" at={76} size={92} fill={C.white} strokes={[{ w: 30, color: C.white }, { w: 16, color: C.black }]} rot={-2} />
          <div style={{ height: 6 }} />
          <LinePop text="WITH PIKOBUY!" at={84} size={92} fill={C.red} rot={-2} />
        </Center>
      </AbsoluteFill>
      <Sfx at={0} name="whoosh" vol={0.7} />
      <Sfx at={2} name="impact" vol={0.5} />
      <Sfx at={16} name="whoosh-fast" vol={0.7} />
      <Sfx at={20} name="cash-register" vol={0.45} />
      <Sfx at={25} name="check" vol={0.7} />
      <Sfx at={30} name="whoosh-fast" vol={0.7} />
      <Sfx at={34} name="airplane" vol={0.35} />
      <Sfx at={39} name="check" vol={0.7} />
      <Sfx at={44} name="whoosh-fast" vol={0.7} />
      <Sfx at={48} name="coupon-confirm" vol={0.6} />
      <Sfx at={53} name="check" vol={0.7} />
      <Sfx at={69} name="pop" vol={0.7} />
      <Sfx at={75} name="impact" vol={0.45} />
    </Whip>
  );
};
