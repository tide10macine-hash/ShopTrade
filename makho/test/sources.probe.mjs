// Prüft alle Live-Datenquellen gegen das echte Internet (läuft in GitHub Actions).
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const S = require("../www/js/sources.js");

let fail = 0;
async function check(name, fn, ok) {
  try {
    const r = await fn();
    const good = ok(r);
    console.log((good ? "OK   " : "FAIL ") + name + " → " + JSON.stringify(r).slice(0, 260));
    if (!good) fail++;
  } catch (e) { fail++; console.log("FAIL " + name + " → " + e.message); }
}

await check("tagesschau ausland", () => S.news.list("ausland"), r => r.length >= 3 && r[0].title);
await check("tagesschau inland", () => S.news.list("inland"), r => r.length >= 3 && r[0].title);
await check("tagesschau suche", () => S.news.search("Russland"), r => r.length >= 1 && r[0].title);
await check("tagesschau details", async () => { const l = await S.news.list("ausland"); const it = l.find(x => x.details); return S.news.details(it); }, r => r.length >= 1);
await check("yahoo dax", () => S.markets.chart("^GDAXI"), r => r.price > 1000 && r.series.length > 5);
await check("yahoo bitcoin", () => S.markets.chart("BTC-USD"), r => r.price > 100);
await check("yahoo apple 3mo", () => S.markets.chart("AAPL", "3mo"), r => r.price > 1 && r.series.length > 30);
await check("yahoo suche", () => S.markets.search("Rheinmetall"), r => r && r.symbol);
await check("open-meteo geocode", () => S.weather.geocode("Hamburg"), r => r && Math.abs(r.lat - 53.5) < 1);
await check("open-meteo wetter", () => S.weather.forecast(52.52, 13.4), r => typeof r.current.temp === "number" && r.daily.length >= 5);
await check("wikipedia", () => S.wiki.lookup("Mount Everest"), r => r && /Everest/.test(r.title) && r.extract.length > 50);
await check("wikipedia frage", () => S.wiki.lookup("schwarzes Loch"), r => r && r.extract.length > 50);

console.log(fail ? `${fail} Quelle(n) fehlerhaft` : "Alle Quellen erreichbar");
process.exit(fail ? 1 : 0);
