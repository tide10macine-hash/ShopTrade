import productsData from "@/data/products.json";
import retailersData from "@/data/retailers.json";
import type { Product, Retailer } from "@/types";
import { isSourceLive } from "@/lib/retailers/liveAdapters";

const products = productsData as Product[];
const retailers = retailersData as Retailer[];

const retailersById = new Map(retailers.map((r) => [r.id, r]));

export function getAllProducts(): Product[] {
  return products;
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Search by product name (fuzzy substring) or exact UPC match. */
export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const isUpc = /^\d{8,14}$/.test(q);
  if (isUpc) {
    return products.filter((p) => p.upc === q);
  }

  const terms = q.split(/\s+/);
  return products
    .map((p) => {
      const haystack = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
      const matches = terms.filter((t) => haystack.includes(t)).length;
      return { product: p, matches };
    })
    .filter((r) => r.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map((r) => r.product);
}

export function getTrendingProducts(limit = 6): Product[] {
  // Demo heuristic: biggest gap between current lowest offer and the
  // highest point in its trailing history, i.e. "best current deal."
  return [...products]
    .sort((a, b) => biggestDropPct(b) - biggestDropPct(a))
    .slice(0, limit);
}

function biggestDropPct(product: Product): number {
  let best = 0;
  for (const offer of product.offers) {
    const peak = Math.max(...offer.history.map((h) => h.price));
    if (peak <= 0) continue;
    const dropPct = (peak - offer.price) / peak;
    if (dropPct > best) best = dropPct;
  }
  return best;
}

export function getAllRetailers(): Retailer[] {
  return retailers;
}

export function getRetailerById(id: string): Retailer | undefined {
  return retailersById.get(id);
}

export function getLowestOffer(product: Product) {
  return [...product.offers].filter((o) => o.inStock).sort((a, b) => a.price - b.price)[0] ?? product.offers[0];
}

export { isSourceLive };
