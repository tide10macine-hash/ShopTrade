import { ShieldCheck, ShieldQuestion } from "lucide-react";
import type { Retailer } from "@/types";
import { computeTrustScore } from "@/lib/trust";

export default function TrustBadge({ retailer, showScore = false }: { retailer: Retailer; showScore?: boolean }) {
  const { score, verified, reasons } = computeTrustScore(retailer);

  return (
    <span
      title={reasons.join(" ")}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        verified
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      }`}
    >
      {verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldQuestion className="h-3.5 w-3.5" />}
      {verified ? "Verified" : "Unverified"}
      {showScore && <span className="opacity-70">· {score}/100</span>}
    </span>
  );
}
