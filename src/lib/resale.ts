import type { Product, ResaleChannelEstimate, ResaleComp, ResaleEstimate } from "@/types";

// Approximate seller-side fee schedules. Real values vary by category/seller
// level — treat as an estimate, not a quote.
const MARKETPLACE_FEE_PCT: Record<ResaleComp["source"], number> = {
  "ebay-sold": 0.1325, // eBay final value fee, most categories
  stockx: 0.1, // StockX standard seller fee tier
};

const PAYMENT_PROCESSING_FEE_PCT = 0.03;

const SHIPPING_ESTIMATE_BY_CATEGORY: Record<Product["category"], number> = {
  sneakers: 12,
  apparel: 10,
  electronics: 15,
  collectibles: 9,
  gaming: 14,
  home: 18,
  toys: 8,
};

/**
 * Informational resale/flip estimate: "here's roughly what this resells for,
 * after fees" — never an auto-buy signal. Keeping this read-only is the
 * safest posture for staying inside affiliate program and retailer ToS.
 */
export function computeResaleEstimate(product: Product, retailPrice: number): ResaleEstimate {
  const comps = product.resaleComps ?? [];

  if (comps.length === 0) {
    return {
      bestComp: null,
      averageCompPrice: null,
      marketplaceFeePct: 0,
      paymentProcessingFeePct: PAYMENT_PROCESSING_FEE_PCT,
      estimatedShipping: 0,
      netResaleValue: null,
      estimatedMargin: null,
      estimatedMarginPct: null,
    };
  }

  const sorted = [...comps].sort((a, b) => (a.date < b.date ? 1 : -1));
  const bestComp = sorted[0];
  const averageCompPrice = comps.reduce((sum, c) => sum + c.price, 0) / comps.length;

  const marketplaceFeePct = MARKETPLACE_FEE_PCT[bestComp.source];
  const estimatedShipping = SHIPPING_ESTIMATE_BY_CATEGORY[product.category] ?? 10;

  const fees = bestComp.price * (marketplaceFeePct + PAYMENT_PROCESSING_FEE_PCT);
  const netResaleValue = Math.round((bestComp.price - fees - estimatedShipping) * 100) / 100;
  const estimatedMargin = Math.round((netResaleValue - retailPrice) * 100) / 100;
  const estimatedMarginPct = Math.round((estimatedMargin / retailPrice) * 1000) / 10;

  return {
    bestComp,
    averageCompPrice: Math.round(averageCompPrice * 100) / 100,
    marketplaceFeePct,
    paymentProcessingFeePct: PAYMENT_PROCESSING_FEE_PCT,
    estimatedShipping,
    netResaleValue,
    estimatedMargin,
    estimatedMarginPct,
  };
}

interface ChannelConfig {
  channel: ResaleChannelEstimate["channel"];
  label: string;
  feePct: number;
  paymentProcessingPct: number;
  flatFee: number;
  includesShipping: boolean;
  note: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    channel: "facebook-marketplace",
    label: "Facebook Marketplace",
    feePct: 0,
    paymentProcessingPct: 0,
    flatFee: 0,
    includesShipping: false,
    note: "Assumes local pickup — no listing fee, no shipping cost. Shipped Facebook orders instead carry a ~5% selling fee plus shipping.",
  },
  {
    channel: "shopify",
    label: "Your own Shopify store",
    feePct: 0,
    paymentProcessingPct: 0.029,
    flatFee: 0.3,
    includesShipping: true,
    note: "No marketplace commission — just card processing. You cover shipping, buyer trust, and driving your own traffic, and need a paid Shopify plan (from ~$39/mo).",
  },
  {
    channel: "stockx",
    label: "StockX",
    feePct: MARKETPLACE_FEE_PCT.stockx,
    paymentProcessingPct: PAYMENT_PROCESSING_FEE_PCT,
    flatFee: 0,
    includesShipping: true,
    note: "Authenticated marketplace — StockX handles buyer trust and ships on your behalf for a cut.",
  },
  {
    channel: "ebay",
    label: "eBay",
    feePct: MARKETPLACE_FEE_PCT["ebay-sold"],
    paymentProcessingPct: PAYMENT_PROCESSING_FEE_PCT,
    flatFee: 0,
    includesShipping: true,
    note: "Widest buyer reach of the four, at the highest take rate.",
  },
];

/**
 * Compares net proceeds across sell-through channels for the same assumed
 * asking price (the most recent comp), so "where should I actually sell
 * this" is an apples-to-apples comparison of take rates — not a
 * recommendation to list everywhere at once.
 */
export function computeResaleChannels(product: Product, retailPrice: number): ResaleChannelEstimate[] {
  const comps = product.resaleComps ?? [];
  if (comps.length === 0) return [];

  const sorted = [...comps].sort((a, b) => (a.date < b.date ? 1 : -1));
  const grossPrice = sorted[0].price;
  const shippingCost = SHIPPING_ESTIMATE_BY_CATEGORY[product.category] ?? 10;

  const estimates = CHANNELS.map((config): ResaleChannelEstimate => {
    const fees = grossPrice * (config.feePct + config.paymentProcessingPct) + config.flatFee;
    const shipping = config.includesShipping ? shippingCost : 0;
    const netProceeds = Math.round((grossPrice - fees - shipping) * 100) / 100;
    return {
      channel: config.channel,
      label: config.label,
      grossPrice,
      feePct: config.feePct + config.paymentProcessingPct,
      flatFee: config.flatFee,
      shippingCost: shipping,
      netProceeds,
      netMargin: Math.round((netProceeds - retailPrice) * 100) / 100,
      note: config.note,
    };
  });

  return estimates.sort((a, b) => b.netProceeds - a.netProceeds);
}
