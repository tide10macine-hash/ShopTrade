import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import MoreStoresSearch from "@/components/MoreStoresSearch";
import { getAllProducts, searchProducts } from "@/lib/products";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q ? searchProducts(q) : getAllProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SearchBar initialQuery={q} />

      <div className="mt-6 mb-4 text-sm text-slate-500 dark:text-slate-400">
        {q ? (
          <>
            {results.length} result{results.length === 1 ? "" : "s"} for <strong className="text-slate-700 dark:text-slate-200">&ldquo;{q}&rdquo;</strong>
          </>
        ) : (
          <>Showing all {results.length} products in the demo catalog</>
        )}
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No matches in the curated demo catalog. The MVP starts with a curated retailer/product set on purpose —
          see the roadmap for how coverage expands.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <MoreStoresSearch query={q} />
    </div>
  );
}
