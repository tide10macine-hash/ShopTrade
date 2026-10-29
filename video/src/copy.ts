// All on-screen copy. The offer mirrors the coupon art exactly: two separate
// 40%-off shipping coupons for new sign-ups. Don't merge them into "80% off".
export const copy = {
  hookKicker: "WAIT…",
  hookHeadline: "STILL PAYING FULL PRICE FOR SHIPPING?",
  hookHighlight: ["SHIPPING?"],

  shippingQuestion: "ORDERING FROM CHINA?",
  shippingLine: "SHIPPING ADDS UP FAST.",
  shippingChips: ["AIR FREIGHT", "CUSTOMS", "DELIVERY"],

  meetKicker: "MEET",
  tagline: "YOUR SHOPPING AGENT FOR CHINA.",
  flow: ["YOU ORDER", "PIKOBUY BUYS", "SHIPS TO YOU"],

  offerKicker: "NEW TO PIKOBUY?",
  coupons: [
    { label: "COUPON 1", percent: 40, suffix: "% OFF SHIPPING" },
    { label: "COUPON 2", percent: 40, suffix: "% OFF SHIPPING" },
  ],
  offerLine: "FOR NEW SIGN-UPS THROUGH MY LINK.",
  offerFootnote: "Coupon terms and eligibility are set by Pikobuy.",

  ctaLines: ["DON'T MISS OUT.", "SIGN UP WITH MY LINK.", "FIRST LINK IN BIO"],
} as const;
