import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import type { PriceAlertRequest } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory store for the MVP demo. V2 replaces this with a real table plus
// a background job that polls live prices and triggers email sends.
const alerts: (PriceAlertRequest & { createdAt: string })[] = [];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Partial<PriceAlertRequest> | null;

  if (!body || typeof body.productId !== "string" || typeof body.email !== "string" || typeof body.targetPrice !== "number") {
    return NextResponse.json({ error: "productId, email, and targetPrice are required." }, { status: 400 });
  }

  if (!EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!Number.isFinite(body.targetPrice) || body.targetPrice <= 0) {
    return NextResponse.json({ error: "Target price must be a positive number." }, { status: 400 });
  }

  const product = getProductById(body.productId);
  if (!product) {
    return NextResponse.json({ error: "Unknown product." }, { status: 404 });
  }

  const alert = { productId: body.productId, email: body.email, targetPrice: body.targetPrice, createdAt: new Date().toISOString() };
  alerts.push(alert);
  console.log(`[alerts] ${alert.email} wants ${product.name} <= $${alert.targetPrice}`);

  return NextResponse.json({ ok: true, alert }, { status: 201 });
}
