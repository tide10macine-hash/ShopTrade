import type { Retailer } from "@/types";

/**
 * Builds a real, live search-results link for a query on a retailer's own
 * site — a verified pattern where retailers.json has one, a generic
 * {domain}/search?q= guess otherwise. This is the same fallback pattern
 * scripts/seed.mjs uses for offers without a verified deep link, exposed
 * here for runtime use: a curated demo catalog can never hold everything a
 * real store carries, so when it doesn't, this hands off to the real,
 * complete, live search on that store instead of pretending to have it.
 */
export function buildStoreSearchLink(retailer: Retailer, query: string): string {
  const template = retailer.searchUrlTemplate ?? `https://www.${retailer.domain}/search?q={q}`;
  return template.replace("{q}", encodeURIComponent(query));
}

/** A reasonable spread of major, recognizable retailers to offer as
 *  "search elsewhere" shortcuts — not the full 97, just enough to be useful
 *  without overwhelming the page. */
export const QUICK_SEARCH_RETAILER_IDS = [
  "amazon",
  "walmart",
  "target",
  "ebay",
  "nike",
  "adidas",
  "bestbuy",
  "nordstrom",
  "newegg",
  "etsy",
  "macys",
  "gamestop",
];
