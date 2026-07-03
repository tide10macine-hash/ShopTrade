import type { Retailer, TrustScore } from "@/types";

const BBB_POINTS: Record<string, number> = {
  "A+": 20,
  A: 17,
  "A-": 15,
  "B+": 12,
  B: 10,
  "B-": 8,
  "C+": 5,
  C: 3,
};

/**
 * Concrete, auditable "trusted/verified" scoring so the badge means something
 * beyond a claim: SSL, registered business, BBB rating, Trustpilot standing
 * (discounted if the sample size is thin), and manual review all factor in.
 */
export function computeTrustScore(retailer: Retailer): TrustScore {
  const { trust } = retailer;
  const reasons: string[] = [];
  let score = 0;

  if (trust.ssl) {
    score += 20;
    reasons.push("Serves storefront and checkout over SSL/TLS.");
  } else {
    reasons.push("Does not consistently serve pages over SSL/TLS.");
  }

  if (trust.businessRegistered) {
    score += 15;
    reasons.push("Registered business entity on file.");
  } else {
    reasons.push("No registered business entity on file.");
  }

  if (trust.bbbRating) {
    const bbbPoints = BBB_POINTS[trust.bbbRating] ?? 0;
    score += bbbPoints;
    reasons.push(`BBB rating: ${trust.bbbRating}.`);
  } else {
    reasons.push("No BBB rating available.");
  }

  if (trust.trustpilotScore != null) {
    const sampleConfidence = (trust.trustpilotReviewCount ?? 0) >= 500 ? 1 : 0.5;
    const points = (trust.trustpilotScore / 5) * 25 * sampleConfidence;
    score += points;
    reasons.push(
      `Trustpilot: ${trust.trustpilotScore.toFixed(1)}/5 across ${(trust.trustpilotReviewCount ?? 0).toLocaleString()} reviews.`
    );
  } else {
    reasons.push("No public Trustpilot profile.");
  }

  if (trust.manuallyReviewed) {
    score += 20;
    reasons.push("Manually reviewed by the ShopTrade curation process.");
  } else {
    reasons.push("Not yet manually reviewed — API-eligible only.");
  }

  score = Math.round(Math.min(100, score));

  const verified =
    score >= 70 && trust.ssl && trust.manuallyReviewed && (trust.bbbRating != null || trust.trustpilotScore != null);

  return { score, verified, reasons };
}
