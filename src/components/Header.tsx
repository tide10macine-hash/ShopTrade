import Link from "next/link";
import { Tags } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Tags className="h-4.5 w-4.5" />
          </span>
          ShopTrade
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/search" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Search
          </Link>
          <Link href="/retailers" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Retailer network
          </Link>
          <Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Roadmap
          </Link>
        </nav>
      </div>
    </header>
  );
}
