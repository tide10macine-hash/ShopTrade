import { Easing } from "remotion";

/** Single source of truth for the PIKOBUY 11.11 ad. Never inline colours/easings elsewhere. */
export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const BPM = 120;
export const BEAT = (FPS * 60) / BPM; // 30 frames per beat

export const C = {
  red: "#E8222B",
  redDeep: "#B3121A",
  yellow: "#FFD21F",
  yellowHot: "#FFE14D",
  white: "#FFFFFF",
  black: "#111111",
  ink: "#1A1A1A",
  green: "#1FA34A",
  greenDeep: "#127A35",
  piko: "#7FF2F0", // PIKOBUY cyan, used only as a tiny accent next to its logo
  shadow: "rgba(0,0,0,0.35)",
};

export const FONT = {
  display: "LilitaOne, Impact, sans-serif", // chunky rounded headline face
  condensed: "Anton, Impact, sans-serif", // tall condensed for fine print / labels
};

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const SPRING = {
  pop: { damping: 9, stiffness: 220, mass: 0.6 }, // sticker pop with overshoot
  slam: { damping: 14, stiffness: 320, mass: 0.9 }, // heavy text slam
  soft: { damping: 20, stiffness: 120, mass: 1 },
};

/** Scene boundaries in frames (60 fps). Total = 20 s. */
export const SCENES = {
  hook: { from: 0, dur: 120 }, // 0-2s   11.11 MEGA SALE
  prices: { from: 120, dur: 120 }, // 2-4s   CHEAPEST PRICES
  shipping: { from: 240, dur: 120 }, // 4-6s   FASTEST SHIPPING
  coupon: { from: 360, dur: 240 }, // 6-10s  UP TO 80% OFF
  collage: { from: 600, dur: 180 }, // 10-13s WHY PAY MORE?
  countdown: { from: 780, dur: 180 }, // 13-16s 11.11 COUNTDOWN
  endcard: { from: 960, dur: 240 }, // 16-20s PIKOBUY branding + link in bio
};
export const TOTAL = 1200;

/** Copy lives here so wording can be changed without touching animation code. */
export const COPY = {
  hook: ["11.11", "MEGA SALE", "IS HERE!"],
  prices: { head: "THE CHEAPEST PRICES!", sub: "MORE PRODUCTS. LESS MONEY." },
  shipping: { head: "FASTEST SHIPPING!", sub: "YOUR PACKAGES, FASTER!" },
  coupon: {
    head: "UP TO",
    big: "80%",
    off: "OFF!",
    sub: "WITH EXCLUSIVE 11.11 COUPONS!",
    stack: "STACK YOUR SAVINGS!",
    // 80% = maximum combined saving from the two 40% coupons (per the link-in-bio offer "80% OFF [2x 40%]").
    fine: "*Max. total coupon savings (2 × 40% coupons) on eligible orders. Coupon T&Cs apply.",
  },
  collage: { head: "WHY PAY MORE?", sub: "SHOP SMART WITH PIKOBUY!", badges: ["CHEAPEST PRICES", "FASTEST SHIPPING", "UP TO 80% OFF*"] },
  countdown: { head: "THE BIG SHOPPING EVENT!", sub: "DON'T MISS OUT!" },
  endcard: {
    head: "PIKOBUY 11.11 MEGA SALE",
    l1: "CHEAPEST PRICES. FASTEST SHIPPING.",
    l2: "UP TO 80% OFF WITH COUPONS!*",
    slogan: "SHOP MORE. SAVE MORE.",
    cta: "CHECK THE FIRST LINK IN MY BIO!",
  },
};

/** Set to false to drop the other supplied agent logos (Litbuy, cow) from the end card. */
export const SHOW_PARTNER_ROW = true;
