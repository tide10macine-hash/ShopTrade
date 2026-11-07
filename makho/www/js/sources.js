/* Makho – Datenquellen ohne API-Schlüssel: tagesschau, Yahoo Finance, Open-Meteo, Wikipedia. */
(function (root) {
  "use strict";

  async function getJSON(url, ms = 9000, headers = {}) {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl ? ctl.signal : undefined, headers: Object.assign({ Accept: "application/json" }, headers) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  const strip = html => String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

  /* ---------- tagesschau ---------- */
  const TS = "https://www.tagesschau.de/api2u/";
  const mapNews = arr => (arr || [])
    .filter(n => n && n.title && n.type !== "video" && !/^(liveblog|livestream)/i.test(n.topline || ""))
    .map(n => ({ title: strip(n.title), topline: strip(n.topline), first: strip(n.firstSentence), date: n.date || null, url: n.shareURL || n.detailsweb || "", details: n.details || null }));
  const news = {
    async list(ressort) { const j = await getJSON(TS + "news/?ressort=" + encodeURIComponent(ressort)); return mapNews(j.news); },
    async home() { const j = await getJSON(TS + "homepage/"); return mapNews(j.news); },
    async search(q) { const j = await getJSON(TS + "search/?searchText=" + encodeURIComponent(q) + "&pageSize=15&resultPage=0"); return mapNews(j.searchResults); },
    async details(item) {
      if (!item || !item.details) return [];
      const j = await getJSON(item.details);
      return (j.content || []).filter(c => c.type === "text" && c.value).map(c => strip(c.value)).filter(p => p.length > 40 && !/^(stand:|mehr zum thema|hinweis)/i.test(p));
    }
  };

  /* ---------- Yahoo Finance ---------- */
  const cleanName = n => {
    let s = String(n || "").replace(/\s{2,}.*$/, "").replace(/\s+(AG|SE|Inc\.?|Corp\.?|Corporation|plc|N\.V\.|S\.A\.|Holdings?|Group|& Co\.? KGaA|KGaA)\b.*$/i, "").trim();
    if (s === s.toUpperCase() && s.length > 4) s = s.toLowerCase().replace(/(^|[\s\-])\S/g, c => c.toUpperCase());
    return s || String(n || "");
  };
  const YF = "https://query1.finance.yahoo.com/";
  const markets = {
    async chart(symbol, range = "1mo", interval = "1d") {
      const j = await getJSON(YF + "v8/finance/chart/" + encodeURIComponent(symbol) + "?range=" + range + "&interval=" + interval);
      const x = j.chart.result[0];
      const closes = (x.indicators.quote[0].close || []).filter(v => v != null);
      const price = x.meta.regularMarketPrice != null ? x.meta.regularMarketPrice : closes[closes.length - 1];
      let prev = x.meta.previousClose != null ? x.meta.previousClose : null;
      const same = (a, b) => Math.abs(a - b) <= Math.abs(b) * 1e-4;
      if (prev == null && closes.length > 1) prev = same(closes[closes.length - 1], price) ? closes[closes.length - 2] : closes[closes.length - 1];
      const series = closes.slice(); if (series.length && !same(series[series.length - 1], price)) series.push(price);
      return { symbol, price, prev, change: prev ? (price / prev - 1) * 100 : null, series, currency: x.meta.currency || "", name: x.meta.longName || x.meta.shortName || symbol, high: x.meta.regularMarketDayHigh, low: x.meta.regularMarketDayLow, time: x.meta.regularMarketTime ? x.meta.regularMarketTime * 1000 : null };
    },
    async search(q) {
      const j = await getJSON(YF + "v1/finance/search?q=" + encodeURIComponent(q) + "&quotesCount=5&newsCount=0&lang=de-DE&region=DE");
      const hit = (j.quotes || []).find(x => x.symbol && /EQUITY|ETF|INDEX|CRYPTOCURRENCY|FUTURE|CURRENCY/.test(x.quoteType || ""));
      return hit ? { symbol: hit.symbol, name: cleanName(hit.longname || hit.shortname || hit.symbol) } : null;
    }
  };

  /* ---------- Open-Meteo ---------- */
  const WMO = {
    0: ["klar", "sun"], 1: ["überwiegend klar", "sun"], 2: ["teilweise bewölkt", "partly"], 3: ["bedeckt", "cloud"], 45: ["neblig", "fog"], 48: ["neblig mit Reif", "fog"],
    51: ["leichter Nieselregen", "rain"], 53: ["Nieselregen", "rain"], 55: ["starker Nieselregen", "rain"], 56: ["gefrierender Niesel", "sleet"], 57: ["gefrierender Niesel", "sleet"],
    61: ["leichter Regen", "rain"], 63: ["Regen", "rain"], 65: ["starker Regen", "rain"], 66: ["gefrierender Regen", "sleet"], 67: ["gefrierender Regen", "sleet"],
    71: ["leichter Schneefall", "snow"], 73: ["Schneefall", "snow"], 75: ["starker Schneefall", "snow"], 77: ["Schneegriesel", "snow"],
    80: ["Regenschauer", "rain"], 81: ["kräftige Regenschauer", "rain"], 82: ["heftige Regenschauer", "rain"], 85: ["Schneeschauer", "snow"], 86: ["starke Schneeschauer", "snow"],
    95: ["Gewitter", "storm"], 96: ["Gewitter mit Hagel", "storm"], 99: ["schweres Gewitter mit Hagel", "storm"]
  };
  const weather = {
    WMO,
    describe(code) { return WMO[code] || ["wechselhaft", "cloud"]; },
    async geocode(name) {
      const j = await getJSON("https://geocoding-api.open-meteo.com/v1/search?count=1&language=de&format=json&name=" + encodeURIComponent(name));
      const r = (j.results || [])[0];
      return r ? { name: r.name, lat: r.latitude, lon: r.longitude, country: r.country || "", admin: r.admin1 || "" } : null;
    },
    async forecast(lat, lon) {
      const j = await getJSON("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
        "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7");
      const c = j.current || {}, d = j.daily || {};
      return {
        current: { temp: c.temperature_2m, feels: c.apparent_temperature, code: c.weather_code, wind: c.wind_speed_10m, humidity: c.relative_humidity_2m, day: c.is_day !== 0 },
        daily: (d.time || []).map((t, i) => ({ date: t, code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], rain: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null, sunrise: d.sunrise ? d.sunrise[i] : null, sunset: d.sunset ? d.sunset[i] : null }))
      };
    }
  };

  /* ---------- Wikipedia ---------- */
  const WP = "https://de.wikipedia.org/";
  const UA = { "Api-User-Agent": "Makho/3.0 (Sprachassistent; https://github.com/tide10macine-hash/ShopTrade)", "User-Agent": "Makho/3.0 (Sprachassistent; https://github.com/tide10macine-hash/ShopTrade)" };
  async function wpJSON(url) {
    try { return await getJSON(url, 9000, UA); }
    catch (e) { if (/HTTP 429/.test(e.message)) { await new Promise(r => setTimeout(r, 1200)); return getJSON(url, 9000, UA); } throw e; }
  }
  const wiki = {
    async lookup(query) {
      const s = await wpJSON(WP + "w/api.php?action=query&list=search&srlimit=3&format=json&origin=*&srsearch=" + encodeURIComponent(query));
      const hits = (s.query && s.query.search) || [];
      if (!hits.length) return null;
      const title = hits[0].title;
      const p = await wpJSON(WP + "api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_")));
      if (!p || !p.extract) return null;
      return { title: p.title || title, description: p.description || "", extract: p.extract, image: (p.thumbnail && p.thumbnail.source) || null, url: (p.content_urls && p.content_urls.mobile && p.content_urls.mobile.page) || "" };
    }
  };

  /* ---------- Wechselkurse (EZB-Referenzkurse über Frankfurter) ---------- */
  const fx = {
    async convert(amount, from, to) {
      if (from === to) return { amount, from, to, result: amount, rate: 1, date: null };
      const j = await getJSON("https://api.frankfurter.app/latest?amount=" + encodeURIComponent(amount) + "&from=" + from + "&to=" + to);
      const result = j.rates && j.rates[to];
      if (result == null) throw new Error("Kein Kurs");
      return { amount, from, to, result, rate: result / amount, date: j.date || null };
    }
  };

  /* ---------- Übersetzen (MyMemory) ---------- */
  const translate = {
    async text(q, target, source = "de") {
      const j = await getJSON("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(q) + "&langpair=" + source + "|" + target);
      const t = j.responseData && j.responseData.translatedText;
      if (!t || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) throw new Error("Keine Übersetzung");
      return strip(t);
    }
  };

  const api = { getJSON, strip, news, markets, weather, wiki, cleanName, fx, translate };
  root.MakhoSources = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
