#!/usr/bin/env node
/**
 * Generates src/data/products.json — deterministic demo data standing in for
 * the real ETL pipeline described in the README (Amazon PA-API, Walmart
 * Affiliate API, eBay Browse API, Google Shopping Content API, etc).
 *
 * Re-run with `npm run seed` any time the product catalog below changes.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "src", "data", "products.json");
const RETAILERS_FILE = path.join(__dirname, "..", "src", "data", "retailers.json");
const URL_OVERRIDES_FILE = path.join(__dirname, "..", "src", "data", "productUrlOverrides.json");

const RETAILERS = JSON.parse(readFileSync(RETAILERS_FILE, "utf-8"));
const DOMAIN_BY_RETAILER = Object.fromEntries(RETAILERS.map((r) => [r.id, r.domain]));
const BRAND_ONLY_BY_RETAILER = Object.fromEntries(RETAILERS.map((r) => [r.id, r.brandOnly ?? null]));
const SEARCH_URL_BY_RETAILER = Object.fromEntries(RETAILERS.map((r) => [r.id, r.searchUrlTemplate ?? null]));
const URL_OVERRIDES = JSON.parse(readFileSync(URL_OVERRIDES_FILE, "utf-8"));

// Direct brand storefronts (Nike, Adidas, Lululemon, ...) only ever carry
// their own brand — never assigned as an offer for a different brand's item.
function retailerCarriesBrand(retailerId, productBrand) {
  const brandOnly = BRAND_ONLY_BY_RETAILER[retailerId];
  return !brandOnly || brandOnly === productBrand;
}

// Real, manually verified product-page URL + price where we have one (see
// productUrlOverrides.json — sourced via web search, not a live pipeline, so
// both will drift stale over time). The price MUST come from the same
// lookup as the URL — generating them independently is how a shoe can show
// $120 on the compare page but $55 on the real linked page. Falls back to a
// generic on-site search link + synthetic MSRP-based price only when we
// have no verified pair for that offer.
function buildOffer(productId, retailerId, productName) {
  const override = URL_OVERRIDES[`${productId}:${retailerId}`];
  if (override) return { url: override.url, price: override.price, verified: true };

  const domain = DOMAIN_BY_RETAILER[retailerId] ?? `${retailerId}.com`;
  const template = SEARCH_URL_BY_RETAILER[retailerId] ?? `https://www.${domain}/search?q={q}`;
  const url = template.replace("{q}", encodeURIComponent(productName));
  return { url, price: null, verified: false };
}

// Mulberry32 seeded PRNG so the generated dataset is reproducible.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

const TODAY = new Date("2026-07-03T00:00:00Z");

function isoWeeksAgo(weeksAgo) {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(daysAgo) {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** 26 weekly points trending from a starting price toward the current price,
 *  with an occasional promotional dip. */
function generateHistory(seedKey, currentPrice) {
  const rand = mulberry32(hashSeed(seedKey));
  const weeks = 26;
  const startPrice = currentPrice * (1 + (rand() * 0.18 - 0.04)); // drift up to ~18% higher historically
  const points = [];
  for (let w = weeks; w >= 0; w--) {
    const progress = 1 - w / weeks;
    let price = startPrice + (currentPrice - startPrice) * progress;
    // Random noise
    price += (rand() - 0.5) * currentPrice * 0.03;
    // Occasional sale dip (e.g. holiday promo)
    if (rand() < 0.12) {
      price -= currentPrice * (0.08 + rand() * 0.1);
    }
    price = Math.max(currentPrice * 0.55, price);
    points.push({ date: isoWeeksAgo(w), price: Math.round(price * 100) / 100 });
  }
  // Ensure the most recent point matches the current listed price.
  points[points.length - 1] = { date: isoWeeksAgo(0), price: currentPrice };
  return points;
}

