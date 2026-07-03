import type { Retailer } from "@/types";

export function buildAffiliateLink(retailer: Retailer, url: string): string {
  return retailer.affiliateLinkTemplate.replace("{url}", url);
}
