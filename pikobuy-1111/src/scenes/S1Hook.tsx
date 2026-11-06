import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Burst, Flash, LogoCard, Ref } from "../components/Graphics";
import { Whip } from "../components/Layers";
import { shake } from "../components/motion";
import { Pop } from "../components/Pop";
import { Sfx } from "../components/Sfx";
import { BounceText, Center, LinePop } from "../components/Type";
import { C, COPY, SCENES } from "../theme";

/** 0-2s — 11.11 slams in immediately, collage of reference stickers builds around it. */
export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { dur } = SCENES.hook;
  return (
    <Whip dur={dur} inFrom="none">
      <AbsoluteFill style={{ transform: shake(f, [5, 22, 44]) }}>
        <Pop at={8} x={540} y={760} from="pop" shadow={false} z={0}><Burst size={980} spinAt={8} /></Pop>
        <Pop at={10} x={540} y={170} from="top" scale={1}><Ref name="sale-sign" w={600} /></Pop>
        <Pop at={4} x={540} y={740} from="slam" z={3}>
          <BounceText text={COPY.hook[0]} at={4} size={300} fill={C.yellow} stagger={1}
            strokes={[{ w: 58, color: C.white }, { w: 42, color: C.black }, { w: 22, color: C.red }]} />
        </Pop>
        <Pop at={26} x={150} y={530} rot={-10} z={4}><LogoCard file="pikobuy.jpg" w={170} pad={10} radius={30} /></Pop>
        <Pop at={30} x={185} y={1300} rot={-9}><Ref name="bag-1111" w={270} /></Pop>
        <Pop at={36} x={880} y={1300} rot={7}><Ref name="box-price-drop" w={320} /></Pop>
        <Pop at={50} x={540} y={1530} from="left" rot={-2}><Ref name="truck-yellow" w={420} /></Pop>
        <Center y={930}>
          <BounceText text={COPY.hook[1]} at={20} size={150} fill={C.red} />
        </Center>
        <Center y={1095}>
          <LinePop text={COPY.hook[2]} at={42} size={112} fill={C.white} strokes={[{ w: 34, color: C.white }, { w: 18, color: C.black }]} rot={-2} />
        </Center>
      </AbsoluteFill>
      <Flash at={5} />
      <Sfx at={0} name="paper" vol={0.6} />
      <Sfx at={2} name="impact" vol={1} />
      <Sfx at={8} name="whoosh-fast" vol={0.6} />
      <Sfx at={19} name="impact" vol={0.6} />
      <Sfx at={25} name="pop" vol={0.7} />
      <Sfx at={29} name="pop" vol={0.6} />
      <Sfx at={35} name="pop" vol={0.6} />
      <Sfx at={41} name="impact" vol={0.45} />
      <Sfx at={47} name="truck" vol={0.5} />
    </Whip>
  );
};
