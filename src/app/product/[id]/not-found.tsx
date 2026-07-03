import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Product not found</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        It&apos;s not in the curated demo catalog yet.
      </p>
      <Link href="/search" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
        Back to search
      </Link>
    </div>
  );
}
