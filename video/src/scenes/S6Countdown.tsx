import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Banner, Pop, PopText, Sticker, Outlined } from "../components/core";
import { MarkerCircle, RoundBadge, StatusChip } from "../components/graphics";
import { Sfx } from "../components/Sfx";
import { CAMPAIGN } from "../campaign";

// 13-16s: calendar countdown to 11.11
export const S6Countdown: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = 1 + 0.035 * Math.exp(-(((frame - 6) % 30) + 30) % 30 / 5);
  const live = CAMPAIGN.status === "live";
  return (
    <>
      <PopText text="THE BIG" x={540} y={255} size={84} delay={4} color={C.white} rim={8} />
      <PopText text="SHOPPING EVENT!" x={540} y={365} size={84} delay={10} stagger={1} color={C.red} rim={8} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${beat})`, transformOrigin: "540px 900px" }}>
        <Sticker src="reference-icons/calendar.png" x={540} y={910} w={640} delay={2} from="bottom" idle={0.4} />
        <div style={{ position: "absolute", left: 548, top: 905 }}>
          <MarkerCircle w={150} h={135} delay={30} />
        </div>
        <Pop x={540} y={540} from="slam" delay={16} rot={-2}>
          <Outlined text="11.11!" size={190} color={C.red} rim={12} />
        </Pop>
        <Pop x={840} y={1150} delay={40} rot={10}>
          <RoundBadge d={250} top="NOV" big="11" />
        </Pop>
      </div>
      <Pop x={540} y={1340} delay={82} rot={-3}>
        <Banner text="DON'T MISS OUT!" size={76} bg={C.red} color={C.white} />
      </Pop>
      <Pop x={540} y={1470} delay={96}>
        <StatusChip text={live ? "LIVE NOW" : "STARTS 11.11"} live={live} />
      </Pop>

      <Sfx at={2} name="whoosh" vol={0.4} />
      <Sfx at={16} name="impact" vol={0.7} />
      <Sfx at={30} name="paper-rustle" vol={0.5} />
      <Sfx at={40} name="pop" vol={0.55} />
      <Sfx at={82} name="pop-high" vol={0.55} />
      {Array.from({ length: 9 }, (_, i) => (
        <Sfx key={i} at={20 + i * 15} name={i % 2 ? "tock" : "tick"} vol={0.55} />
      ))}
    </>
  );
};
