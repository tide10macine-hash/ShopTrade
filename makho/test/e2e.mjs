// Simuliertes Sprachgespräch im Browser: prüft Ablauf, Layout und Fehler auf mehreren Handygrößen.
// Aufruf: node test/e2e.mjs [ausgabeordner]
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../www");
const OUT = process.argv[2] || "/tmp/makho-e2e";
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]) === "/" ? "index.html" : decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  const type = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".woff2": "font/woff2" }[path.extname(p)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/index.html`;

/* ---------- Attrappen der Datenquellen (gleiche Struktur wie die echten APIs) ---------- */
const story = (title, topline, first) => ({ type: "story", title, topline, firstSentence: first, date: "2026-11-07T14:10:00+01:00", shareURL: "https://www.tagesschau.de/x", details: "https://www.tagesschau.de/api2u/ausland/x.json" });
const NEWS = { news: [
  story("Waffenruhe in der Ukraine hält vorerst", "Krieg gegen die Ukraine", "Beide Seiten melden weniger Angriffe."),
  story("Iran und USA verhandeln in Katar", "Nahost", "Die Gespräche sollen nächste Woche weitergehen."),
  story("China kündigt Konjunkturprogramm an", "Wirtschaft", "Peking will die Binnennachfrage stärken."),
  story("Frankreich streitet über Haushalt", "Paris", "Die Regierung steht unter Druck."),
  story("Neue Klimadaten aus der Arktis", "Klima", "Das Eis schmilzt schneller als erwartet."),
  story("Wahl in Japan: Regierungspartei vorn", "Japan", "Die Wahlbeteiligung war niedrig.")
] };
const quote = (price, prev, cur) => ({ chart: { result: [{ meta: { regularMarketPrice: price, previousClose: prev, currency: cur, regularMarketDayHigh: price * 1.01, regularMarketDayLow: price * 0.99, longName: "Test AG" }, indicators: { quote: [{ close: Array.from({ length: 60 }, (_, i) => prev * (0.93 + 0.07 * Math.sin(i / 6) + i * 0.002)) }] } }] } });
const PRICES = { "^GDAXI": [24120, 23950, "EUR"], "^GSPC": [7410, 7376, "USD"], "^IXIC": [24800, 24579, "USD"], "^DJI": [51100, 51286, "USD"], "BZ=F": [94.2, 97.1, "USD"], "GC=F": [4102, 4060, "USD"], "BTC-USD": [78123, 75900, "USD"], "EURUSD=X": [1.1432, 1.1401, "USD"], "AAPL": [251.3, 248.1, "USD"] };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
function fixture(url) {
  const u = new URL(url);
  if (u.host === "www.tagesschau.de") {
    if (u.pathname.includes("/search/")) return { searchResults: NEWS.news.slice(1, 5).map(n => ({ ...n, title: n.title + " (" + u.searchParams.get("searchText") + ")" })) };
    if (u.pathname.endsWith(".json")) return { content: [{ type: "text", value: "<p>Die Waffenruhe gilt seit drei Tagen. Beobachter melden deutlich weniger Angriffe entlang der Front, vor allem im Süden des Landes.</p>" }, { type: "text", value: "<p>Diplomaten sprechen von einem vorsichtigen Fortschritt, warnen aber vor zu großen Erwartungen an die kommenden Gespräche.</p>" }] };
    return NEWS;
  }
  if (u.host === "query1.finance.yahoo.com" && u.pathname.includes("/chart/")) { const s = decodeURIComponent(u.pathname.split("/chart/")[1]); const p = PRICES[s] || [100, 98, "EUR"]; return quote(p[0], p[1], p[2]); }
  if (u.host === "query1.finance.yahoo.com" && u.pathname.includes("/search")) return { quotes: [{ symbol: "RHM.DE", shortname: "Rheinmetall AG", quoteType: "EQUITY" }] };
  if (u.host === "geocoding-api.open-meteo.com") return { results: [{ name: u.searchParams.get("name").replace(/\b\w/g, c => c.toUpperCase()), latitude: 53.55, longitude: 10, country: "Deutschland", admin1: "Hamburg" }] };
  if (u.host === "api.open-meteo.com") { const days = ["2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"]; return { current: { temperature_2m: 8.4, apparent_temperature: 5.9, weather_code: 61, wind_speed_10m: 18, relative_humidity_2m: 84, is_day: 1 }, daily: { time: days, weather_code: [61, 3, 2, 0, 80, 71, 95], temperature_2m_max: [10, 9, 11, 12, 8, 3, 13], temperature_2m_min: [5, 4, 3, 6, 2, -1, 7], precipitation_probability_max: [80, 30, 10, 0, 60, 70, 90] } }; }
  if (u.host === "de.wikipedia.org" && u.pathname.includes("api.php")) return { query: { search: [{ title: "Mount Everest" }] } };
  if (u.host === "de.wikipedia.org") return { title: "Mount Everest", description: "Berg im Himalaya", extract: "Der Mount Everest ist ein Berg im Himalaya und mit einer Höhe von 8848 Metern der höchste Berg der Erde. Er gehört zu den Seven Summits. Die Erstbesteigung gelang 1953.", thumbnail: { source: "https://upload.wikimedia.org/x.png" } };
  return null;
}

/* ---------- Gesprächsablauf ---------- */
const SCRIPT = [
  ["Wie spät ist es", s => s.state === "sleep", "ignoriert im Ruhezustand"],
  ["Hallo Macho", s => s.state === "awake" && /online/i.test(s.said) && /Nachrichten/.test(s.offer), "aufwachen + Angebot"],
  ["Ja bitte", s => s.view === "v-news" && /Erstens/.test(s.said), "Weltnachrichten nach Ja"],
  ["nein danke", s => /Börse/.test(s.offer), "Deutschland abgelehnt, nächstes Angebot"],
  ["ja", s => s.view === "v-mkt" && s.cards >= 6, "Börse"],
  ["Wie steht Apple", s => s.view === "v-asset", "einzelne Aktie"],
  ["Wie steht die Rheinmetall Aktie", s => s.view === "v-asset" && /Rheinmetall/.test(s.said), "Aktie über Suche"],
  ["Wie wird das Wetter", s => /Für welche Stadt/.test(s.say), "fragt nach Stadt"],
  ["Hamburg", s => s.view === "v-weather" && /Hamburg/.test(s.said), "Wetter Hamburg"],
  ["Brauche ich morgen einen Regenschirm", s => s.view === "v-weather" && /Schirm|Eher nicht|Vielleicht/.test(s.said), "Schirmfrage"],
  ["Geh mal nach Russland", s => s.view === "v-news" && /Russland/.test(s.title), "Land"],
  ["Mehr zur zweiten Meldung", s => s.view === "v-article", "Details"],
  ["Wie hoch ist der Mount Everest", s => s.view === "v-wiki" && /8848/.test(s.said), "Wissen"],
  ["Was ist 15 Prozent von 80", s => s.view === "v-info" && /12/.test(s.said), "Rechnen"],
  ["Stell einen Timer auf 2 Sekunden", s => s.view === "v-timer" && s.tchip, "Timer"],
  ["__wait 2500", s => s.alarm && /abgelaufen/.test(s.said), "Timer klingelt"],
  ["Stopp", s => !s.alarm, "Alarm per Stopp aus"],
  ["Merke dir dass ich Milch kaufen muss", s => s.view === "v-notes" && /Du musst Milch kaufen/.test(s.said), "Notiz"],
  ["Setze den Umsatz auf 60000", s => s.view === "v-kpi" && /Umsatz/.test(s.said), "Zahl setzen"],
  ["Gib mir die Zahlen der Woche", s => s.view === "v-kpi", "Zahlen"],
  ["Was kannst du", s => s.view === "v-help", "Hilfe"],
  ["Erzähl einen Witz", s => s.said.length > 10, "Witz"],
  ["Gib mir ein Briefing", s => s.view === "v-news" && /Top-Meldungen/.test(s.said), "Briefing"],
  ["blablub wurst", s => /verstanden|mitbekommen|passen/.test(s.said), "Unbekanntes"],
  ["Gute Nacht", s => s.state === "sleep", "einschlafen"]
];

const SIZES = [["Galaxy-S24", 360, 780], ["Galaxy-A54", 412, 915], ["klein", 360, 640]];
let fails = 0;
const browser = await chromium.launch();
for (const [name, w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.__MAKHO_MOCK = true; window.__MAKHO_MOCK_WORD_MS = 4; window.__said = []; });
  await page.route(/^https:\/\/(www\.tagesschau\.de|query1\.finance\.yahoo\.com|geocoding-api\.open-meteo\.com|api\.open-meteo\.com|de\.wikipedia\.org|upload\.wikimedia\.org)\//, route => {
    const url = route.request().url();
    if (url.includes("upload.wikimedia.org")) return route.fulfill({ status: 200, contentType: "image/png", body: PNG });
    const f = fixture(url); return f ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(f) }) : route.fulfill({ status: 404, body: "" });
  });
  await page.goto(BASE);
  await page.evaluate(() => { const v = window.MakhoVoice; const orig = v.say.bind(v); v.say = t => { window.__said.push(t); return orig(t); }; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}-00-ruhe.png` });
  let step = 0;
  for (const [utter, check, label] of SCRIPT) {
    step++;
    await page.evaluate(() => { window.__said = []; });
    if (utter.startsWith("__wait")) await page.waitForTimeout(+utter.split(" ")[1]);
    else await page.evaluate(t => window.MakhoVoice.mock.hear(t), utter);
    // warten, bis Makho fertig gesprochen hat
    if (utter !== "Stopp") await page.waitForFunction(() => !window.MakhoVoice.speaking && window.__said.length > 0, null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(utter === "Hallo Macho" ? 2600 : 900);
    const s = await page.evaluate(() => {
      const v = document.querySelector("#stage .view:not(.leave)");
      return {
        state: document.body.dataset.state, say: document.querySelector("#say").textContent, said: window.__said.join(" | "),
        offer: document.querySelector("#offer.show .q") ? document.querySelector("#offer .q").textContent : "",
        view: v ? [...v.classList].find(c => c.startsWith("v-")) : "", title: v ? (v.querySelector("h2") || {}).textContent || "" : "",
        cards: document.querySelectorAll("#stage .q").length, tchip: !document.querySelector("#tchip").hidden, alarm: document.body.classList.contains("alarm")
      };
    });
    const ok = check(s);
    if (!ok) { fails++; console.log(`FAIL [${name}] ${step}. „${utter}“ (${label}) →`, JSON.stringify(s).slice(0, 400)); }
    // Layoutprüfung: nichts darf horizontal überlaufen
    const overflow = await page.evaluate(() => {
      const bad = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) bad.push("Seite breiter als Bildschirm");
      document.querySelectorAll("#app *").forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest(".ticker") && !e.closest(".leave") && getComputedStyle(e).position !== "absolute") bad.push((e.id || e.className || e.tagName) + " " + Math.round(r.left) + "–" + Math.round(r.right)); });
      return [...new Set(bad)].slice(0, 5);
    });
    if (overflow.length) { fails++; console.log(`FAIL [${name}] Überlauf nach „${utter}“:`, overflow.join(", ")); }
    if (["Ja bitte", "ja", "Wie steht Apple", "Hamburg", "Geh mal nach Russland", "Mehr zur zweiten Meldung", "Wie hoch ist der Mount Everest", "Was ist 15 Prozent von 80", "Stell einen Timer auf 2 Sekunden", "__wait 2500", "Gib mir die Zahlen der Woche", "Was kannst du", "Hallo Macho"].includes(utter)) {
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${name}-${String(step).padStart(2, "0")}.png` });
    }
  }
  // Stopp muss laufende Sprache sofort beenden
  await page.evaluate(() => window.MakhoVoice.mock.hear("Hallo Makho"));
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__MAKHO_MOCK_WORD_MS = 120; window.Makho.handle({ intent: "joke" }); });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.MakhoVoice.speaking);
  await page.evaluate(() => window.MakhoVoice.mock.hear("stopp", "partial"));
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => window.MakhoVoice.speaking);
  if (!before || after) { fails++; console.log(`FAIL [${name}] Stopp: sprach vorher=${before}, nachher=${after}`); }
  if (errors.length) { fails++; console.log(`FAIL [${name}] Fehler im Browser:`, errors.slice(0, 5)); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `${fails} Fehler` : "Alle Prüfungen bestanden");
process.exit(fails ? 1 : 0);
