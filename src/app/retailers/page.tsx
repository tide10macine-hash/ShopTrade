import RetailerCard from "@/components/RetailerCard";
import { getAllRetailers } from "@/lib/products";

export const metadata = { title: "Retailer network — ShopTrade" };

export default function RetailersPage() {
  const retailers = [...getAllRetailers()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Retailer network</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Every retailer here was added deliberately, not scraped indiscriminately. &ldquo;Trusted&rdquo; is a
        computed score — SSL, registered business status, BBB rating, Trustpilot standing, and manual review —
        not just a badge. This starter set is {retailers.length} retailers; see the roadmap for how coverage grows.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {retailers.map((r) => (
          <RetailerCard key={r.id} retailer={r} />
        ))}
      </div>
    </div>
  );
}
