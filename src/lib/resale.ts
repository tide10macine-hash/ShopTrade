import type { Product, ResaleComp, ResaleEstimate } from "@/types";

// Approximate seller-side fee schedules. Real values vary by category/seller
// level — treat as an estimate, not a quote.
const MARKETPLACE_FEE_PCT: Record<ResaleComp["source"], number> = {
  "ebay-sold": 0.1325, // eBay final value fee, most categories
  stockx: 0.1, // StockX standard seller fee tier
};

const PAYMENT_PROCESSING_FEE_PCT = 0.03;

const SHIPPING_ESTIMATE_BY_CATEGORY: Record<Product["category"], number> = {
  sneakers: 12,
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
