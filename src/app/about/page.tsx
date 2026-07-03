export const metadata = { title: "Roadmap — ShopTrade" };

const PHASES = [
  {
    name: "MVP — live now",
    items: [
      "Search by product name or UPC",
      "Price comparison across a curated, trust-scored retailer set",
      "Weekly price history chart per retailer",
      "Price-drop alert signup (email delivery is stubbed)",
    ],
  },
  {
    name: "V2 — next",
    items: [
      "Resale/flip module: eBay sold-listing + StockX comps for flippable categories",
      "Estimated margin after marketplace + payment processing fees and shipping",
      "Real price-drop alerts via a background job + email provider",
      "Browser extension for on-page price comparison",
    ],
  },
  {
    name: "V3 — later",
    items: ["Personalized deal feed", "Community deal-sharing (Slickdeals-style)"],
  },
];

const SOURCES = [
  { name: "Amazon Product Advertising API", status: "Primary" },
  { name: "Walmart Affiliate API", status: "Primary" },
  { name: "eBay Browse API", status: "Primary" },
  { name: "Google Shopping Content API", status: "Primary" },
  { name: "Rakuten Advertising", status: "Primary" },
  { name: "CJ Affiliate", status: "Primary" },
  { name: "Skimlinks", status: "Primary" },
  { name: "Direct page scraping", status: "Last resort, public pages + robots.txt only" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Roadmap &amp; approach</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        BrickSeek meets CamelCamelCamel meets Honey, with a resale/flip layer on top. The hard part isn&apos;t the
        code — it&apos;s sourcing clean price data from every trusted store. Here&apos;s the plan.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Data sourcing strategy</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.name} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">{s.name}</span>
              <span className="text-xs text-slate-400">{s.status}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Official APIs and affiliate networks are legal and sustainable — it&apos;s how Honey, RetailMeNot, and
          Google Shopping actually get their data. Scraping is a greyer fallback for smaller stores with no API:
          public price pages only, respect robots.txt, expect rate limits.
        </p>
      </section>

      <section className="mt-8">
        {PHASES.map((phase) => (
          <div key={phase.name} className="mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{phase.name}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <h2 className="font-semibold">The resale line we won&apos;t cross</h2>
        <p className="mt-1">
          The resale module stays informational: &ldquo;here&apos;s where this tends to resell, and roughly what
          you&apos;d net after fees.&rdquo; It never places orders or automates bulk buying. Sneaker-bot-style
          automation risks bans from affiliate programs and retailer sites — not worth it for a feature that&apos;s
          valuable purely as information.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Monetization</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Affiliate commissions on outbound clicks — the proven model for every competitor in this space. A
          premium tier for advanced alerts and resale analytics is a natural add-on once the core loop has usage.
        </p>
      </section>
    </div>
  );
}
