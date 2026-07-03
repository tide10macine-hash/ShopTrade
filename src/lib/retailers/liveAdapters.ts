import type { RetailerAdapter } from "./types";

/**
 * Real integration points for the "official APIs / affiliate networks" data
 * sourcing strategy — this is how Honey, RetailMeNot, and Google Shopping
 * actually get retailer data, and it's the sustainable/legal path described
 * in the README (vs. scraping, which is a greyer, last-resort fallback).
 *
 * Each adapter below is a stub: it reports whether it's configured via env
 * vars, and throws with setup instructions if `fetchLivePrices` is called
 * before credentials are wired up. Swap the throw for a real signed request
 * against the named API once you have program approval + keys, and point
 * `lib/products.ts` at it instead of the seed adapter for that source.
 */

function requireEnv(vars: string[]): boolean {
  return vars.every((v) => Boolean(process.env[v]?.trim()));
}

export const amazonPaapiAdapter: RetailerAdapter & {
  fetchLivePrices(asin: string): Promise<never>;
} = {
  source: "amazon-paapi",
  label: "Amazon Product Advertising API (PA-API 5.0)",
  requiredEnvVars: ["AMAZON_PAAPI_ACCESS_KEY", "AMAZON_PAAPI_SECRET_KEY", "AMAZON_PAAPI_PARTNER_TAG"],
  isConfigured() {
    return requireEnv(this.requiredEnvVars);
  },
  async fetchLivePrices() {
    throw new Error(
      "Amazon PA-API is not configured. Join Amazon Associates, request PA-API access, then set " +
        "AMAZON_PAAPI_ACCESS_KEY / AMAZON_PAAPI_SECRET_KEY / AMAZON_PAAPI_PARTNER_TAG and implement the signed request here."
    );
  },
};

export const walmartAffiliateAdapter: RetailerAdapter & {
  fetchLivePrices(itemId: string): Promise<never>;
} = {
  source: "walmart-affiliate",
  label: "Walmart Affiliate API (via Impact)",
  requiredEnvVars: ["WALMART_AFFILIATE_API_KEY"],
  isConfigured() {
    return requireEnv(this.requiredEnvVars);
  },
  async fetchLivePrices() {
    throw new Error(
      "Walmart Affiliate API is not configured. Apply through the Walmart Creator / Impact affiliate program, then set " +
        "WALMART_AFFILIATE_API_KEY and implement the request here."
    );
  },
};

export const ebayBrowseAdapter: RetailerAdapter & {
  fetchLivePrices(query: string): Promise<never>;
  fetchSoldComps(query: string): Promise<never>;
} = {
  source: "ebay-browse",
  label: "eBay Browse API",
  requiredEnvVars: ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"],
  isConfigured() {
    return requireEnv(this.requiredEnvVars);
  },
  async fetchLivePrices() {
    throw new Error(
      "eBay Browse API is not configured. Register in the eBay Developers Program, join the eBay Partner Network, then set " +
        "EBAY_CLIENT_ID / EBAY_CLIENT_SECRET and implement the OAuth + request flow here."
    );
  },
  async fetchSoldComps() {
    throw new Error(
      "eBay sold-listing comps require the same EBAY_CLIENT_ID / EBAY_CLIENT_SECRET credentials as fetchLivePrices — " +
        "used by the V2 resale module to replace the seeded resaleComps data."
    );
  },
};

export const googleShoppingContentAdapter: RetailerAdapter & {
  fetchLivePrices(query: string): Promise<never>;
} = {
  source: "google-shopping-content",
  label: "Google Shopping Content API",
  requiredEnvVars: ["GOOGLE_SHOPPING_MERCHANT_ID", "GOOGLE_SHOPPING_SERVICE_ACCOUNT_JSON"],
  isConfigured() {
    return requireEnv(this.requiredEnvVars);
  },
  async fetchLivePrices() {
    throw new Error(
      "Google Shopping Content API is not configured. Set up a Merchant Center account and service account, then set " +
        "GOOGLE_SHOPPING_MERCHANT_ID / GOOGLE_SHOPPING_SERVICE_ACCOUNT_JSON and implement the request here."
    );
  },
};

export const rakutenAdvertisingAdapter: RetailerAdapter & {
  fetchLivePrices(query: string): Promise<never>;
} = {
  source: "rakuten-advertising",
  label: "Rakuten Advertising Product Feed API",
  requiredEnvVars: ["RAKUTEN_ADVERTISING_TOKEN"],
  isConfigured() {
    return requireEnv(this.requiredEnvVars);
  },
  async fetchLivePrices() {
    throw new Error(
      "Rakuten Advertising is not configured. Apply as a publisher, get advertiser (retailer) approval, then set " +
        "RAKUTEN_ADVERTISING_TOKEN and implement the feed request here."
    );
  },
};

export const cjAffiliateAdapter: RetailerAdapter & {
  fetchLivePrices(query: string): Promise<never>;
} = {
  source: "cj-affiliate",
  label: "CJ Affiliate Product Feed API",
  requiredEnvVars: ["CJ_AFFILIATE_API_TOKEN", "CJ_AFFILIATE_COMPANY_ID"],
  isConfigured() {
    return requireEnv(this.requiredEnvVars);
  },
  async fetchLivePrices() {
    throw new Error(
      "CJ Affiliate is not configured. Apply as a publisher, get advertiser approval, then set " +
        "CJ_AFFILIATE_API_TOKEN / CJ_AFFILIATE_COMPANY_ID and implement the feed request here."
    );
  },
};

export const skimlinksAdapter: RetailerAdapter & {
  fetchLivePrices(query: string): Promise<never>;
} = {
  source: "skimlinks",
  label: "Skimlinks Merchant Feed",
  requiredEnvVars: ["SKIMLINKS_API_KEY"],
  isConfigured() {
    return requireEnv(this.requiredEnvVars);
  },
  async fetchLivePrices() {
    throw new Error("Skimlinks is not configured. Set SKIMLINKS_API_KEY and implement the feed request here.");
  },
};

export const LIVE_ADAPTERS = {
  "amazon-paapi": amazonPaapiAdapter,
  "walmart-affiliate": walmartAffiliateAdapter,
  "ebay-browse": ebayBrowseAdapter,
  "google-shopping-content": googleShoppingContentAdapter,
  "rakuten-advertising": rakutenAdvertisingAdapter,
  "cj-affiliate": cjAffiliateAdapter,
  skimlinks: skimlinksAdapter,
} as const satisfies Record<string, RetailerAdapter>;

export function isSourceLive(source: string): boolean {
  const adapter = (LIVE_ADAPTERS as Record<string, RetailerAdapter>)[source];
  return adapter?.isConfigured() ?? false;
}
