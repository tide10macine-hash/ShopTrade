import { TrendingUp, TrendingDown, Info } from "lucide-react";
import type { Product } from "@/types";
import { computeResaleEstimate } from "@/lib/resale";
import { getLowestOffer } from "@/lib/products";

const SOURCE_LABEL: Record<string, string> = {
  "ebay-sold": "eBay sold listings",
  stockx: "StockX",
};

export default function ResalePanel({ product }: { product: Product }) {
  if (!product.flippable || !product.resaleComps?.length) return null;

  const lowestOffer = getLowestOffer(product);
  const estimate = computeResaleEstimate(product, lowestOffer.price);
  if (!estimate.bestComp || estimate.estimatedMargin == null) return null;

  const isProfitable = estimate.estimatedMargin > 0;

  return (
    <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Resale estimate</h2>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
          V2 module
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Buy for" value={`$${lowestOffer.price.toFixed(2)}`} />
        <Stat label="Recent comp" value={`$${estimate.bestComp.price.toFixed(2)}`} sub={SOURCE_LABEL[estimate.bestComp.source]} />
        <Stat label="Est. net after fees" value={estimate.netResaleValue != null ? `$${estimate.netResaleValue.toFixed(2)}` : "—"} />
        <Stat
          label="Est. margin"
          value={`${isProfitable ? "+" : ""}$${estimate.estimatedMargin.toFixed(2)}`}
          sub={estimate.estimatedMarginPct != null ? `${estimate.estimatedMarginPct}%` : undefined}
          icon={isProfitable ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          accent={isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}
        />
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Estimate assumes a {(estimate.marketplaceFeePct * 100).toFixed(1)}% marketplace fee, a{" "}
        {(estimate.paymentProcessingFeePct * 100).toFixed(1)}% payment processing fee, and ~${estimate.estimatedShipping.toFixed(2)} shipping,
        based on the {product.resaleComps.length} most recent comps.
      </p>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Informational only — this is not a buy signal or an auto-purchase tool. Bulk-buying to flip can violate
          retailer terms of service and get accounts banned from affiliate programs; ShopTrade only shows you
          where an item tends to resell.
        </p>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-0.5 flex items-center gap-1 text-lg font-semibold ${accent ?? "text-slate-900 dark:text-slate-100"}`}>
        {icon}
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
