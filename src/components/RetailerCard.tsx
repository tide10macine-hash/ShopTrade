import { Wifi, WifiOff } from "lucide-react";
import type { Retailer } from "@/types";
import { computeTrustScore } from "@/lib/trust";
import { isSourceLive } from "@/lib/retailers/liveAdapters";

const SOURCE_LABEL: Record<string, string> = {
  "amazon-paapi": "Amazon PA-API",
  "walmart-affiliate": "Walmart Affiliate API",
  "ebay-browse": "eBay Browse API",
  "google-shopping-content": "Google Shopping Content API",
  "rakuten-advertising": "Rakuten Advertising",
  "cj-affiliate": "CJ Affiliate",
  skimlinks: "Skimlinks",
  "manual-verified": "Manually verified",
};

export default function RetailerCard({ retailer }: { retailer: Retailer }) {
  const { score, verified, reasons } = computeTrustScore(retailer);
  const live = isSourceLive(retailer.apiSource);

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: retailer.accentColor }} aria-hidden />
          <span className="font-semibold text-slate-900 dark:text-slate-100">{retailer.name}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            live ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
          }`}
          title={live ? "Live via configured API credentials" : "Demo data — set env vars to go live"}
        >
          {live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {live ? "Live" : "Demo data"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <dt>Data source</dt>
        <dd className="text-right text-slate-700 dark:text-slate-300">{SOURCE_LABEL[retailer.apiSource]}</dd>
        <dt>Affiliate network</dt>
        <dd className="text-right text-slate-700 dark:text-slate-300">{retailer.affiliateNetwork}</dd>
        <dt>BBB rating</dt>
        <dd className="text-right text-slate-700 dark:text-slate-300">{retailer.trust.bbbRating ?? "—"}</dd>
        <dt>Trustpilot</dt>
        <dd className="text-right text-slate-700 dark:text-slate-300">
          {retailer.trust.trustpilotScore ? `${retailer.trust.trustpilotScore.toFixed(1)}/5` : "—"}
        </dd>
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span
          className={`text-xs font-semibold ${
            verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {verified ? "Verified" : "Unverified"} · {score}/100
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-slate-400">{reasons.join(" ")}</p>
    </div>
  );
}
