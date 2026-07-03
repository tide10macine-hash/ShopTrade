import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PriceComparisonTable from "@/components/PriceComparisonTable";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import ResalePanel from "@/components/ResalePanel";
import AlertSignupForm from "@/components/AlertSignupForm";
import { getAllProducts, getAllRetailers, getLowestOffer, getProductById } from "@/lib/products";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return { title: "Product not found — ShopTrade" };
  return { title: `${product.name} — price comparison — ShopTrade` };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const retailers = getAllRetailers();
  const lowest = getLowestOffer(product);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-5xl dark:bg-slate-900">
          {product.emoji}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">{product.brand}</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{product.name}</h1>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            UPC {product.upc} · MSRP ${product.msrp.toFixed(2)} · Lowest price now{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">${lowest.price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Compare prices</h2>
        <PriceComparisonTable product={product} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Price history</h2>
        <PriceHistoryChart product={product} retailers={retailers} />
      </section>

      <section className="mt-8">
        <AlertSignupForm productId={product.id} currentPrice={lowest.price} />
      </section>

      {product.flippable && (
        <section className="mt-8">
          <ResalePanel product={product} />
        </section>
      )}
    </div>
  );
}
