import { ExternalLink, PackageX } from "lucide-react";
import type { Product } from "@/types";
import { getRetailerById } from "@/lib/products";
import { buildAffiliateLink } from "@/lib/affiliate";
import TrustBadge from "./TrustBadge";

export default function PriceComparisonTable({ product }: { product: Product }) {
  const rows = [...product.offers].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return a.price - b.price;
  });
  const lowestInStockPrice = Math.min(...rows.filter((r) => r.inStock).map((r) => r.price));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Retailer</th>
            <th className="px-4 py-3 font-medium">Trust</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Availability</th>
            <th className="px-4 py-3 font-medium text-right">Buy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((offer) => {
            const retailer = getRetailerById(offer.retailerId);
            if (!retailer) return null;
            const isBest = offer.inStock && offer.price === lowestInStockPrice;
            return (
              <tr key={offer.retailerId} className={isBest ? "bg-emerald-50/60 dark:bg-emerald-950/20" : undefined}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: retailer.accentColor }}
                      aria-hidden
                    />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{retailer.name}</span>
                    {isBest && (
                      <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Best price
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TrustBadge retailer={retailer} />
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  ${offer.price.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  {offer.inStock ? (
                    <span className="text-emerald-700 dark:text-emerald-400">In stock</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <PackageX className="h-3.5 w-3.5" /> Out of stock
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={buildAffiliateLink(retailer, offer.url)}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    aria-disabled={!offer.inStock}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      offer.inStock
                        ? "bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        : "pointer-events-none bg-slate-200 text-slate-400 dark:bg-slate-800"
                    }`}
                  >
                    View deal <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
