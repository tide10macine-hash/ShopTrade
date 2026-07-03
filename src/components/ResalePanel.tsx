import { TrendingUp, TrendingDown, Info } from "lucide-react";
import type { Product } from "@/types";
import { computeResaleChannels, computeResaleEstimate } from "@/lib/resale";
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
  const channels = computeResaleChannels(product, lowestOffer.price);
  const bestChannel = channels[0];

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

      {channels.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Where to sell it</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Same assumed asking price (${bestChannel.grossPrice.toFixed(2)}) across channels — the difference is
            each channel&apos;s take rate.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 font-medium">Fees</th>
                  <th className="px-3 py-2 font-medium text-right">You net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {channels.map((c, i) => (
                  <tr key={c.channel} className={i === 0 ? "bg-emerald-50/60 dark:bg-emerald-950/20" : undefined}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{c.label}</span>
                        {i === 0 && (
                          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                            Nets most
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">{c.note}</div>
                    </td>
                    <td className="px-3 py-2 align-top text-slate-500 dark:text-slate-400">
                      {(c.feePct * 100).toFixed(1)}%{c.flatFee > 0 ? ` + $${c.flatFee.toFixed(2)}` : ""}
                      {c.shippingCost > 0 && <> + ${c.shippingCost.toFixed(2)} ship</>}
                    </td>
                    <td className="px-3 py-2 align-top text-right font-semibold text-slate-900 dark:text-slate-100">
                      ${c.netProceeds.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
