// Core domain types for ShopTrade: price comparison + resale finder.

/** How ShopTrade sources price data for a given retailer. Official APIs / affiliate
 *  networks are the primary, sustainable path — see README for the sourcing strategy. */
export type ApiSource =
  | "amazon-paapi"
  | "walmart-affiliate"
  | "ebay-browse"
  | "google-shopping-content"
  | "rakuten-advertising"
  | "cj-affiliate"
  | "skimlinks"
  | "manual-verified";

export interface TrustCriteria {
  ssl: boolean;
  businessRegistered: boolean;
  /** BBB rating letter grade, or null if not rated/applicable. */
  bbbRating: string | null;
  /** Trustpilot score out of 5, or null if no public profile. */
  trustpilotScore: number | null;
  trustpilotReviewCount: number | null;
  /** Retailer was manually reviewed by the ShopTrade curation process (not just API-eligible). */
  manuallyReviewed: boolean;
}

export interface Retailer {
  id: string;
  name: string;
  domain: string;
  apiSource: ApiSource;
  affiliateNetwork: string;
  /** URL template for outbound affiliate links. `{url}` is replaced with the product URL. */
  affiliateLinkTemplate: string;
  trust: TrustCriteria;
  /** Accent color for UI badges when no logo asset is available. */
  accentColor: string;
  /** If set, this is a direct brand storefront that only carries this exact
   *  brand's products (e.g. Nike only sells Nike) — never assigned as an
   *  offer for a product from a different brand. */
  brandOnly?: string;
  /** Verified on-site search URL pattern, `{q}` = URL-encoded product name.
   *  Falls back to a generic `{domain}/search?q={q}` guess when unset. */
  searchUrlTemplate?: string;
}

export type ProductCategory =
  | "electronics"
  | "sneakers"
  | "apparel"
  | "collectibles"
  | "home"
  | "toys"
  | "gaming";

export interface PricePoint {
  date: string; // ISO date (YYYY-MM-DD)
  price: number;
}

export interface RetailerOffer {
  retailerId: string;
  price: number;
  currency: "USD";
  inStock: boolean;
  url: string;
  lastChecked: string; // ISO datetime
  history: PricePoint[]; // trailing price history for the chart
}

export interface ResaleComp {
  source: "ebay-sold" | "stockx";
  price: number;
  date: string; // ISO date
  condition: "new" | "used";
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  upc: string;
  category: ProductCategory;
  /** Emoji placeholder used in lieu of licensed product imagery in the MVP. */
  emoji: string;
  msrp: number;
  /** Whether this product is a good candidate for the V2 resale/flip module. */
  flippable: boolean;
  offers: RetailerOffer[];
  resaleComps?: ResaleComp[];
}

export interface TrustScore {
  score: number; // 0-100
  verified: boolean;
  reasons: string[];
}

export interface ResaleEstimate {
  bestComp: ResaleComp | null;
  averageCompPrice: number | null;
  marketplaceFeePct: number;
  paymentProcessingFeePct: number;
  estimatedShipping: number;
  netResaleValue: number | null;
  estimatedMargin: number | null;
  estimatedMarginPct: number | null;
}

export interface ResaleChannelEstimate {
  channel: "ebay" | "stockx" | "goat" | "poshmark" | "depop" | "facebook-marketplace" | "shopify";
  label: string;
  grossPrice: number;
  /** Combined marketplace + payment processing fee rate. */
  feePct: number;
  flatFee: number;
  shippingCost: number;
  netProceeds: number;
  /** Net proceeds minus what you paid at retail. */
  netMargin: number;
  note: string;
}

export interface PriceAlertRequest {
  productId: string;
  email: string;
  targetPrice: number;
}
