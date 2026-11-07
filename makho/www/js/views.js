/* Makho – Ansichten auf der Bühne. Jede Ansicht baut sich gestaffelt auf. */
(function (root) {
  "use strict";
  const FX = root.MakhoFX;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const nf = (v, d = 0) => Number(v).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  const el = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const rise = (i, inner, cls = "") => `<div class="rise ${cls}" style="--i:${i}">${inner}</div>`;
  const head = (title, label) => rise(0, `<div class="vhead"><h2>${esc(title)}</h2>${label ? `<span class="label">${esc(label)}</span>` : ""}</div>`);

  function spark(series, up, id) {
    if (!series || series.length < 2) return "";
    const W = 300, H = 70, mn = Math.min(...series), mx = Math.max(...series), k = (H - 8) / ((mx - mn) || 1);
    const pts = series.map((v, i) => [i / (series.length - 1) * W, H - 4 - (v - mn) * k]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
    const col = up ? "var(--good)" : "var(--bad)", last = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="g${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      <path class="area" d="${d} L${W} ${H} L0 ${H}Z" fill="url(#g${id})"/>
      <path class="line" d="${d}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke" pathLength="1"/>
      <circle class="end" cx="${last[0]}" cy="${last[1]}" r="3.2" fill="${col}"/></svg>`;
  }
  const chg = c => c == null ? `<span class="chg">–</span>` : `<span class="chg ${c >= 0 ? "up" : "down"}">${c >= 0 ? "▲ +" : "▼ −"}${nf(Math.abs(c), 2)} %</span>`;
  const priceFmt = (v, cur) => (v >= 1000 ? nf(v, 0) : v >= 10 ? nf(v, 2) : nf(v, 4)) + (cur === "USD" ? " $" : cur === "EUR" ? " €" : "");

  const V = {
    news({ title, label, items, focus, marks }) {
      const node = el(`<div class="view v-news">${head(title, label)}
        ${rise(1, `<div class="globebox"><canvas class="globe"></canvas></div>`)}
        <ol class="news">${items.map((n, i) => `<li class="rise item" style="--i:${i + 2}" data-i="${i + 1}"><span class="num">${String(i + 1).padStart(2, "0")}</span><div><span class="tag">${esc(n.topline || n.place || "")}</span><h3>${esc(n.title)}</h3>${n.first ? `<p>${esc(n.first)}</p>` : ""}</div></li>`).join("")}</ol></div>`);
      requestAnimationFrame(() => FX.globe(node.querySelector(".globe"), focus, marks));
      return node;
    },
    article({ title, topline, paragraphs }) {
      return el(`<div class="view v-article">${head(topline || "Meldung", "tagesschau.de")}${rise(1, `<h3 class="atitle">${esc(title)}</h3>`)}${paragraphs.slice(0, 6).map((p, i) => rise(i + 2, `<p>${esc(p)}</p>`)).join("")}</div>`);
    },
    markets({ list, label }) {
      const node = el(`<div class="view v-mkt">${head("Börse", label)}
        ${rise(1, `<div class="ticker"><div class="track">${list.concat(list).map(q => `<span>${esc(q.name)} <b>${priceFmt(q.price, q.currency)}</b> ${chg(q.change)}</span>`).join("")}</div></div>`)}
        <div class="qgrid">${list.map((q, i) => `<div class="rise q" style="--i:${i + 2}"><div class="qn">${esc(q.name)}</div><div class="qv" data-v="${q.price}" data-c="${q.currency}">0</div>${chg(q.change)}${spark(q.series, (q.change || 0) >= 0, "m" + i)}</div>`).join("")}</div></div>`);
      node.querySelectorAll(".qv").forEach(e => FX.countUp(e, +e.dataset.v, v => priceFmt(v, e.dataset.c)));
      return node;
    },
    asset(q) {
      const node = el(`<div class="view v-asset">${head(q.name, q.symbol)}
        ${rise(1, `<div class="big"><span class="bv">0</span>${chg(q.change)}</div>`)}
        ${rise(2, `<div class="chart">${spark(q.series, (q.monthChange || 0) >= 0, "a")}</div>`)}
        ${rise(3, `<div class="facts"><div><span class="label">Tageshoch</span><b>${q.high ? priceFmt(q.high, q.currency) : "–"}</b></div><div><span class="label">Tagestief</span><b>${q.low ? priceFmt(q.low, q.currency) : "–"}</b></div><div><span class="label">3 Monate</span>${chg(q.monthChange)}</div></div>`)}</div>`);
      FX.countUp(node.querySelector(".bv"), q.price, v => priceFmt(v, q.currency));
      return node;
    },
    weather(w) {
      const node = el(`<div class="view v-weather">${head(w.city, w.region)}
        ${rise(1, `<div class="wnow"><canvas class="wicon"></canvas><div><div class="wtemp"><span class="tv">0</span>°</div><div class="wdesc">${esc(w.desc)}</div><div class="wmeta">Gefühlt ${nf(w.feels)}° · Wind ${nf(w.wind)} km/h · ${nf(w.humidity)} % Luftfeuchte</div></div></div>`)}
        <div class="wdays">${w.days.map((d, i) => `<div class="rise wday${i === w.focusDay ? " on" : ""}" style="--i:${i + 2}"><span class="label">${esc(d.label)}</span><span class="wi">${d.icon}</span><span class="bar"><i style="--lo:${d.lo};--hi:${d.hi}"></i></span><span class="mono">${nf(d.min)}° / ${nf(d.max)}°</span><span class="rain">${d.rain != null ? nf(d.rain) + " %" : ""}</span></div>`).join("")}</div></div>`);
      FX.countUp(node.querySelector(".tv"), w.temp, v => nf(v));
      requestAnimationFrame(() => FX.weatherIcon(node.querySelector(".wicon"), w.kind, w.isDay));
      return node;
    },
    wiki(p) {
      return el(`<div class="view v-wiki">${head(p.title, "Wikipedia")}
        ${p.image ? rise(1, `<div class="wimg"><img src="${esc(p.image)}" alt="" referrerpolicy="no-referrer"></div>`) : ""}
        ${p.description ? rise(2, `<p class="wdesc2">${esc(p.description)}</p>`) : ""}
        ${rise(3, `<p class="extract">${esc(p.extract)}</p>`)}</div>`);
    },
    info({ title, big, sub, kind }) {
      return el(`<div class="view v-info ${kind || ""}">${head(title, "")}${rise(1, `<div class="infobig">${esc(big)}</div>`)}${sub ? rise(2, `<p class="infosub">${esc(sub)}</p>`) : ""}</div>`);
    },
    timers(list) {
      const node = el(`<div class="view v-timer">${head("Timer", list.length === 1 ? "1 läuft" : list.length + " laufen")}<div class="tlist">${list.map((t, i) => `<div class="rise tcard" style="--i:${i + 1}" data-id="${t.id}">
        <svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" pathLength="1"/></svg>
        <div class="tval mono">--:--</div><div class="label">${esc(t.label || V.dur(t.total))}</div></div>`).join("")}</div></div>`);
      return node;
    },
    notes(list) {
      return el(`<div class="view v-notes">${head("Notizen", list.length ? list.length + (list.length === 1 ? " Eintrag" : " Einträge") : "leer")}
        ${list.length ? `<ol class="nlist">${list.map((n, i) => `<li class="rise" style="--i:${i + 1}"><span class="num">${String(i + 1).padStart(2, "0")}</span><div><p>${esc(n.text)}</p><span class="label">${esc(new Date(n.at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))}</span></div></li>`).join("")}</ol>` : rise(1, `<p class="muted">Sag zum Beispiel: Merke dir, dass ich morgen Milch kaufen muss.</p>`)}</div>`);
    },
    kpis({ list, example }) {
      const node = el(`<div class="view v-kpi">${head("Zahlen der Woche", example ? "Beispielwerte" : "Diese Woche")}
        ${example ? rise(1, `<p class="note">Beispielwerte. Sag zum Beispiel: Setze den Umsatz auf 60.000.</p>`) : ""}
        <div class="kgrid">${list.map((k, i) => { const d = k.p ? (k.v - k.p) / k.p * 100 : 0; return `<div class="rise kpi" style="--i:${i + 2}"><span class="label">${esc(k.n)}</span><div class="kv" data-v="${k.v}" data-u="${esc(k.u)}">0</div><span class="chg ${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${nf(Math.abs(d), 1)} % zur Vorwoche</span><span class="kbar"><i style="--w:${Math.max(4, Math.min(100, (k.p ? k.v / Math.max(k.v, k.p) : 1) * 100))}%"></i></span></div>`; }).join("")}</div></div>`);
      node.querySelectorAll(".kv").forEach(e => FX.countUp(e, +e.dataset.v, v => V.big(v, e.dataset.u), 1400));
      return node;
    },
    help() {
      const groups = [
        ["Nachrichten", ["Was gibt es Neues?", "Wie ist es in Frankreich?", "Nachrichten über Fußball", "Mehr zur zweiten Meldung"]],
        ["Börse", ["Was macht der Aktienmarkt?", "Wie steht Apple?", "Was kostet ein Bitcoin?"]],
        ["Wetter", ["Wie wird das Wetter morgen?", "Wetter in Hamburg", "Brauche ich einen Schirm?"]],
        ["Wissen", ["Wer ist Albert Einstein?", "Was ist ein schwarzes Loch?", "Wie hoch ist der Mount Everest?"]],
        ["Alltag", ["Stell einen Timer auf 10 Minuten", "Was ist 15 Prozent von 80?", "Merke dir …", "Wie spät ist es?"]],
        ["Makho", ["Stopp", "Sprich langsamer", "Andere Stimme", "Gute Nacht"]]
      ];
      return el(`<div class="view v-help">${head("Was ich kann", "Einfach sagen")}<div class="hgrid">${groups.map(([g, ex], i) => `<div class="rise hcard" style="--i:${i + 1}"><h3>${g}</h3>${ex.map(e => `<p>„${esc(e)}“</p>`).join("")}</div>`).join("")}</div></div>`);
    },
    big(v, u) { const s = v >= 1e6 ? nf(v / 1e6, 1) + " Mio." : v >= 1e4 ? nf(v / 1e3, 1) + " Tsd." : nf(v, 0); return u === "€" ? s + " €" : s; },
    dur(s) { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.round(s % 60); return [h ? h + " Std." : "", m ? m + " Min." : "", x ? x + " Sek." : ""].filter(Boolean).join(" "); },
    priceFmt, nf, esc
  };
  root.MakhoViews = V;
})(window);
