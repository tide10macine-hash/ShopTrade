import Link from "next/link";
import { Repeat } from "lucide-react";
import type { Product } from "@/types";
import { getLowestOffer } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const lowest = getLowestOffer(product);
  const offerCount = product.offers.length;
  const belowMsrp = lowest.price < product.msrp;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:hover:border-emerald-600"
    >
      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-slate-50 text-4xl dark:bg-slate-900">
        {product.emoji}
      </div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{product.brand}</div>
      <h3 className="mb-1 line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
        {product.name}
      </h3>
      <div className="mt-auto flex items-center justify-between pt-2">
        <div>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">${lowest.price.toFixed(2)}</span>
          {belowMsrp && <span className="ml-1.5 text-xs text-slate-400 line-through">${product.msrp.toFixed(2)}</span>}
        </div>
        <span className="text-xs text-slate-400">{offerCount} stores</span>
      </div>
      {product.flippable && (
        <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
          <Repeat className="h-3 w-3" /> Resale data available
        </div>
      )}
    </Link>
  );
}
