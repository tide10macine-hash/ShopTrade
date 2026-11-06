import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DownArrow, LogoCard, PriceTag, Ref } from "../components/Graphics";
import { Whip } from "../components/Layers";
import { shake } from "../components/motion";
import { Pop } from "../components/Pop";
import { Sfx } from "../components/Sfx";
import { BounceText, Center, LinePop } from "../components/Type";
import { C, COPY, SCENES } from "../theme";

/** 2-4s — CHEAPEST PRICES: price tags drop, arrow plunges, coins & cash. */
export const S2Prices: React.FC = () => {
  const f = useCurrentFrame();
  const { dur } = SCENES.prices;
  return (
    <Whip dur={dur}>
      <AbsoluteFill style={{ transform: shake(f, [14, 34]) }}>
        <Center y={250}><BounceText text="THE CHEAPEST" at={3} size={118} fill={C.red} /></Center>
        <Center y={380}><BounceText text="PRICES!" at={12} size={190} fill={C.yellow} /></Center>
        <Center y={600}>
          <LinePop text={COPY.prices.sub} at={44} size={66} fill={C.white} strokes={[{ w: 26, color: C.white }, { w: 14, color: C.black }]} />
        </Center>
        <Pop at={18} x={360} y={860} rot={-8}><PriceTag w={430} old="$$$" now="$" swingAt={18} /></Pop>
        <Pop at={22} x={820} y={900} from="top"><DownArrow w={190} h={330} growAt={22} /></Pop>
        <Pop at={30} x={540} y={1290} from="bottom"><Ref name="coins-cash" w={760} /></Pop>
        <Pop at={52} x={140} y={1110} rot={-10} z={3}><LogoCard file="weidian.png" w={140} pad={8} radius={26} /></Pop>
        <Pop at={58} x={945} y={1150} rot={9} z={3}><LogoCard file="p-app.png" w={140} pad={8} radius={26} /></Pop>
      </AbsoluteFill>
      <Sfx at={0} name="whoosh" vol={0.7} />
      <Sfx at={10} name="impact" vol={0.55} />
      <Sfx at={17} name="cash-register" vol={0.9} />
      <Sfx at={21} name="whoosh-fast" vol={0.5} />
      <Sfx at={29} name="coins" vol={0.9} />
      <Sfx at={43} name="pop" vol={0.6} />
      <Sfx at={51} name="pop" vol={0.6} />
      <Sfx at={57} name="pop" vol={0.6} />
    </Whip>
  );
};
