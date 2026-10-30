// Comparison figures are the ones supplied for this video, not measured here.
// Keep them labelled as example/supplied figures and check current rates before posting.
export type Agent = {
  name: string;
  highlight: boolean;
  shipping5kg: number;
  arrivalDays: readonly [number, number];
  // Total for the same $200 example item; null where no figure was supplied.
  itemTotal: number | null;
};

export const AGENTS: readonly Agent[] = [
  { name: "PIKOBUY", highlight: true, shipping5kg: 42, arrivalDays: [1, 3], itemTotal: 200 },
  { name: "HIPOBUY", highlight: false, shipping5kg: 64, arrivalDays: [3, 5], itemTotal: null },
  { name: "LITBUY", highlight: false, shipping5kg: 72, arrivalDays: [3, 5], itemTotal: 220 },
];

export const PIKOBUY = AGENTS[0];
export const LITBUY = AGENTS[2];

export const compareCopy = {
  sourceNote: "Example figures supplied for this video. Check current rates.",
  hook: {
    headline: "CHEAPEST AGENT 2026?",
    sub: "Compare before you buy.",
  },
  shipping: {
    headline: "SHIPPING COST FOR 5 KG",
    caption: "Prices may vary by destination and shipping line.",
  },
  warehouse: {
    headline: "FASTER WAREHOUSE ARRIVAL?",
    support: "Warehouse arrival times",
    scanned: "ARRIVED · SCANNED",
    caption: "Time to arrive at the warehouse, not quality-check completion. Not guaranteed.",
  },
  pricing: {
    headline: "SAME ITEM. DIFFERENT TOTAL?",
    basePrice: 200,
    productLabel: "Product price",
    // Neutral on purpose: relabel (e.g. "Markup", "Service fee") only once you know what the $20 is.
    extraLabel: "Additional charge",
    totalLabel: "TOTAL",
    caption: "Example listing. Compare product prices and extra charges before ordering.",
  },
  table: {
    headline: "COMPARE THE TOTAL COST",
    columns: ["SHIPPING 5 KG", "WAREHOUSE ARRIVAL", "$200 ITEM"],
  },
  cta: {
    headline: "PIKOBUY STANDS OUT",
    categories: ["Shipping cost", "Arrival time", "Product price"],
    sub: "Compare the rates for yourself.",
    final: "Check the first link in my bio.",
  },
} as const;

export const days = ([min, max]: readonly [number, number]) => `${min}–${max} DAYS`;
