import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Sneaker } from "./icons";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const F = "'Montserrat', sans-serif";
const Tick: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}><path d="M 4 12.5 L 9.5 18 L 20 6.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const card: React.CSSProperties = {
  background: "linear-gradient(180deg, #1c2130, #11141d)", borderRadius: 28, border: "3px solid rgba(255,255,255,0.12)",
  boxShadow: "0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)", fontFamily: F, color: "#fff",
};

/** checkout summary: shipping turns red on `warnAt`, coupon applies on `applyAt` */
export const CheckoutCard: React.FC<{ warnAt: number; applyAt: number; w?: number }> = ({ warnAt, applyAt, w = 640 }) => {
  const f = useCurrentFrame();
  const warn = interpolate(f, [warnAt, warnAt + 6], [0, 1], clamp);
  const apply = interpolate(f, [applyAt, applyAt + 10], [0, 1], clamp);
  const row = (label: string, sub: string, value: React.ReactNode, color: string, border?: string) => (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: 16,
        background: "rgba(255,255,255,0.05)", border: `3px solid ${border ?? "transparent"}`, marginBottom: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 20, opacity: 0.55, fontWeight: 600 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 900, color }}>{value}</div>
    </div>
  );
  const red = `rgba(255,70,70,${warn * (1 - apply)})`;
  return (
    <div style={{ ...card, width: w, padding: 26 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.1em", opacity: 0.7, marginBottom: 16 }}>CHECKOUT</div>
      {row("Items", "2 items", "$$", "#fff")}
      {row(
        "Shipping",
        apply > 0.5 ? "coupon applied" : "full price",
        <span>
          <span style={{ textDecoration: apply > 0.5 ? "line-through" : "none", opacity: apply > 0.5 ? 0.45 : 1 }}>$$$</span>
          {apply > 0.5 && <span style={{ color: "#5dff8a", marginLeft: 12 }}>$</span>}
        </span>,
        warn > 0.5 && apply < 0.5 ? "#ff5a5a" : "#fff",
        apply > 0.5 ? `rgba(93,255,138,${apply})` : red,
      )}
      {row("Coupons", apply > 0.5 ? "2 applied" : "not applied", apply > 0.5 ? "−40%" : "—", apply > 0.5 ? "#5dff8a" : "rgba(255,255,255,0.4)", apply > 0.5 ? `rgba(93,255,138,${apply})` : undefined)}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px 18px", fontSize: 34, fontWeight: 900 }}>
        <span>Total</span>
        <span style={{ color: apply > 0.5 ? "#5dff8a" : "#fff" }}>{apply > 0.5 ? "$$$" : "$$$$$"}</span>
      </div>
      <div
        style={{
          borderRadius: 16, padding: "18px 0", textAlign: "center", fontSize: 28, fontWeight: 900, letterSpacing: "0.08em",
          background: apply > 0.5 ? "#22c55e" : "rgba(255,255,255,0.12)", boxShadow: apply > 0.5 ? "0 0 24px rgba(34,197,94,0.7)" : "none",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>PLACE ORDER {apply > 0.5 && <Tick size={30} />}</span>
      </div>
    </div>
  );
};

/** "MY STARTER PLAN" checklist; item k ticks at ticks[k] (frames); labels hidden until `reveal` */
export const PlanCard: React.FC<{ ticks: number[]; reveal?: boolean; w?: number }> = ({ ticks, reveal = true, w = 620 }) => {
  const f = useCurrentFrame();
  const items = ["GET COUPONS FIRST", "SHIP CLOTHES FIRST", "CHECK QC PHOTOS", "DROP SHOEBOXES", "VACUUM-PACK JACKETS"];
  const done = ticks.filter((t) => f >= t).length;
  return (
    <div style={{ ...card, width: w, padding: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 900, letterSpacing: "0.06em", marginBottom: 16 }}>
        <span>MY STARTER PLAN</span>
        <span style={{ opacity: 0.6 }}>{done}/5</span>
      </div>
      {items.map((it, k) => {
        const p = interpolate(f, [ticks[k], ticks[k] + 8], [0, 1], clamp);
        return (
          <div
            key={k}
            style={{
              display: "flex", alignItems: "center", gap: 18, padding: "14px 16px", marginBottom: 10, borderRadius: 14,
              background: p > 0 ? `rgba(34,197,94,${0.18 * p})` : "rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: 40, height: 40, borderRadius: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: p > 0 ? "#22c55e" : "rgba(255,255,255,0.1)", fontSize: 24, fontWeight: 900, transform: `scale(${1 + 0.25 * Math.sin(Math.PI * p)})`,
              }}
            >
              {p > 0 ? <Tick /> : k + 1}
            </div>
            {reveal ? (
              <span style={{ fontSize: 28, fontWeight: 800, opacity: 0.5 + 0.5 * p }}>{it}</span>
            ) : (
              <div style={{ height: 14, width: 200 + 60 * (k % 3), borderRadius: 7, background: "rgba(255,255,255,0.18)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/** product photo card: seller (glossy, stars) or QC (real warehouse photo) */
export const PhotoCard: React.FC<{ kind: "seller" | "qc"; w?: number }> = ({ kind, w = 300 }) => {
  const seller = kind === "seller";
  return (
    <div
      style={{
        ...card, width: w, padding: 16, borderRadius: 24,
        background: seller ? "linear-gradient(180deg, #6b4dff, #3a23b8)" : "linear-gradient(180deg, #4a4f5c, #2a2d35)",
        border: `4px solid ${seller ? "#c9b8ff" : "#8a8f9a"}`, transform: `rotate(${seller ? -6 : 6}deg)`,
      }}
    >
      <div
        style={{
          height: w * 0.78, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
          background: seller ? "radial-gradient(circle at 50% 40%, #e9ddff, #9b83ff)" : "linear-gradient(180deg, #9a9488, #6b665d)",
          filter: seller ? undefined : "saturate(0.6) contrast(0.9)",
        }}
      >
        <Sneaker w={w * 0.78} worn={!seller} />
      </div>
      <div style={{ textAlign: "center", marginTop: 12, fontSize: w * 0.085, fontWeight: 900, letterSpacing: "0.06em" }}>
        {seller ? "SELLER PHOTO" : "QC PHOTO"}
      </div>
      <div style={{ textAlign: "center", fontSize: w * 0.06, fontWeight: 700, opacity: 0.75 }}>
        {seller ? "★★★★★" : "REAL ITEM · WAREHOUSE"}
      </div>
    </div>
  );
};

/** settings-style toggle row */
export const ToggleRow: React.FC<{ onAt: number; w?: number }> = ({ onAt, w = 600 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [onAt, onAt + 8], [0, 1], clamp);
  return (
    <div style={{ ...card, width: w, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 24 }}>
      <div>
        <div style={{ fontSize: 32, fontWeight: 900 }}>Remove shoebox</div>
        <div style={{ fontSize: 20, opacity: 0.55, fontWeight: 600 }}>Ship the shoes without the box</div>
      </div>
      <div style={{ width: 110, height: 60, borderRadius: 30, background: p > 0.5 ? "#22c55e" : "rgba(255,255,255,0.18)", position: "relative", boxShadow: p > 0.5 ? "0 0 20px rgba(34,197,94,0.8)" : "none" }}>
        <div style={{ position: "absolute", top: 6, left: 6 + 50 * p, width: 48, height: 48, borderRadius: 24, background: "#fff" }} />
      </div>
    </div>
  );
};
