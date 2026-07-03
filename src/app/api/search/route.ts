import { NextRequest, NextResponse } from "next/server";
import { getLowestOffer, searchProducts } from "@/lib/products";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = searchProducts(q).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    lowestPrice: getLowestOffer(p).price,
    offerCount: p.offers.length,
    flippable: p.flippable,
  }));

  return NextResponse.json({ query: q, count: results.length, results });
}
