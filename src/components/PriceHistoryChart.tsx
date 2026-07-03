"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import type { Product, Retailer } from "@/types";

// Fixed-order categorical slots (CVD-validated) — assigned by position, never
// by rank, so a line's color stays stable as offers are added/removed.
const CHART_SERIES_COLORS = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
  "var(--chart-series-6)",
  "var(--chart-series-7)",
  "var(--chart-series-8)",
];

export default function PriceHistoryChart({
  product,
  retailers,
}: {
  product: Product;
  retailers: Retailer[];
}) {
  const retailerById = new Map(retailers.map((r) => [r.id, r]));

  // Merge each retailer's weekly history into one row-per-date dataset.
  const dateSet = new Set<string>();
  product.offers.forEach((o) => o.history.forEach((h) => dateSet.add(h.date)));
  const dates = [...dateSet].sort();

  const data = dates.map((date) => {
    const row: Record<string, string | number> = { date: formatDate(date) };
    for (const offer of product.offers) {
      const point = offer.history.find((h) => h.date === date);
      if (point) row[offer.retailerId] = point.price;
    }
    return row;
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} minTickGap={24} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
            width={56}
            tickFormatter={(v: number) => `$${v}`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(value, name) => [`$${Number(value).toFixed(2)}`, retailerById.get(String(name))?.name ?? String(name)]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value: string) => retailerById.get(value)?.name ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {product.offers.map((offer, index) => (
            <Line
              key={offer.retailerId}
              type="monotone"
              dataKey={offer.retailerId}
              stroke={CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
