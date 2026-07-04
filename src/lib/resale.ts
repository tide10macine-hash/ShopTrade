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

// Universal channels — any resellable item can go through these.
const GENERAL_CHANNELS: ChannelConfig[] = [
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
    channel: "ebay",
    label: "eBay",
    feePct: MARKETPLACE_FEE_PCT["ebay-sold"],
    paymentProcessingPct: PAYMENT_PROCESSING_FEE_PCT,
    flatFee: 0,
    includesShipping: true,
    note: "Widest general buyer reach, at the highest marketplace take rate.",
  },
];

// Sneaker/streetwear authentication marketplaces — wrong for a LEGO set or a
// sealed booster box, since neither StockX nor GOAT deal in those.
const SNEAKER_CHANNELS: ChannelConfig[] = [
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
    channel: "goat",
    label: "GOAT",
    feePct: 0.095,
    paymentProcessingPct: PAYMENT_PROCESSING_FEE_PCT,
    flatFee: 0,
    includesShipping: true,
    note: "Authenticated marketplace, similar model to StockX — fee varies by seller level.",
  },
];

// Apparel/fashion resale platforms — wrong for sneakers-as-collectibles
// pricing conventions or non-wearable items.
const APPAREL_CHANNELS: ChannelConfig[] = [
  {
    channel: "poshmark",
    label: "Poshmark",
    feePct: 0.2, // flat 20% above the $15 threshold, which every demo comp clears
    paymentProcessingPct: 0,
    flatFee: 0,
    includesShipping: false, // Poshmark provides a prepaid shipping label to the buyer
    note: "Flat 20% commission on sales $15+ (a flat $2.95 below that). Poshmark provides the prepaid shipping label.",
  },
  {
    channel: "depop",
    label: "Depop",
    feePct: 0.1,
    paymentProcessingPct: PAYMENT_PROCESSING_FEE_PCT,
    flatFee: 0,
    includesShipping: true,
    note: "10% transaction fee, no listing fee — you set your own shipping cost and price.",
  },
];

const CHANNELS_BY_CATEGORY: Record<Product["category"], ChannelConfig[]> = {
  sneakers: [...SNEAKER_CHANNELS, ...GENERAL_CHANNELS],
  apparel: [...APPAREL_CHANNELS, ...GENERAL_CHANNELS],
  collectibles: GENERAL_CHANNELS,
  electronics: GENERAL_CHANNELS,
  gaming: GENERAL_CHANNELS,
  home: GENERAL_CHANNELS,
  toys: GENERAL_CHANNELS,
};

/**
 * Compares net proceeds across sell-through channels appropriate for the
 * product's category (StockX/GOAT for sneakers, Poshmark/Depop for apparel,
 * general marketplaces for everything) at the same assumed asking price
 * (the most recent comp) — an apples-to-apples comparison of take rates,
 * not a recommendation to list everywhere at once.
 */
export function computeResaleChannels(product: Product, retailPrice: number): ResaleChannelEstimate[] {
  const comps = product.resaleComps ?? [];
  if (comps.length === 0) return [];

  const sorted = [...comps].sort((a, b) => (a.date < b.date ? 1 : -1));
  const grossPrice = sorted[0].price;
  const shippingCost = SHIPPING_ESTIMATE_BY_CATEGORY[product.category] ?? 10;
  const channels = CHANNELS_BY_CATEGORY[product.category] ?? GENERAL_CHANNELS;

  const estimates = channels.map((config): ResaleChannelEstimate => {
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