function generateResaleComps(seedKey, basePrice, premiumRange) {
  const rand = mulberry32(hashSeed(seedKey + "-resale"));
  const sources = ["ebay-sold", "stockx"];
  const count = 6 + Math.floor(rand() * 5);
  const comps = [];
  for (let i = 0; i < count; i++) {
    const [min, max] = premiumRange;
    const multiplier = min + rand() * (max - min);
    comps.push({
      source: sources[i % sources.length],
      price: Math.round(basePrice * multiplier * 100) / 100,
      date: isoDaysAgo(Math.floor(rand() * 30)),
      condition: rand() < 0.85 ? "new" : "used",
    });
  }
  return comps.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Each product lists the exact retailers that plausibly carry it — hand
// curated rather than sampled from a category pool, so a small kitchen
// appliance doesn't end up "in stock" at a pharmacy or a hardware store.
// The retailer's own store always comes first when the brand runs one.
const CATALOG = [
  { id: "sony-wh1000xm5", name: "Sony WH-1000XM5 Wireless Headphones", brand: "Sony", upc: "027242920595", category: "electronics", emoji: "🎧", msrp: 399.99, flippable: false, retailers: ["amazon", "walmart", "target", "bestbuy", "bhphoto", "newegg"] },
  { id: "airpods-pro-2", name: "Apple AirPods Pro (2nd Generation)", brand: "Apple", upc: "194253397795", category: "electronics", emoji: "🎧", msrp: 249.99, flippable: false, retailers: ["amazon", "walmart", "target", "bestbuy", "newegg", "bhphoto"] },
  { id: "ps5-slim", name: "PlayStation 5 Slim Console", brand: "Sony", upc: "711719577147", category: "gaming", emoji: "🎮", msrp: 499.99, flippable: true, retailers: ["amazon", "walmart", "target", "bestbuy", "gamestop", "newegg"] },
  { id: "switch-oled", name: "Nintendo Switch OLED Model", brand: "Nintendo", upc: "045496883775", category: "gaming", emoji: "🎮", msrp: 349.99, flippable: false, retailers: ["amazon", "walmart", "target", "bestbuy", "gamestop"] },
  { id: "xbox-series-x", name: "Xbox Series X Console", brand: "Microsoft", upc: "889842654431", category: "gaming", emoji: "🎮", msrp: 499.99, flippable: false, retailers: ["amazon", "walmart", "target", "bestbuy", "gamestop", "newegg"] },
  { id: "samsung-qled65", name: "Samsung 65\" Class QLED 4K Smart TV", brand: "Samsung", upc: "887276712345", category: "electronics", emoji: "📺", msrp: 1299.99, flippable: false, retailers: ["amazon", "walmart", "target", "bestbuy", "bhphoto", "costco"] },
  { id: "dyson-v15", name: "Dyson V15 Detect Cordless Vacuum", brand: "Dyson", upc: "885609015739", category: "home", emoji: "🧹", msrp: 749.99, flippable: false, retailers: ["amazon", "walmart", "target", "bestbuy", "costco"] },
  { id: "aj1-chicago", name: "Air Jordan 1 Retro High OG \"Chicago\"", brand: "Nike", upc: "195866760415", category: "sneakers", emoji: "👟", msrp: 180, flippable: true, retailers: ["nike", "footlocker", "finishline", "dickssportinggoods", "stockx", "goat", "ebay"] },
  { id: "yeezy-350-zebra", name: "Adidas Yeezy Boost 350 V2 \"Zebra\"", brand: "Adidas", upc: "789952110415", category: "sneakers", emoji: "👟", msrp: 230, flippable: true, retailers: ["adidas", "stockx", "goat", "ebay"] },
  { id: "dunk-low-panda", name: "Nike Dunk Low \"Panda\"", brand: "Nike", upc: "195866395415", category: "sneakers", emoji: "👟", msrp: 110, flippable: true, retailers: ["nike", "footlocker", "jdsports", "finishline", "stockx", "goat"] },
  { id: "pokemon-sv-booster-box", name: "Pokémon TCG Scarlet & Violet Booster Box", brand: "The Pokémon Company", upc: "820650851298", category: "collectibles", emoji: "🃏", msrp: 143.64, flippable: true, retailers: ["amazon", "walmart", "target", "gamestop", "barnesandnoble", "ebay"] },
  { id: "lego-millennium-falcon", name: "LEGO Star Wars Millennium Falcon 75192", brand: "LEGO", upc: "673419287960", category: "collectibles", emoji: "🧱", msrp: 849.99, flippable: true, retailers: ["legostore", "amazon", "walmart", "target", "ebay"] },
  { id: "stanley-quencher-40oz", name: "Stanley Quencher H2.0 FlowState 40oz Tumbler", brand: "Stanley", upc: "041604428561", category: "toys", emoji: "🥤", msrp: 45, flippable: true, retailers: ["amazon", "walmart", "target", "samsclub"] },
  { id: "instant-pot-duo", name: "Instant Pot Duo 7-in-1 6 Qt Multi-Cooker", brand: "Instant", upc: "845276028697", category: "home", emoji: "🍲", msrp: 99.95, flippable: false, retailers: ["amazon", "walmart", "target", "bestbuy", "costco"] },
  { id: "nike-tech-fleece-hoodie", name: "Nike Sportswear Tech Fleece Pullover Hoodie", brand: "Nike", upc: "195867432198", category: "apparel", emoji: "🧥", msrp: 130, flippable: false, retailers: ["nike", "amazon", "nordstrom", "dickssportinggoods", "footlocker"] },
  { id: "adidas-firebird-track-jacket", name: "Adidas Firebird Track Jacket", brand: "Adidas", upc: "789952874512", category: "apparel", emoji: "🧥", msrp: 90, flippable: false, retailers: ["adidas", "amazon", "macys", "nordstrom"] },
  { id: "patagonia-better-sweater", name: "Patagonia Better Sweater Fleece Jacket", brand: "Patagonia", upc: "700099887744", category: "apparel", emoji: "🧥", msrp: 179, flippable: false, retailers: ["patagonia", "rei", "nordstrom", "nordstromrack"] },
  { id: "levis-501-jeans", name: "Levi's 501 Original Fit Jeans", brand: "Levi's", upc: "052562433781", category: "apparel", emoji: "👖", msrp: 69.5, flippable: false, retailers: ["levis", "amazon", "target", "walmart", "macys", "kohls"] },
  // Lululemon deliberately doesn't wholesale — it's essentially only sold at
  // lululemon.com/stores, so third-party "carries this" offers would be
  // fiction. Off-price stores do occasionally get overstock, but that
  // inventory is unpredictable, not a stable specific-item listing.
  { id: "lululemon-align-leggings", name: "Lululemon Align High-Rise Leggings 25\"", brand: "Lululemon", upc: "627987451236", category: "apparel", emoji: "🩳", msrp: 98, flippable: false, retailers: ["lululemon", "ebay"] },
  { id: "the-north-face-nuptse", name: "The North Face 1996 Retro Nuptse Jacket", brand: "The North Face", upc: "196011234567", category: "apparel", emoji: "🧥", msrp: 320, flippable: true, retailers: ["thenorthface", "nordstrom", "rei", "dickssportinggoods"] },
];

const products = CATALOG.map((item) => {
  const retailerIds = item.retailers.filter((id) => retailerCarriesBrand(id, item.brand));

  const rand = mulberry32(hashSeed(item.id));

  const offers = retailerIds.map((retailerId) => {
    const { url, price: realPrice } = buildOffer(item.id, retailerId, item.name);
    let price;
    if (realPrice != null) {
      price = realPrice;
    } else {
      const variance = 1 + (rand() * 0.16 - 0.06); // -6% to +10% off MSRP
      price = Math.round(item.msrp * variance * 100) / 100;
    }
    return {
      retailerId,
      price,
      currency: "USD",
      inStock: rand() > 0.08,
      url,
      lastChecked: TODAY.toISOString(),
      history: generateHistory(`${item.id}-${retailerId}`, price),
    };
  });

  const productFields = { ...item };
  delete productFields.retailers;
  const result = { ...productFields, offers };

  if (item.flippable) {
    const premiumRange =
      item.category === "sneakers" ? [0.9, 2.4] : item.category === "collectibles" ? [1.1, 2.0] : [0.85, 1.6];
    result.resaleComps = generateResaleComps(item.id, item.msrp, premiumRange);
  }

  return result;
});

writeFileSync(OUT_FILE, JSON.stringify(products, null, 2) + "\n");
console.log(`Wrote ${products.length} products to ${path.relative(process.cwd(), OUT_FILE)}`);
