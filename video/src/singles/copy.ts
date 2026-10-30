// The coupon line mirrors the real offer: two separate 40%-off shipping coupons
// for new sign-ups, not "80% off".
export const PLATFORMS = [
  { name: "TAOBAO", logo: "img/taobao.png" },
  { name: "1688", logo: "img/1688.png" },
  { name: "WEIDIAN", logo: "img/weidian.png" },
] as const;

export const singlesCopy = {
  hook: { headline: "CHINA'S SINGLES' DAY", month: "NOVEMBER", day: 11 },
  deals: { headline: "BIG SHOPPING DEALS", support: "Save on selected items", tag: "SALE" },
  platforms: { headline: "FIND YOUR NEXT HAUL" },
  quick: { headline: "BE QUICK!", support: "MANY SELLERS PARTICIPATE", date: "11.11" },
  coupons: {
    headline: "PIKOBUY COUPONS",
    panel: "SELECT COUPONS",
    row: "40% OFF SHIPPING",
    offer: "2 × 40% OFF SHIPPING",
    who: "FOR NEW SIGN-UPS",
  },
  cta: {
    headline: "READY FOR SINGLES' DAY?",
    support: "GET YOUR PIKOBUY COUPONS",
    final: "CHECK THE LINK IN MY BIO",
  },
} as const;
