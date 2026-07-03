"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export default function SearchBar({
  initialQuery = "",
  size = "md",
}: {
  initialQuery?: string;
  size?: "md" | "lg";
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const padding = size === "lg" ? "py-4 pl-12 pr-4 text-lg" : "py-2.5 pl-10 pr-3 text-sm";

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search
        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 ${
          size === "lg" ? "h-5 w-5" : "h-4 w-4"
        }`}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by product name or UPC…"
        className={`w-full rounded-full border border-slate-300 bg-white text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${padding}`}
      />
    </form>
  );
}
