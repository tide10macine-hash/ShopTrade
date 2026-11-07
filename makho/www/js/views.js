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
        ["Wissen", ["Erklär mir die Fotosynthese", "Was ist EBITDA?", "Wer war Napoleon?", "Wie gründe ich eine GmbH?"]],
        ["Schule", ["Löse 2x plus 3 gleich 11", "Formel für die Kreisfläche", "Welches Symbol hat Gold?", "Mach ein Quiz in Geschichte"]],
        ["Umrechnen", ["100 Euro in Dollar", "5 Meilen in Kilometer", "Was heißt Danke auf Spanisch?"]],
        ["Alltag", ["Timer auf 10 Minuten", "Weck mich um 7 Uhr", "Starte die Stoppuhr", "Wie viele Tage bis Weihnachten?", "Merke dir …"]],
        ["Makho", ["Stopp", "Einstellungen", "Ich heiße …", "Andere Stimme", "Gute Nacht"]]
      ];
      return el(`<div class="view v-help">${head("Was ich kann", "Einfach sagen")}<div class="hgrid">${groups.map(([g, ex], i) => `<div class="rise hcard" style="--i:${i + 1}"><h3>${g}</h3>${ex.map(e => `<p>„${esc(e)}“</p>`).join("")}</div>`).join("")}</div></div>`);
    },
    thinking(label) {
      const node = el(`<div class="view v-think"><div class="neural"><canvas class="ncv"></canvas></div><p class="tlabel"><span>${esc(label || "Makho denkt nach")}</span><i></i><i></i><i></i></p></div>`);
      requestAnimationFrame(() => FX.neural(node.querySelector(".ncv")));
      return node;
    },
    answer({ title, text, badge }) {
      const words = String(text).split(/(\s+)/).map(w => /\S/.test(w) ? `<span class="aw">${esc(w)}</span>` : w).join("");
      return el(`<div class="view v-answer">${head(title || "Antwort", badge || "")}${rise(1, `<p class="answer">${words}</p>`)}</div>`);
    },
    convert({ fromVal, fromUnit, toVal, toUnit, note }) {
      const node = el(`<div class="view v-conv">${head("Umrechnung", note || "")}
        ${rise(1, `<div class="cbox"><div class="cside"><span class="cv">${esc(fromVal)}</span><span class="cu">${esc(fromUnit)}</span></div><div class="carrow"><i></i></div><div class="cside to"><span class="cv tv" data-v="${toVal}">0</span><span class="cu">${esc(toUnit)}</span></div></div>`)}</div>`);
      const t = node.querySelector(".tv"); const v = +t.dataset.v; const d = Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 1 ? 3 : 6;
      FX.countUp(t, v, x => Number(x).toLocaleString("de-DE", { maximumFractionDigits: d }), 1200);
      return node;
    },
    translate({ src, out, lang }) {
      return el(`<div class="view v-trans">${head("Übersetzung", "Deutsch → " + lang)}
        ${rise(1, `<div class="flip"><div class="card front"><span class="label">Deutsch</span><p>${esc(src)}</p></div><div class="card back"><span class="label">${esc(lang)}</span><p>${esc(out)}</p></div></div>`)}</div>`);
    },
    equation({ eq, steps, solutions }) {
      return el(`<div class="view v-eq">${head("Gleichung", solutions && solutions.length ? (solutions.length === 1 ? "1 Lösung" : solutions.length + " Lösungen") : "")}
        ${rise(1, `<div class="eqline mono">${esc(eq)}</div>`)}
        <ol class="steps">${steps.map((s, i) => `<li class="rise mono" style="--i:${i + 2}">${esc(s)}</li>`).join("")}</ol>
        <div class="sols">${(solutions || []).map((x, i) => `<div class="rise sol" style="--i:${steps.length + 2 + i}"><span>x${solutions.length > 1 ? "<sub>" + (i + 1) + "</sub>" : ""} =</span><b>${Number(x).toLocaleString("de-DE", { maximumFractionDigits: 4 })}</b></div>`).join("")}</div></div>`);
    },
    element(e) {
      return el(`<div class="view v-elem">${head(e.name, e.group)}
        ${rise(1, `<div class="ptile"><span class="pz">${e.z}</span><span class="psym">${esc(e.sym)}</span><span class="pname">${esc(e.name)}</span><span class="pmass">${Number(e.mass).toLocaleString("de-DE", { maximumFractionDigits: 3 })} u</span></div>`)}
        ${rise(2, `<div class="facts"><div><span class="label">Ordnungszahl</span><b>${e.z}</b></div><div><span class="label">Symbol</span><b>${esc(e.sym)}</b></div><div><span class="label">Atommasse</span><b>${Number(e.mass).toLocaleString("de-DE", { maximumFractionDigits: 3 })} u</b></div></div>`)}</div>`);
    },
    formula(f) {
      return el(`<div class="view v-formula">${head(f.name, "Formel")}${rise(1, `<div class="fbig">${esc(f.formula)}</div>`)}${rise(2, `<p class="extract">${esc(f.explain)}</p>`)}
        ${f.legend.length ? `<div class="legend">${f.legend.map((l, i) => `<span class="rise chipl" style="--i:${i + 3}">${esc(l)}</span>`).join("")}</div>` : ""}</div>`);
    },
    quiz({ cat, q, n, total, score }) {
      return el(`<div class="view v-quiz">${head("Quiz", cat)}
        ${rise(1, `<div class="qprog">${Array.from({ length: total }, (_, i) => `<i class="${i < n - 1 ? "done" : i === n - 1 ? "now" : ""}"></i>`).join("")}<span class="label">Frage ${n} von ${total} · ${score} richtig</span></div>`)}
        ${rise(2, `<div class="qcard"><p>${esc(q)}</p></div>`)}
        ${rise(3, `<p class="muted">Sag deine Antwort. „Weiß nicht“ zeigt die Lösung, „Quiz beenden“ hört auf.</p>`)}</div>`);
    },
    quizResult({ ok, answer, said }) {
      return el(`<div class="view v-qres ${ok ? "ok" : "bad"}">${head(ok ? "Richtig!" : "Leider falsch", "")}${rise(1, `<div class="qmark">${ok ? "✓" : "✗"}</div>`)}${rise(2, `<p class="extract">Lösung: <b>${esc(answer)}</b></p>`)}${said ? rise(3, `<p class="muted">Deine Antwort: ${esc(said)}</p>`) : ""}</div>`);
    },
    quizEnd({ score, total }) {
      const pct = total ? score / total : 0;
      return el(`<div class="view v-qend">${head("Ergebnis", "Quiz")}${rise(1, `<div class="scorering" style="--p:${pct}"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" pathLength="1"/></svg><div class="sc"><b>${score}</b><span>von ${total}</span></div></div>`)}</div>`);
    },
    stopwatch() {
      return el(`<div class="view v-sw">${head("Stoppuhr", "")}${rise(1, `<div class="swv mono">0:00,0</div>`)}${rise(2, `<div class="swring"><i></i></div>`)}</div>`);
    },
    quote({ text, by, kind }) {
      return el(`<div class="view v-quote">${head(kind === "fact" ? "Wusstest du?" : "Zitat", "")}${rise(1, `<blockquote>${esc(text)}</blockquote>`)}${by ? rise(2, `<p class="qby">— ${esc(by)}</p>`) : ""}</div>`);
    },
    settings({ hasKey, voice, rate, model }) {
      return el(`<div class="view v-set">${head("Einstellungen", "")}
        ${rise(1, `<div class="setcard"><h3>KI-Gehirn (Claude)</h3><p class="muted">Mit einem eigenen Claude-API-Key beantwortet Makho jede Frage, nutzt die Websuche und merkt sich das Gespräch. Den Key bekommst du auf console.anthropic.com. Er bleibt nur auf diesem Handy gespeichert.</p>
          <p class="state ${hasKey ? "on" : ""}">${hasKey ? "● Aktiv · " + esc(model) : "○ Nicht eingerichtet"}</p>
          <input id="keyIn" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" aria-label="Claude API-Key">
          <div class="row"><button class="btn" id="keySave" type="button">Speichern</button>${hasKey ? `<button class="btn ghost" id="keyDel" type="button">Entfernen</button>` : ""}<button class="btn ghost" id="setClose" type="button">Fertig</button></div>
          <p class="muted" id="keyMsg"></p></div>`)}
        ${rise(2, `<div class="setcard"><h3>Stimme</h3><p class="muted">Tempo ${nf(rate * 100, 0)} % · ${esc(voice || "Standardstimme")}</p><p class="muted">Per Stimme: „Sprich langsamer“, „Andere Stimme“, „Tiefer sprechen“.</p></div>`)}</div>`);
    },

    big(v, u) { const s = v >= 1e6 ? nf(v / 1e6, 1) + " Mio." : v >= 1e4 ? nf(v / 1e3, 1) + " Tsd." : nf(v, 0); return u === "€" ? s + " €" : s; },
    dur(s) { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.round(s % 60); return [h ? h + " Std." : "", m ? m + " Min." : "", x ? x + " Sek." : ""].filter(Boolean).join(" "); },
    priceFmt, nf, esc
  };
  root.MakhoViews = V;
})(window);
