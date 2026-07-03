"use client";

import { useState, type FormEvent } from "react";
import { Bell } from "lucide-react";

export default function AlertSignupForm({ productId, currentPrice }: { productId: string; currentPrice: number }) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(String(Math.round(currentPrice * 0.9 * 100) / 100));
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email, targetPrice: Number(targetPrice) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
        You&apos;re set — we&apos;ll email {email} if the price drops to ${Number(targetPrice).toFixed(2)} or below.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Bell className="h-4 w-4" /> Get a price-drop alert
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="text-slate-400">$</span>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="w-20 bg-transparent outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {status === "loading" ? "Saving…" : "Notify me"}
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs text-red-500">{errorMessage}</p>}
      <p className="mt-2 text-xs text-slate-400">
        MVP demo: alerts are logged server-side. V2 wires this into a real email provider and a background price
        checker.
      </p>
    </form>
  );
}
