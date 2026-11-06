import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CheckBadge, LogoCard, PhotoCard, Ref, SpeedLines } from "../components/Graphics";
import { Whip } from "../components/Layers";
import { clamp, shake } from "../components/motion";
import { Pop } from "../components/Pop";
import { Sfx } from "../components/Sfx";
import { BounceText, Center, LinePop } from "../components/Type";
import { C, COPY, EASE, SCENES } from "../theme";

/** 4-6s — FASTEST SHIPPING: truck races in, plane flies over, parcels photo, check. */
export const S3Shipping: React.FC = () => {
  const f = useCurrentFrame();
  const { dur } = SCENES.shipping;
  // airplane flight path: bottom-left -> top-right with a slight arc
  const p = interpolate(f, [26, 100], [0, 1], { ...clamp, easing: EASE.inOut });
  const px = -300 + p * 1700;
  const py = 1180 - p * 700 - Math.sin(p * Math.PI) * 120;
  return (
    <Whip dur={dur}>
      <AbsoluteFill style={{ transform: shake(f, [6, 62]) }}>
        <Center y={240}><BounceText text="FASTEST" at={3} size={150} fill={C.red} /></Center>
        <Center y={395}><BounceText text="SHIPPING!" at={10} size={160} fill={C.red} /></Center>
        <Center y={575}>
          <LinePop text={COPY.shipping.sub} at={40} size={70} fill={C.yellow} strokes={[{ w: 28, color: C.white }, { w: 15, color: C.black }]} rot={-1.5} />
        </Center>
        <Pop at={16} x={540} y={930} rot={-3}><PhotoCard file="products/parcels-warehouse.jpg" w={780} h={420} kbFrom={16} /></Pop>
        <div style={{ position: "absolute", left: 0, top: 1170, opacity: f > 22 ? 1 : 0 }}><SpeedLines w={560} h={200} seed={2} /></div>
        <Pop at={20} x={360} y={1270} from="left"><Ref name="truck-yellow" w={540} /></Pop>
        <Pop at={34} x={850} y={1290} rot={7}><LogoCard file="dhl.png" w={230} pad={4} radius={30} /></Pop>
        <Pop at={62} x={835} y={760} z={6}><CheckBadge size={190} drawAt={62} /></Pop>
        {f >= 26 && (
          <div style={{ position: "absolute", left: px, top: py, transform: `translate(-50%,-50%) rotate(${-28 + p * 8}deg)`, zIndex: 7, filter: "drop-shadow(0 30px 14px rgba(0,0,0,0.25))" }}>
            <Ref name="airplane" w={380} />
          </div>
        )}
      </AbsoluteFill>
      <Sfx at={0} name="whoosh" vol={0.7} />
      <Sfx at={4} name="impact" vol={0.5} />
      <Sfx at={15} name="paper" vol={0.6} />
      <Sfx at={18} name="truck" vol={0.85} />
      <Sfx at={24} name="airplane" vol={0.75} />
      <Sfx at={33} name="pop" vol={0.6} />
      <Sfx at={39} name="whoosh-fast" vol={0.4} />
      <Sfx at={60} name="check" vol={0.9} />
    </Whip>
  );
};
