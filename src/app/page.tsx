import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { getAllRetailers, getTrendingProducts } from "@/lib/products";

export default function Home() {
  const trending = getTrendingProducts(8);
  const retailerCount = getAllRetailers().length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Find the real price, everywhere.
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Compare {retailerCount} verified retailers, track price history, and check resale value on flippable
          items — before you buy.
        </p>
        <div className="mt-6">
          <SearchBar size="lg" />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Try “headphones”, “sneakers”, “TV”, or a UPC like 195866760415.
        </p>
      </section>

      <section className="mt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Biggest price drops right now</h2>
          <Link href="/search" className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
            Browse all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
