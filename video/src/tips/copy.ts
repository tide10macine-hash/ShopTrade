// On-screen copy for the "5 ways to save on shipping" video.
// Wording follows the brief's safe phrasing: no invented prices, coupon values or
// guarantees. Example weights/dimensions in the rehearsal scene are labelled as examples.
export const tipsCopy = {
  hook: {
    headline: "STOP OVERPAYING FOR SHIPPING",
    sub: "5 ways to save on your next haul",
    priceLabel: "SHIPPING",
  },
  vacuum: {
    title: "1. USE VACUUM BAGS",
    support: ["Reduce parcel volume"],
    before: "BEFORE",
    after: "AFTER",
  },
  boxes: {
    title: "2. REMOVE EXTRA BOXES",
    support: ["Less unnecessary packaging = less volume"],
    chip: "SMALLER PARCEL",
    footnote: "Only remove packaging that's safe to remove.",
  },
  lines: {
    title: "3. COMPARE TAX-FREE LINES",
    support: ["Choose the right option for your destination"],
    cards: [
      { name: "Standard Air", tag: null },
      { name: "Tax-Free Line", tag: "TAX-FREE" },
      { name: "Express", tag: null },
      { name: "Economy", tag: null },
    ],
    selectedIndex: 1,
    selected: "SELECTED",
    footnote: "Tax-free availability depends on line and destination. Customs charges can still apply.",
  },
  coupons: {
    title: "4. USE YOUR COUPONS",
    support: ["Save more on eligible shipping costs"],
    applied: "COUPON APPLIED",
    footnote: "Coupon terms and eligibility are set by Pikobuy.",
  },
  rehearsal: {
    title: "5. USE REHEARSAL",
    support: ["Know your parcel's actual size and weight", "Get a clearer shipping price before shipping"],
    example: { kg: 4.82, dims: [40, 30, 25] },
    estimate: "ESTIMATED SHIPPING",
    // Set true only if Pikobuy confirms the selected service gives a fixed quote.
    fixedQuoteConfirmed: false,
    quoteFixed: "FIXED SHIPPING QUOTE",
    quoteAccurate: "QUOTE FROM YOUR PACKED PARCEL",
    exampleTag: "EXAMPLE",
  },
  offer: {
    // Set false if the $40 / 5 kg rate can't be verified for your audience; the
    // scene then shows the fallback line. The voiceover line must change with it.
    showRate: true,
    price: 40,
    weight: "FOR 5 KG?",
    support: "Pikobuy shipping offer — check current rates",
    fine: "Advertised starting rate. Varies by destination, shipping line and parcel size.",
    fallback: "COMPARE SHIPPING RATES ON PIKOBUY",
  },
  cta: {
    headline: "SAVE ON YOUR NEXT HAUL",
    final: "Check the first link in my bio",
    checkout: "CHECKOUT",
  },
} as const;
