import { ExternalLink, Search } from "lucide-react";
import { getAllRetailers } from "@/lib/products";
import { buildStoreSearchLink, QUICK_SEARCH_RETAILER_IDS } from "@/lib/storeLinks";

export default function MoreStoresSearch({ query }: { query: string }) {
  if (!query.trim()) return null;

  const retailersById = new Map(getAllRetailers().map((r) => [r.id, r]));
  const quickLinks = QUICK_SEARCH_RETAILER_IDS.map((id) => retailersById.get(id)).filter((r) => r != null);

  return (
    <section className="mt-10 rounded-xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Search className="h-4 w-4" />
        Not finding it? Search &ldquo;{query}&rdquo; directly on these stores
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        ShopTrade&apos;s demo catalog is curated, not exhaustive — these links go straight to each retailer&apos;s
        own live search, which always has everything they actually carry.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickLinks.map((retailer) => (
          <a
            key={retailer.id}
            href={buildStoreSearchLink(retailer, query)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: retailer.accentColor }} aria-hidden />
            {retailer.name}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        ))}
      </div>
    </section>
  );
}
