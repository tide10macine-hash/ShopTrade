import type { Retailer } from "@/types";

/**
 * Applies the retailer's affiliate tracking params on top of a product URL.
 * Templates look like "{url}?cjevent=shoptrade" or plain "{url}" (no
 * affiliate network). Merges via URLSearchParams rather than string
 * concatenation so it stays correct even when `url` already has its own
 * query string (e.g. the demo's Google-search fallback links).
 */
export function buildAffiliateLink(retailer: Retailer, url: string): string {
  const [, paramsPart] = retailer.affiliateLinkTemplate.split("?");
  if (!paramsPart) return url;

  const target = new URL(url);
  const extraParams = new URLSearchParams(paramsPart);
  extraParams.forEach((value, key) => target.searchParams.set(key, value));
  return target.toString();
}
