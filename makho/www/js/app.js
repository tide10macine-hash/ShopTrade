/* Makho – Ablauf und Fähigkeiten. Alles wird per Stimme gesteuert. */
(function () {
  "use strict";
  const N = window.MakhoNLU, S = window.MakhoSources, Voice = window.MakhoVoice, FX = window.MakhoFX, V = window.MakhoViews, K = window.MakhoKnow, B = window.MakhoBrain;
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const nf = V.nf;
  const nx = (v, d = 2) => Number(v).toLocaleString("de-DE", { maximumFractionDigits: d });
  const store = {
    get(k, d) { try { const v = localStorage.getItem("makho." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("makho." + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ================= Zustand ================= */
  const st = {
    awake: false, busy: false, pending: null, pendingAt: 0, awaitingCity: null,
    lastSaid: "", lastSaidAt: 0, flow: 0, cycleHandled: false, idleTimer: null,
    news: null, newsPage: 0, hintedMore: store.get("hintedMore", false),
    city: store.get("city", null), notes: store.get("notes", []), timers: [], alarm: null,
    name: store.get("name", ""), quiz: null, sw: null, answerMode: false
  };

  /* ================= Oberfläche ================= */
  const body = document.body;
  function setState(name) { body.dataset.state = name; }
  function setOrb(mode) { FX.setMode(mode); body.dataset.orb = mode; }
  let captionWords = [];
  function showCaption(text) {
    const box = $("#say");
    box.innerHTML = "";
    captionWords = [];
    const re = /\S+/g; let m, last = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) box.appendChild(document.createTextNode(text.slice(last, m.index)));
      const s = document.createElement("span"); s.textContent = m[0]; s.className = "w"; box.appendChild(s);
      captionWords.push({ start: m.index, el: s }); last = m.index + m[0].length;
    }
    box.classList.remove("in"); void box.offsetWidth; box.classList.add("in");
  }
  function markWord(start) {
    let n = 0;
    for (const w of captionWords) if (w.start <= start) { w.el.classList.add("on"); n++; }
    if (st.answerMode) { const aw = document.querySelectorAll("#stage .v-answer:not(.leave) .aw"); for (let i = 0; i < n && i < aw.length; i++) aw[i].classList.add("on"); }
  }
  function showHeard(text, live) {
    const h = $("#heard");
    h.innerHTML = text ? `<span class="label">Du</span> <span class="t"></span>${live ? '<i class="caret"></i>' : ""}` : "";
    if (text) h.querySelector(".t").textContent = text;
  }
  let stageView = null;
  function stage(node) {
    const s = $("#stage");
    s.querySelectorAll(":scope > .view:not(.leave)").forEach(old => { old.classList.add("leave"); setTimeout(() => old.remove(), 380); });
    if (node) { s.appendChild(node); s.scrollTop = 0; body.classList.add("staged"); }
    else body.classList.remove("staged");
    stageView = node;
  }
  function showOffer(text) {
    const o = $("#offer");
    if (!text) { o.classList.remove("show"); return; }
    o.querySelector(".q").textContent = text;
    o.classList.remove("show"); void o.offsetWidth; o.classList.add("show");
  }
  function netChip() { const on = navigator.onLine !== false; $("#net").className = "chip " + (on ? "ok" : "bad"); $("#net span").textContent = on ? "Online" : "Offline"; }
  window.addEventListener("online", netChip); window.addEventListener("offline", netChip);
  function clock() { const d = new Date(); $("#clock").textContent = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); }
  setInterval(clock, 5000); clock(); netChip();

  /* ================= Sprechen ================= */
  let speakId = 0;
  async function say(text, opts = {}) {
    if (!text) return;
    const id = ++speakId;
    st.answerMode = !!opts.answer;
    showCaption(text);
    st.lastSaid = text;
    setOrb("speak");
    let pulse = setInterval(() => { FX.speech = 0.25 + Math.random() * 0.55; }, 90);
    await Voice.say(text);
    clearInterval(pulse); FX.speech = 0;
    st.lastSaidAt = Date.now();
    if (id === speakId && st.awake) setOrb("listen");
    if (id === speakId && !st.awake) setOrb("sleep");
    return id === speakId;
  }
  Voice.on("word", start => { markWord(start); FX.speech = 0.8; setTimeout(() => { FX.speech = 0.35; }, 120); });

  function interrupt() {
    speakId++; st.flow++;
    Voice.hush();
    FX.speech = 0;
    if (st.alarm) stopAlarm();
    if (st.awake) setOrb("listen");
  }

  /* ================= Hören ================= */
  Voice.on("state", on => { if (on) st.cycleHandled = false; body.classList.toggle("hearing", on); });
  Voice.on("rms", db => { FX.mic = Math.max(0, Math.min(1, (db + 2) / 12)); $("#lvl").style.setProperty("--l", FX.mic.toFixed(2)); });
  Voice.on("speech", (type, text, alts) => onSpeech(type, text, alts));

  function onSpeech(type, text, alts) {
    text = (text || "").trim(); if (!text) return;
    alts = (alts && alts.length ? alts : [text]).map(a => String(a || "").trim()).filter(Boolean);
    const ctx = { awake: st.awake, pending: pendingValid() ? st.pending : null, awaitingCity: st.awaitingCity, quiz: !!st.quiz };
    // Schnelle Reaktion bereits auf Teilergebnisse: Stopp und Aufwecken.
    const quick = alts.map(a => N.parse(a, ctx)).find(r => r.intent === "stop" || r.intent === "wake");
    if (type === "partial") {
      if (st.awake && !Voice.speaking) showHeard(text, true);
      if (quick && !st.cycleHandled) { st.cycleHandled = true; quick.intent === "stop" ? doStop() : wake(); }
      return;
    }
    if (st.cycleHandled) { st.cycleHandled = false; return; }
    // Während Makho spricht, zählt nur "Stopp" (sonst hört er sich selbst).
    if (Voice.speaking) { if (quick && quick.intent === "stop") doStop(); return; }
    if (Date.now() - st.lastSaidAt < 1500 && N.overlap(st.lastSaid, text) > 0.6) return;
    if (!st.awake) { if (quick && quick.intent === "wake") wake(); return; }
    // beste Alternative wählen: die erste, die etwas Bekanntes ergibt
    let best = null;
    for (const a of alts.slice(0, 4)) { const r = N.parse(a, ctx); if (r.intent !== "unknown" && r.intent !== "none") { best = { r, a }; break; } }
    if (!best) best = { r: N.parse(alts[0], ctx), a: alts[0] };
    showHeard(best.a, false);
    bumpIdle();
    handle(best.r, best.a);
  }

  function pendingValid() { return st.pending && Date.now() - st.pendingAt < 30000; }
  function offer(key, text) { st.pending = key; st.pendingAt = Date.now(); showOffer(text); return say(text); }
  function clearOffer() { st.pending = null; showOffer(null); }

  /* ================= Aufwachen & Schlafen ================= */
  function greeting() {
    const h = new Date().getHours();
    const n = st.name ? ", " + st.name : "";
    return h < 5 ? `Noch wach${n}? Ich auch.` : h < 11 ? `Guten Morgen${n}.` : h < 18 ? `Hallo${n}.` : h < 23 ? `Guten Abend${n}.` : `Noch wach${n}? Ich auch.`;
  }
  async function wake() {
    if (st.awake) return;
    st.awake = true; st.flow++;
    setState("awake"); FX.burst(1.2); setOrb("think");
    bootLog();
    await wait(1300);
    const my = st.flow;
    showCaption("");
    await say(`${greeting()} Alle Systeme sind online.`);
    if (my !== st.flow) return;
    await offer("world", "Soll ich dir einen Überblick über die Nachrichten geben?");
    bumpIdle();
  }
  async function sleep(silent) {
    clearOffer(); st.flow++;
    if (!silent) await say(pick(["Bis später. Sag einfach Hallo Makho, wenn du mich brauchst.", "Ich ruhe mich aus. Ein Hallo Makho genügt."]));
    st.awake = false; stage(null); showHeard(""); showCaption("");
    setState("sleep"); setOrb("sleep");
  }
  function bumpIdle() { clearTimeout(st.idleTimer); st.idleTimer = setTimeout(() => { if (st.awake && !Voice.speaking && !st.timers.length) sleep(true); }, 5 * 60 * 1000); }
  function bootLog() {
    const log = $("#boot"); log.innerHTML = "";
    const lines = ["Spracherkennung", "Stimme", "Netzwerk", "Datenquellen", "Lagebild"];
    lines.forEach((l, i) => setTimeout(() => {
      const ok = l !== "Netzwerk" || navigator.onLine !== false;
      const d = document.createElement("div"); d.className = "bl"; d.innerHTML = `<span>${l}</span><b class="${ok ? "ok" : "bad"}">${ok ? "BEREIT" : "OFFLINE"}</b>`; log.appendChild(d);
    }, 120 + i * 170));
    log.classList.add("show");
    setTimeout(() => log.classList.remove("show"), 2300);
  }

  /* ================= Zentrale ================= */
  async function doStop() { interrupt(); clearOffer(); showCaption(""); }

  async function handle(r, raw) {
    const myFlow = ++st.flow;
    const alive = () => myFlow === st.flow;
    if (r.intent !== "yes" && r.intent !== "no") clearOffer();
    if (r.intent !== "weather") st.awaitingCity = null;
    try {
      switch (r.intent) {
        case "stop": if (st.quiz) { st.quiz = null; } return doStop();
        case "wake": return say(pick(["Ich bin da.", "Ja?", "Ich höre."]));
        case "sleep": return sleep();
        case "yes": { const k = st.pending; clearOffer(); return runOffer(k, alive); }
        case "no": { const k = st.pending; clearOffer(); const nxt = NEXT[k]; await say(pick(["Alles klar.", "Okay.", "Kein Problem."])); if (alive() && nxt) return nextOffer(k, true); return; }
        case "news": return r.place ? newsPlace(r.place, alive) : r.topic ? newsTopic(r.topic, alive) : newsWorld(alive);
        case "news.more": return newsMore(r.index, alive);
        case "news.next": return newsNext(alive);
        case "briefing": return briefing(alive);
        case "markets": return marketsOverview(alive);
        case "markets.asset": return asset(r.asset, alive);
        case "weather": return weatherSkill(Object.assign({ raw }, r), alive);
        case "city.set": return setCity(r.city, alive);
        case "time": { const d = new Date(); stage(V.info({ title: "Uhrzeit", big: d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), kind: "clock" })); return say(`Es ist ${d.getHours()} Uhr ${d.getMinutes() ? d.getMinutes() : ""}.`.replace(" .", ".")); }
        case "date": { const d = new Date(); const s = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); stage(V.info({ title: "Heute", big: d.toLocaleDateString("de-DE", { day: "numeric", month: "long" }), sub: s })); return say(`Heute ist ${s}.`); }
        case "calc": return calc(r);
        case "timer.set": return timerSet(r.seconds, r.label);
        case "timer.ask": st.pending = null; return say("Wie lange soll der Timer laufen? Sag zum Beispiel: Timer auf 10 Minuten.");
        case "timer.status": return timerStatus();
        case "timer.cancel": return timerCancel();
        case "note.add": return noteAdd(r.text, raw);
        case "note.list": return noteList();
        case "note.clear": st.notes = []; store.set("notes", st.notes); stage(V.notes([])); return say("Alle Notizen sind gelöscht.");
        case "kpi.show": return kpiShow(alive);
        case "kpi.set": return kpiSet(r.key, r.value);
        case "kpi.newweek": { const k = kpis(); k.list.forEach(x => { x.p = x.v; }); saveKpis(k.list); stage(V.kpis({ list: k.list, example: false })); return say("Neue Woche gestartet. Die bisherigen Werte sind jetzt die Vorwoche."); }
        case "help": stage(V.help()); return say((B.ready ? "Frag mich einfach alles, vom Schulstoff bis zum Business-Wissen. " : "Ich beantworte Wissensfragen über Wikipedia und mein eingebautes Lexikon. ") + "Dazu kommen Nachrichten, Börse, Wetter, Umrechnen, Übersetzen, Gleichungen, Timer, Wecker, Notizen und ein Quiz. Du kannst mich jederzeit mit Stopp unterbrechen." + (B.ready ? "" : " Sag Einstellungen, um das KI-Gehirn einzurichten. Dann beantworte ich wirklich jede Frage."));
        case "repeat": return st.lastSaid ? say(st.lastSaid) : say("Ich habe noch nichts gesagt.");
        case "close": stage(null); return say(pick(["Erledigt.", "Okay.", "Bildschirm ist frei."]));
        case "voice.rate": { const v = Voice.adjust("rate", r.delta); return say(r.delta > 0 ? `Etwas schneller. Tempo ${nf(v * 100)} Prozent.` : `Etwas langsamer. Tempo ${nf(v * 100)} Prozent.`); }
        case "voice.pitch": { Voice.adjust("pitch", r.delta); return say(r.delta < 0 ? "Etwas tiefer. Wie klingt das?" : "Etwas höher. Wie klingt das?"); }
        case "voice.next": { const v = Voice.nextVoice(); if (!v) return say("Auf diesem Handy gibt es nur eine deutsche Stimme. In den Android-Einstellungen unter Sprachausgabe kannst du die Google-Sprachausgabe auswählen und weitere Stimmen herunterladen."); return say(`Stimme ${v.index} von ${v.total}. Wie gefalle ich dir so?`); }
        case "voice.reset": Voice.reset(); return say("Stimme zurückgesetzt.");
        case "joke": return say(pick(JOKES));
        case "coin": { const k = Math.random() < 0.5 ? "Kopf" : "Zahl"; stage(V.info({ title: "Münzwurf", big: k, kind: "flip" })); return say(`${k}.`); }
        case "dice": { const n = 1 + Math.floor(Math.random() * 6); stage(V.info({ title: "Würfel", big: String(n), kind: "flip" })); return say(`Eine ${["", "Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs"][n]}.`); }
        case "random": { const n = Math.round(r.min + Math.random() * (r.max - r.min)); stage(V.info({ title: "Zufallszahl", big: nf(n), sub: `zwischen ${nf(r.min)} und ${nf(r.max)}`, kind: "flip" })); return say(`Die ${nf(n)}.`); }
        case "greet": return say(pick([`${greeting()} Was kann ich für dich tun?`, "Hallo! Was steht an?"]));
        case "howareyou": return say(pick(["Mir geht's bestens, alle Systeme laufen rund. Und dir?", "Gut, danke. Ich bin bereit für alles, was du brauchst."]));
        case "whoami": return say("Ich bin Makho, dein persönlicher Assistent. Ich zeige dir Nachrichten, Kurse und das Wetter, beantworte Fragen und erledige Kleinigkeiten. Alles per Stimme.");
        case "creator": return say("Ich wurde für dich gebaut. Programmiert hat mich Claude.");
        case "thanks": return say(pick(["Gern geschehen.", "Immer gern.", "Dafür bin ich da."]));
        case "compliment": return say(pick(["Danke, das hört man gern.", "Das geht runter wie Öl."]));
        case "wiki": return knowledgeQuestion(raw, r.query, alive);
        case "name.set": { const nm = r.name.replace(/\b\w/g, c => c.toUpperCase()).replace(/[.!?]$/, ""); st.name = nm; store.set("name", nm); return say(`Freut mich, ${nm}. Das merke ich mir.`); }
        case "name.get": return say(st.name ? `Du heißt ${st.name}.` : "Das weiß ich noch nicht. Sag einfach: Ich heiße und dann deinen Namen.");
        case "settings": return openSettings();
        case "brain.reset": B.reset(); return say("Alles klar, wir fangen neu an.");
        case "sw.start": st.sw = { start: Date.now() }; stage(V.stopwatch()); return say("Stoppuhr läuft.");
        case "sw.stop": { if (!st.sw) return say("Die Stoppuhr läuft gerade nicht."); const ms = Date.now() - st.sw.start; st.sw.stopped = ms; const t = st.sw; st.sw = null; showSw(ms); return say(`Gestoppt bei ${spokenDur(Math.round(ms / 1000)) || "unter einer Sekunde"}.`); }
        case "sw.status": { if (!st.sw) return say("Die Stoppuhr läuft gerade nicht. Sag: Starte die Stoppuhr."); stage(V.stopwatch()); return say(`Bisher ${spokenDur(Math.round((Date.now() - st.sw.start) / 1000))}.`); }
        case "alarm.at": return alarmAt(r);
        case "days.until": return daysUntil(r.text);
        case "weekday.of": return weekdayOf(r.text);
        case "kw": { const w = K.isoWeek(new Date()); stage(V.info({ title: "Kalenderwoche", big: "KW " + w, kind: "flip" })); return say(`Wir haben Kalenderwoche ${w}.`); }
        case "convert": return convert(r, alive);
        case "translate": return translateSkill(r, raw, alive);
        case "equation": return equation(r.text, raw, alive);
        case "element": return elementSkill(r.text, raw, alive);
        case "formula": return formulaSkill(r.text, raw, alive);
        case "quiz.start": return quizStart(r.cat);
        case "quiz.answer": return quizAnswer(r.text);
        case "quiz.skip": return quizAnswer(null);
        case "quiz.repeat": return st.quiz ? say(st.quiz.items[st.quiz.i].q) : say("Es läuft gerade kein Quiz.");
        case "quiz.end": return quizEnd(true);
        case "fact": { const f = pick(K.FACTS); stage(V.quote({ text: f, kind: "fact" })); return say("Wusstest du schon? " + f); }
        case "quote": { const [q, by] = pick(K.QUOTES); stage(V.quote({ text: q, by })); return say(`${q} Das sagte ${by}.`); }
        case "none": return;
        default: return knowledgeQuestion(raw, null, alive, true);
      }
    } catch (e) {
      console.error(e);
      if (alive()) { setOrb("listen"); await say(navigator.onLine === false ? "Ich bin gerade offline. Prüf bitte die Internetverbindung." : "Da ist gerade etwas schiefgelaufen. Versuch es bitte gleich noch einmal."); }
    }
  }

  /* ================= Angebote ================= */
  const NEXT = { world: "germany", germany: "markets", markets: "weather", weather: null };
  function runOffer(k, alive) {
    if (k === "world") return newsWorld(alive);
    if (k === "germany") return newsPlace(N.findPlace("deutschland"), alive);
    if (k === "markets") return marketsOverview(alive);
    if (k === "weather") return weatherSkill({ city: null, day: 0 }, alive);
    if (k === "news.more") return newsMore(1, alive);
    return say("Wobei kann ich dir helfen?");
  }
  async function nextOffer(after, skipped) {
    const k = NEXT[after];
    if (!k) return;
    if (k === "weather" && !st.city) return;
    const text = {
      germany: "Soll ich dir auch zeigen, was in Deutschland los ist?",
      markets: "Möchtest du einen Blick auf die Börse werfen?",
      weather: `Soll ich dir noch das Wetter für ${st.city && st.city.name} sagen?`
    }[k];
    await wait(skipped ? 100 : 500);
    return offer(k, text);
  }

  /* ================= Denkpause ================= */
  async function think(promise, visual) {
    setOrb("think");
    let shown = false;
    const tmr = visual ? setTimeout(() => { shown = true; stage(V.thinking(visual)); }, 450) : null;
    try { return await promise; } finally { clearTimeout(tmr); if (st.awake) setOrb("listen"); }
  }
  const ORDINAL = ["Erstens", "Zweitens", "Drittens", "Viertens", "Fünftens"];
  const headlineText = items => items.slice(0, 3).map((n, i) => `${ORDINAL[i]}: ${n.title.replace(/[„“"]/g, "")}.`).join(" ");

  /* ================= Nachrichten ================= */
  function placesOf(items) { return items.map(n => { const p = N.findPlace(n.topline + " " + n.title + " " + n.first); if (p) n.place = p.name; return p; }).filter(Boolean); }
  async function showNews(title, label, items, focus, intro, alive, offerKey) {
    st.news = { items, title }; st.newsPage = 0;
    const marks = placesOf(items);
    stage(V.news({ title, label, items: items.slice(0, 8), focus, marks }));
    if (!(await say(intro)) || !alive()) return;
    if (!(await say(headlineText(items))) || !alive()) return;
    if (!st.hintedMore) { st.hintedMore = true; store.set("hintedMore", true); if (!(await say("Sag zum Beispiel: mehr zur zweiten Meldung, wenn dich etwas genauer interessiert.")) || !alive()) return; }
    if (offerKey) return nextOffer(offerKey);
  }
  async function newsWorld(alive) {
    const items = await think(S.news.list("ausland"));
    if (!alive()) return;
    if (!items.length) return say("Ich bekomme gerade keine Meldungen. Versuch es gleich noch einmal.");
    const first = placesOf(items)[0];
    await showNews("Welt", "Live · tagesschau.de", items, first ? Object.assign({}, first) : { name: "", lat: 30, lon: 15, spin: true }, pick(["Hier sind die wichtigsten Meldungen aus aller Welt.", "Das passiert gerade in der Welt."]), alive, "world");
  }
  async function newsPlace(place, alive) {
    const items = place.name === "Deutschland" ? await think(S.news.list("inland")) : await think(S.news.search(place.name));
    if (!alive()) return;
    if (!items.length) { stage(null); return say(`Zu ${place.name} finde ich gerade keine aktuellen Meldungen.`); }
    await showNews(place.name, "Live · tagesschau.de", items, place, place.name === "Deutschland" ? "Das ist gerade in Deutschland los." : `Die aktuellen Meldungen zu ${place.name}.`, alive, place.name === "Deutschland" ? "germany" : null);
  }
  async function newsTopic(topic, alive) {
    const items = await think(S.news.search(topic));
    if (!alive()) return;
    if (!items.length) return say(`Zum Thema ${topic} finde ich gerade nichts.`);
    const marks = placesOf(items);
    await showNews(topic.replace(/\b\w/g, c => c.toUpperCase()), "Suche · tagesschau.de", items, marks[0] ? Object.assign({}, marks[0]) : { name: "", lat: 30, lon: 15, spin: true }, `Das gibt es Neues zum Thema ${topic}.`, alive, null);
  }
  async function newsMore(index, alive) {
    if (!st.news) return say("Ich habe dir noch keine Meldungen gezeigt. Sag zum Beispiel: Was gibt es Neues?");
    const items = st.news.items, i = index === -1 ? Math.min(items.length, 3) - 1 : (index || 1) - 1 + st.newsPage * 3;
    const it = items[i];
    if (!it) return say("Diese Meldung gibt es nicht.");
    let paras = [];
    try { paras = await think(S.news.details(it)); } catch (e) {}
    if (!alive()) return;
    if (!paras.length) paras = [it.first || it.title];
    stage(V.article({ title: it.title, topline: it.topline, paragraphs: paras }));
    const text = paras.slice(0, 3).join(" ");
    await say(text.length > 900 ? text.slice(0, text.lastIndexOf(".", 900) + 1) : text);
  }
  async function newsNext(alive) {
    if (!st.news) return say("Ich habe dir noch keine Meldungen gezeigt.");
    st.newsPage++;
    const items = st.news.items.slice(st.newsPage * 3, st.newsPage * 3 + 3);
    if (!items.length) { st.newsPage--; return say("Das waren alle Meldungen."); }
    const box = $("#stage .v-news .news"); if (box) { const li = box.children[st.newsPage * 3]; if (li) li.scrollIntoView({ behavior: "smooth", block: "start" }); }
    await say(items.map((n, k) => `${ORDINAL[k]}: ${n.title}.`).join(" "));
  }

  /* ================= Börse ================= */
  const OVERVIEW = [["^GDAXI", "DAX"], ["^GSPC", "S&P 500"], ["^IXIC", "Nasdaq"], ["^DJI", "Dow Jones"], ["BZ=F", "Öl (Brent)"], ["GC=F", "Gold"], ["BTC-USD", "Bitcoin"], ["EURUSD=X", "Euro/Dollar"]];
  const spokenName = n => n.replace("S&P 500", "S und P 500").replace("Öl (Brent)", "Brent-Öl").replace("Euro/Dollar", "Der Euro");
  const spokenPrice = (v, cur) => (v >= 1000 ? nf(v, 0) : v >= 10 ? nf(v, 2) : nf(v, 4)) + (cur === "USD" ? " Dollar" : cur === "EUR" ? " Euro" : " Punkte");
  async function marketsOverview(alive) {
    const res = await think(Promise.allSettled(OVERVIEW.map(([s]) => S.markets.chart(s, "1mo"))));
    if (!alive()) return;
    const list = res.map((r, i) => r.status === "fulfilled" ? Object.assign(r.value, { name: OVERVIEW[i][1] }) : null).filter(Boolean);
    if (list.length < 3) return say("Die Kursdaten sind gerade nicht erreichbar.");
    stage(V.markets({ list, label: "Live · " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) }));
    const up = list.filter(q => q.change > 0).length, down = list.filter(q => q.change < 0).length;
    const mood = up > down + 1 ? "Die Börsen sind heute gut gelaunt." : down > up + 1 ? "An den Börsen ist die Stimmung heute gedrückt." : "Die Börsen zeigen sich heute gemischt.";
    const pickL = ["DAX", "S&P 500", "Nasdaq", "Bitcoin"].map(n => list.find(q => q.name === n)).filter(Boolean);
    const line = q => `${spokenName(q.name)} ${spokenPrice(q.price, q.name === "DAX" || q.name.startsWith("S&P") || q.name === "Nasdaq" ? "" : q.currency)}, ${q.change >= 0 ? "plus" : "minus"} ${nf(Math.abs(q.change), 1)} Prozent`;
    if (!(await say(mood + " " + pickL.map(line).join(". ") + ".")) || !alive()) return;
    return nextOffer("markets");
  }
  async function asset(a, alive) {
    let sym = a.symbol, name = a.name;
    if (!sym) { const hit = await think(S.markets.search(a.query)); if (!alive()) return; if (!hit) return say(`Zu ${a.name} finde ich keinen Kurs.`); sym = hit.symbol; name = hit.name; }
    const q = await think(S.markets.chart(sym, "3mo"));
    if (!alive()) return;
    const first = q.series[0], monthChange = first ? (q.price / first - 1) * 100 : null;
    stage(V.asset(Object.assign({}, q, { name, monthChange })));
    const idx = /^\^/.test(sym);
    let txt = `${spokenName(name)} steht bei ${spokenPrice(q.price, idx ? "" : q.currency)}`;
    if (q.change != null) txt += `, ${q.change >= 0 ? "plus" : "minus"} ${nf(Math.abs(q.change), 1)} Prozent zum Vortag`;
    txt += ".";
    if (monthChange != null) txt += ` In den letzten drei Monaten ${monthChange >= 0 ? "ein Plus" : "ein Minus"} von ${nf(Math.abs(monthChange), 1)} Prozent.`;
    return say(txt);
  }

  /* ================= Wetter ================= */
  const DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const ICON = { sun: "☀", partly: "⛅", cloud: "☁", fog: "≋", rain: "☂", sleet: "☂", snow: "❄", storm: "⚡" };
  async function setCity(name, alive) {
    const c = await think(S.weather.geocode(name));
    if (!alive()) return;
    if (!c) return say(`Ich finde keinen Ort namens ${name}.`);
    st.city = c; store.set("city", c);
    return say(`Gemerkt. ${c.name} ist jetzt deine Stadt.`);
  }
  async function weatherSkill(r, alive) {
    let city = st.city;
    if (r.city) {
      const c = await think(S.weather.geocode(r.city));
      if (!alive()) return;
      if (!c) return say(`Ich finde keinen Ort namens ${r.city}.`);
      city = c;
      if (!st.city) { st.city = c; store.set("city", c); }
    }
    if (!city) { st.awaitingCity = { day: r.day }; return say("Für welche Stadt?"); }
    st.awaitingCity = null;
    const f = await think(S.weather.forecast(city.lat, city.lon));
    if (!alive()) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const all = f.daily.map(d => d.max).concat(f.daily.map(d => d.min)), lo = Math.min(...all), hi = Math.max(...all), span = (hi - lo) || 1;
    const days = f.daily.slice(0, 6).map((d, i) => { const dt = new Date(d.date + "T12:00:00"); const [, kind] = S.weather.describe(d.code); return { label: i === 0 ? "Heute" : i === 1 ? "Morgen" : DAYS[dt.getDay()].slice(0, 2), icon: ICON[kind], min: d.min, max: d.max, rain: d.rain, lo: ((d.min - lo) / span).toFixed(3), hi: ((d.max - lo) / span).toFixed(3) }; });
    const focusDay = typeof r.day === "number" ? r.day : 0;
    const [desc, kind] = S.weather.describe(f.current.code);
    stage(V.weather({ city: city.name, region: [city.admin, city.country].filter(Boolean).join(", "), temp: f.current.temp, feels: f.current.feels, wind: f.current.wind, humidity: f.current.humidity, desc, kind, isDay: f.current.day, days, focusDay }));
    const r0 = n => nf(Math.round(n));
    let txt;
    if (r.day === "we" || r.day === "week") {
      const pickDays = f.daily.filter(d => { const g = new Date(d.date + "T12:00:00").getDay(); return r.day === "week" || g === 6 || g === 0; }).slice(0, r.day === "week" ? 5 : 2);
      txt = `${r.day === "we" ? "Am Wochenende" : "Die nächsten Tage"} in ${city.name}: ` + pickDays.map(d => `${DAYS[new Date(d.date + "T12:00:00").getDay()]} ${S.weather.describe(d.code)[0]}, bis ${r0(d.max)} Grad`).join(". ") + ".";
    } else if (focusDay > 0) {
      const d = f.daily[focusDay];
      txt = `${focusDay === 1 ? "Morgen" : "Übermorgen"} in ${city.name}: ${S.weather.describe(d.code)[0]}, zwischen ${r0(d.min)} und ${r0(d.max)} Grad. Regenwahrscheinlichkeit ${r0(d.rain || 0)} Prozent.`;
    } else {
      const d = f.daily[0];
      txt = `In ${city.name} sind es gerade ${r0(f.current.temp)} Grad, ${desc}. Gefühlt ${r0(f.current.feels)} Grad. Heute bis ${r0(d.max)} Grad, Regenwahrscheinlichkeit ${r0(d.rain || 0)} Prozent.`;
    }
    if (/schirm|regen|regnet/.test(N.norm(r.raw || ""))) { const p = f.daily[focusDay === "we" ? 0 : focusDay || 0].rain || 0; txt = (p >= 50 ? "Ja, nimm lieber einen Schirm mit. " : p >= 25 ? "Vielleicht. Ein Schirm schadet nicht. " : "Eher nicht. ") + txt; }
    return say(txt);
  }

  /* ================= Briefing ================= */
  async function briefing(alive) {
    const d = new Date();
    const parts = [`${greeting()} Es ist ${d.getHours()} Uhr ${d.getMinutes() || ""}.`.replace(" .", ".")];
    const [news, dax, wx] = await think(Promise.allSettled([S.news.home(), S.markets.chart("^GDAXI", "1mo"), st.city ? S.weather.forecast(st.city.lat, st.city.lon) : Promise.reject()]));
    if (!alive()) return;
    if (wx.status === "fulfilled") { const c = wx.value.current, t = wx.value.daily[0]; parts.push(`In ${st.city.name} ${Math.round(c.temp)} Grad, ${S.weather.describe(c.code)[0]}, heute bis ${Math.round(t.max)} Grad.`); }
    if (dax.status === "fulfilled") parts.push(`Der DAX steht bei ${nf(dax.value.price, 0)} Punkten, ${dax.value.change >= 0 ? "plus" : "minus"} ${nf(Math.abs(dax.value.change), 1)} Prozent.`);
    if (news.status === "fulfilled" && news.value.length) {
      const items = news.value;
      st.news = { items, title: "Briefing" }; st.newsPage = 0;
      const marks = placesOf(items);
      stage(V.news({ title: "Briefing", label: d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }), items: items.slice(0, 8), focus: marks[0] ? Object.assign({}, marks[0]) : { name: "", lat: 40, lon: 10, spin: true }, marks }));
      parts.push("Die Top-Meldungen. " + headlineText(items));
    }
    if (!st.city) parts.push("Tipp: Sag mir deine Stadt, zum Beispiel: Meine Stadt ist Berlin. Dann bekommst du auch das Wetter.");
    return say(parts.join(" "));
  }

  /* ================= Wissen ================= */
  async function wiki(query, raw, alive) {
    if (!query || query.length < 2) return say("Wonach soll ich suchen?");
    const p = await think(S.wiki.lookup(query));
    if (!alive()) return;
    if (!p) return say(`Zu ${query} habe ich nichts Verlässliches gefunden.`);
    stage(V.wiki(p));
    const sentences = p.extract.match(/[^.!?]+[.!?]+(\s|$)/g) || [p.extract];
    let txt = ""; for (const s of sentences) { if ((txt + s).length > 420 && txt) break; txt += s; }
    return say(txt.replace(/\s*\([^)]*\)/g, "").trim());
  }

  /* ================= Wissen: Gehirn, Lexikon, Wikipedia ================= */
  function ctxInfo() {
    const d = new Date();
    return { date: d.toLocaleString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }), city: st.city ? st.city.name : "", name: st.name || "" };
  }
  async function askBrain(question, alive) {
    try {
      const a = await think(B.ask(question, ctxInfo()), "Makho denkt nach");
      if (!alive()) return true;
      stage(V.answer({ title: a.title || "Antwort", text: a.text, badge: a.searched ? "KI · Websuche" : "KI" }));
      await say(a.text, { answer: true });
      return true;
    } catch (e) {
      if (!alive()) return true;
      if (e.code === "auth") { stage(null); await say("Dein Claude-Schlüssel wird nicht akzeptiert. Sag Einstellungen, um ihn zu prüfen."); return true; }
      if (e.code === "rate") { await say("Ich bekomme gerade zu viele Anfragen. Versuch es gleich noch einmal."); return true; }
      if (e.code === "net" && navigator.onLine === false) { await say("Ich bin offline. Prüf bitte die Internetverbindung."); return true; }
      return false; // auf das freie Wissen zurückfallen
    }
  }
  async function knowledgeQuestion(raw, query, alive, unknown) {
    const text = (raw || query || "").trim();
    if (B.ready && text) { if (await askBrain(text, alive)) return; }
    const g = K.glossary(text);
    if (g && /(was ist|was sind|was bedeutet|erklär|definition|was heißt)/i.test(text)) { stage(V.answer({ title: g.name, text: g.def, badge: "Lexikon" })); return say(g.def, { answer: true }); }
    const f = K.formula(text);
    if (f && /(formel|berechnet|rechnet)/i.test(text)) return formulaSkill(text, raw, alive);
    if (unknown && !/^(wie|wo|wann|warum|wieso|weshalb|welche|welcher|welches|wer|was|woher|wohin|erklär|erzähl|definier|kannst du|gibt es|ist|sind)\b/i.test(text)) {
      return say(pick(["Das habe ich nicht verstanden. Sag zum Beispiel: Was kannst du?", "Das habe ich leider nicht mitbekommen. Versuch es noch mal anders."]));
    }
    return wiki(query || N.parse(text, { awake: true }).query || text, raw, alive);
  }

  /* ================= Umrechnen & Übersetzen ================= */
  async function convert(r, alive) {
    const cf = K.findCurrency(r.from), ct = K.findCurrency(r.to);
    if (cf && ct) {
      const x = await think(S.fx.convert(r.value, cf.code, ct.code));
      if (!alive()) return;
      stage(V.convert({ fromVal: nx(r.value, 2), fromUnit: cf.name, toVal: x.result, toUnit: ct.name, note: x.date ? "EZB-Kurs " + new Date(x.date).toLocaleDateString("de-DE") : "" }));
      return say(`${nx(r.value, 2)} ${cf.name} sind ${nx(x.result, 2)} ${ct.name}.`);
    }
    const c = K.convert(r.value, r.from, r.to);
    if (!c) return knowledgeQuestion(`Wie viel sind ${r.value} ${r.from} in ${r.to}?`, null, alive);
    const d = Math.abs(c.value) >= 100 ? 1 : Math.abs(c.value) >= 1 ? 3 : 6;
    stage(V.convert({ fromVal: nx(r.value, 4), fromUnit: c.from, toVal: c.value, toUnit: c.to }));
    return say(`${nx(r.value, 4)} ${c.from} sind ${nx(c.value, d)} ${c.to}.`);
  }
  async function translateSkill(r, raw, alive) {
    const code = K.LANG[r.lang];
    if (!code) return knowledgeQuestion(raw, null, alive);
    const src = (String(raw).match(new RegExp("(?:heißt|heisst|bedeutet|sagt man|übersetz\\w*|sag)\\s+(.+?)\\s+(?:auf|ins|in|nach)\\s+\\S+\\s*$", "i")) || [])[1] || r.text;
    let out;
    try { out = await think(S.translate.text(src, code)); } catch (e) { if (B.ready) return knowledgeQuestion(raw, null, alive); throw e; }
    if (!alive()) return;
    stage(V.translate({ src, out, lang: K.LANGNAME[code] }));
    await say(`${src} heißt auf ${K.LANGNAME[code]}:`);
    if (alive()) await Voice.sayIn(out, K.BCP[code]);
  }

  /* ================= Schule ================= */
  function spokenNum(x) { return (x < 0 ? "minus " : "") + nx(Math.abs(x), 4); }
  async function equation(text, raw, alive) {
    const r = K.solve(text);
    if (!r) return knowledgeQuestion(raw, null, alive);
    stage(V.equation({ eq: text.replace(/^(löse|berechne)\s+(die gleichung\s+)?/i, ""), steps: r.steps, solutions: r.solutions || [] }));
    const sp = r.solutions && r.solutions.length === 2 ? `Zwei Lösungen: x eins ist ${spokenNum(r.solutions[0])} und x zwei ist ${spokenNum(r.solutions[1])}.` : r.solutions && r.solutions.length === 1 ? `x ist gleich ${spokenNum(r.solutions[0])}.` : r.spoken;
    return say(sp);
  }
  async function elementSkill(text, raw, alive) {
    const e = K.element(raw || text);
    if (!e) return knowledgeQuestion(raw, null, alive);
    stage(V.element(e));
    return say(`${e.name} hat das Symbol ${e.sym.split("").join(" ")}, die Ordnungszahl ${e.z} und eine Atommasse von ${nx(e.mass, 2)}. Es ist ein ${e.group}.`);
  }
  async function formulaSkill(text, raw, alive) {
    const f = K.formula(text);
    if (!f) return knowledgeQuestion(raw, null, alive);
    stage(V.formula(f));
    return say(`${f.name}: ${f.explain}`);
  }

  /* ================= Quiz ================= */
  function quizStart(cat) {
    let pool = K.QUIZ.filter(q => !cat || q.cat.toLowerCase() === cat);
    if (pool.length < 3) pool = K.QUIZ;
    pool = pool.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    st.quiz = { items: pool, i: 0, score: 0 };
    return askQuiz(true);
  }
  function askQuiz(first) {
    const q = st.quiz, it = q.items[q.i];
    stage(V.quiz({ cat: it.cat, q: it.q, n: q.i + 1, total: q.items.length, score: q.score }));
    return say((first ? `Quiz mit ${q.items.length} Fragen. Los geht's. ` : "") + `Frage ${q.i + 1}: ${it.q}`);
  }
  async function quizAnswer(said) {
    const q = st.quiz; if (!q) return;
    const it = q.items[q.i];
    const ok = said != null && K.checkAnswer(it, said);
    if (ok) { q.score++; FX.confetti(); FX.burst(0.5); }
    stage(V.quizResult({ ok, answer: it.a, said }));
    await say(ok ? pick(["Richtig!", "Genau!", "Stimmt, sehr gut!"]) : said == null ? `Die Lösung ist: ${it.a}.` : `Leider nicht. Richtig ist: ${it.a}.`);
    if (!st.quiz) return;
    q.i++;
    if (q.i >= q.items.length) return quizEnd(false);
    await wait(400);
    if (st.quiz) return askQuiz(false);
  }
  async function quizEnd(early) {
    const q = st.quiz; if (!q) return say("Es läuft gerade kein Quiz.");
    st.quiz = null;
    const total = early ? q.i : q.items.length;
    stage(V.quizEnd({ score: q.score, total }));
    if (!early && q.score === total) FX.confetti();
    const verdict = total === 0 ? "" : q.score === total ? " Perfekt, alles richtig!" : q.score >= total * 0.6 ? " Starke Leistung." : " Da geht noch was. Nochmal?";
    return say(`Quiz beendet. Du hast ${q.score} von ${total} Fragen richtig.${verdict}`);
  }

  /* ================= Zeit ================= */
  function showSw(ms) { stage(V.stopwatch()); const e = document.querySelector("#stage .swv"); if (e) e.textContent = fmtSw(ms); document.querySelector("#stage .v-sw")?.classList.add("stopped"); }
  function fmtSw(ms) { const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60); return (h ? h + ":" + String(m % 60).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0") + "," + Math.floor(ms % 1000 / 100); }
  setInterval(() => { if (st.sw) { const e = document.querySelector("#stage .v-sw:not(.stopped) .swv"); if (e) e.textContent = fmtSw(Date.now() - st.sw.start); } }, 100);
  function alarmAt(r) {
    let h = r.h, m = r.m || 0;
    if (r.pm && h < 12) h += 12;
    if (h > 23 || m > 59) return say("Diese Uhrzeit gibt es nicht.");
    const now = new Date(), at = new Date(); at.setHours(h, m, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    const secs = Math.round((at - now) / 1000);
    const t = { id: ++timerSeq, total: secs, end: at.getTime(), label: "Wecker " + at.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) };
    st.timers.push(t); renderTimers(true);
    return say(`Wecker gestellt auf ${h} Uhr${m ? " " + m : ""}${at.getDate() !== now.getDate() ? " morgen" : ""}. Das ist in ${spokenDur(Math.round(secs / 60) * 60)}. Lass die App dafür geöffnet.`);
  }
  function daysUntil(text) {
    const now = new Date(), nd = K.namedDate(text, now);
    if (!nd) return say("Welches Datum meinst du?");
    const d = K.daysBetween(now, nd.date);
    stage(V.info({ title: nd.name, big: String(d), sub: (d === 1 ? "Tag" : "Tage") + " · " + nd.date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), kind: "flip" }));
    return say(d === 0 ? `${nd.name} ist heute!` : d < 0 ? `${nd.name} war vor ${-d} Tagen.` : `Bis ${nd.name} sind es noch ${d} ${d === 1 ? "Tag" : "Tage"}.`);
  }
  function weekdayOf(text) {
    const nd = K.namedDate(text, new Date());
    if (!nd) return say("Welches Datum meinst du?");
    const wd = nd.date.toLocaleDateString("de-DE", { weekday: "long" });
    stage(V.info({ title: nd.date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }), big: wd, kind: "flip" }));
    return say(`Der ${nd.date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })} ist ein ${wd}.`);
  }

  /* ================= Einstellungen ================= */
  function openSettings() {
    const v = Voice.voices().find(x => x.name === Voice.settings.voice);
    stage(V.settings({ hasKey: B.hasKey(), voice: v ? v.name : "", rate: Voice.settings.rate, model: B.MODEL }));
    body.classList.add("setting");
    const msg = t => { const e = document.getElementById("keyMsg"); if (e) e.textContent = t; };
    document.getElementById("keySave").onclick = async () => {
      const k = document.getElementById("keyIn").value.trim();
      if (!/^sk-ant-/.test(k)) { msg("Das sieht nicht nach einem Claude-Key aus. Er beginnt mit sk-ant-."); return; }
      B.setKey(k); msg("Prüfe den Schlüssel …");
      try { await B.ask("Antworte nur mit: # Test\nVerbindung steht.", ctxInfo()); B.reset(); msg("Verbunden. Das KI-Gehirn ist aktiv."); closeSettings(); say("Mein KI-Gehirn ist jetzt aktiv. Frag mich, was du willst."); }
      catch (e) { if (e.code === "auth") { B.setKey(""); msg("Der Schlüssel wurde abgelehnt."); } else msg("Gespeichert, aber die Prüfung schlug fehl: " + (e.message || e.code)); }
    };
    const del = document.getElementById("keyDel"); if (del) del.onclick = () => { B.setKey(""); closeSettings(); say("Das KI-Gehirn ist ausgeschaltet."); };
    document.getElementById("setClose").onclick = closeSettings;
    return say(B.hasKey() ? "Hier sind die Einstellungen. Das KI-Gehirn ist aktiv." : "Hier kannst du einmalig deinen Claude-API-Key eintragen. Danach beantworte ich jede Frage.");
  }
  function closeSettings() { body.classList.remove("setting"); stage(null); }

  /* ================= Rechnen ================= */
  function calc(r) {
    let v;
    try { v = Function('"use strict"; return (' + r.expr + ")")(); } catch (e) { v = NaN; }
    if (!isFinite(v)) return say("Das kann ich nicht ausrechnen.");
    const out = Math.abs(v) >= 1e6 ? nf(v, 0) : nf(Math.round(v * 10000) / 10000, Number.isInteger(Math.round(v * 10000) / 10000) ? 0 : 2);
    stage(V.info({ title: "Rechnung", big: out, sub: r.spoken.replace(/\*/g, "×") + " =", kind: "calc" }));
    return say(`Das ergibt ${out}.`);
  }

  /* ================= Timer ================= */
  let timerSeq = 0;
  function timerSet(secs, label) {
    if (secs < 1 || secs > 24 * 3600) return say("Diese Dauer kann ich nicht stellen.");
    const t = { id: ++timerSeq, total: secs, end: Date.now() + secs * 1000, label: label ? label.replace(/\b\w/, c => c.toUpperCase()) : "" };
    st.timers.push(t); renderTimers(true);
    return say(`Timer läuft: ${spokenDur(secs)}.`);
  }
  function spokenDur(s) { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.round(s % 60); const p = []; if (h) p.push(h === 1 ? "eine Stunde" : h + " Stunden"); if (m) p.push(m === 1 ? "eine Minute" : m + " Minuten"); if (x) p.push(x === 1 ? "eine Sekunde" : x + " Sekunden"); return p.join(" und ") || "null Sekunden"; }
  function renderTimers(show) {
    $("#tchip").hidden = !st.timers.length;
    if (show) stage(st.timers.length ? V.timers(st.timers) : null);
  }
  function timerStatus() {
    if (!st.timers.length) return say("Es läuft gerade kein Timer.");
    renderTimers(true);
    return say(st.timers.map(t => `${t.label ? t.label + ": " : ""}noch ${spokenDur(Math.max(0, Math.round((t.end - Date.now()) / 1000)))}`).join(". ") + ".");
  }
  function timerCancel() {
    if (st.alarm) { stopAlarm(); return say("Alarm aus."); }
    if (!st.timers.length) return say("Es läuft gerade kein Timer.");
    const n = st.timers.length; st.timers = []; renderTimers(stageView && stageView.classList.contains("v-timer"));
    return say(n === 1 ? "Timer gestoppt." : `${n} Timer gestoppt.`);
  }
  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll(".tcard").forEach(c => {
      const t = st.timers.find(x => x.id === +c.dataset.id); if (!t) { c.classList.add("done"); return; }
      const left = Math.max(0, (t.end - now) / 1000);
      c.querySelector(".tval").textContent = fmtClock(left);
      c.querySelector(".fg").style.strokeDashoffset = String(1 - left / t.total);
    });
    if (st.timers.length) { const next = Math.min(...st.timers.map(t => t.end)); $("#tchip span").textContent = fmtClock(Math.max(0, (next - now) / 1000)); }
    const due = st.timers.filter(t => t.end <= now);
    if (due.length) { st.timers = st.timers.filter(t => t.end > now); renderTimers(false); ring(due[0]); }
  }, 250);
  function fmtClock(s) { s = Math.ceil(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); }
  let actx = null;
  function beep() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      [0, 0.22, 0.44].forEach(o => { const os = actx.createOscillator(), g = actx.createGain(); os.type = "sine"; os.frequency.value = 880; g.gain.setValueAtTime(0, t + o); g.gain.linearRampToValueAtTime(0.35, t + o + 0.02); g.gain.linearRampToValueAtTime(0, t + o + 0.18); os.connect(g); g.connect(actx.destination); os.start(t + o); os.stop(t + o + 0.2); });
    } catch (e) {}
  }
  async function ring(t) {
    if (!st.awake) { st.awake = true; setState("awake"); FX.burst(1); }
    stage(V.info({ title: "Timer", big: "0:00", sub: (t.label ? t.label + " · " : "") + V.dur(t.total) + " sind um", kind: "alarm" }));
    body.classList.add("alarm");
    const a = { until: Date.now() + 60000 }; st.alarm = a;
    await say(`Dein Timer über ${spokenDur(t.total)} ist abgelaufen. Sag Stopp, um den Alarm zu beenden.`);
    while (st.alarm === a && Date.now() < a.until) { beep(); await wait(1600); }
    if (st.alarm === a) stopAlarm();
  }
  function stopAlarm() { st.alarm = null; body.classList.remove("alarm"); }

  /* ================= Notizen ================= */
  /* "dass ich Milch kaufen muss" → "Du musst Milch kaufen" */
  const SWAP = { ich: "du", mich: "dich", mir: "dir", mein: "dein", meine: "deine", meinen: "deinen", meinem: "deinem", meiner: "deiner", muss: "musst", habe: "hast", hab: "hast", bin: "bist", will: "willst", kann: "kannst", soll: "sollst", darf: "darfst", werde: "wirst", möchte: "möchtest", brauche: "brauchst", gehe: "gehst", kaufe: "kaufst", rufe: "rufst", mache: "machst", wir: "wir" };
  function rephrase(raw, fallback) {
    let m = String(raw || "").match(/(?:merk(?:e)?\s+dir(?:\s+mal)?|notier(?:e)?|notiz|schreib(?:e)?\s+(?:dir\s+)?auf|vergiss\s+nicht)\s*[,:]?\s*(.+)$/i);
    let text = (m ? m[1] : fallback || "").trim().replace(/[.!?]+$/, "");
    let sub = false;
    if (/^(dass|das)\s+/i.test(text)) { text = text.replace(/^(dass|das)\s+/i, ""); sub = true; }
    let w = text.split(/\s+/).map(x => { const k = x.toLowerCase(); return SWAP[k] && /^(ich|mich|mir|mein\w*|muss|habe|hab|bin|will|kann|soll|darf|werde|möchte|brauche|gehe|kaufe|rufe|mache)$/.test(k) ? SWAP[k] : x; });
    if (sub && w.length > 2 && /^(du|wir|er|sie|es)$/i.test(w[0])) { const verb = w.pop(); w.splice(1, 0, verb); }
    text = w.join(" ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  function noteAdd(text, raw) {
    const clean = rephrase(raw, text);
    if (!clean) return say("Was soll ich mir merken?");
    st.notes.push({ text: clean, at: Date.now() }); store.set("notes", st.notes);
    stage(V.notes(st.notes));
    return say(`Notiert: ${clean}.`);
  }
  function noteList() {
    stage(V.notes(st.notes));
    if (!st.notes.length) return say("Du hast keine Notizen.");
    return say((st.notes.length === 1 ? "Du hast eine Notiz. " : `Du hast ${st.notes.length} Notizen. `) + st.notes.slice(-5).map((n, i) => `${ORDINAL[i] || ""}: ${n.text}.`).join(" "));
  }

  /* ================= Zahlen der Woche ================= */
  const KDEF = [{ k: "reach", n: "Reichweite", u: "Aufrufe", v: 2300000, p: 1850000 }, { k: "news", n: "Newsletter", u: "Leser", v: 4300, p: 4050 }, { k: "rev", n: "Umsatz", u: "€", v: 52000, p: 46500 }, { k: "orders", n: "Bestellungen", u: "Shop", v: 318, p: 296 }];
  function kpis() { const s = store.get("kpis2", null); return s ? { list: s, example: false } : { list: KDEF.map(x => Object.assign({}, x)), example: true }; }
  function saveKpis(list) { store.set("kpis2", list); }
  const kSpoken = k => { const v = k.v >= 1e6 ? nf(k.v / 1e6, 1) + " Millionen" : nf(k.v, 0); return { reach: `${v} Aufrufe`, news: `${v} Newsletter-Leser`, rev: `${v} Euro Umsatz`, orders: `${v} Bestellungen` }[k.k]; };
  async function kpiShow(alive) {
    const k = kpis();
    stage(V.kpis(k));
    let txt = "Deine Zahlen der Woche. " + k.list.map(kSpoken).join(". ") + ".";
    const up = k.list.filter(x => x.v > x.p).length;
    txt += up === k.list.length ? " Alles im Plus, starke Woche." : up === 0 ? " Diese Woche lief alles schwächer als die letzte." : "";
    if (k.example) txt = "Das sind noch Beispielwerte. Sag zum Beispiel: Setze den Umsatz auf 60.000. " + txt;
    return say(txt);
  }
  function kpiSet(key, value) {
    const k = kpis(); const item = k.list.find(x => x.k === key); if (!item) return;
    if (k.example) k.list.forEach(x => { x.p = x.v; });
    item.v = value; saveKpis(k.list);
    stage(V.kpis({ list: k.list, example: false }));
    return say(`${item.n} auf ${V.big(value, item.u).replace("Mio.", "Millionen").replace("Tsd.", "Tausend").replace("€", "Euro")} gesetzt.`);
  }

  const JOKES = [
    "Treffen sich zwei Magneten. Sagt der eine: Was soll ich heute bloß anziehen?",
    "Warum können Seeräuber keinen Kreis berechnen? Weil sie Pi raten.",
    "Was macht ein Pirat am Computer? Er drückt die Enter-Taste.",
    "Ich wollte einen Witz über Zeitreisen erzählen. Aber ihr habt ihn ja schon gehört.",
    "Was ist rot und schlecht für die Zähne? Ein Ziegelstein.",
    "Wie nennt man einen Bumerang, der nicht zurückkommt? Stock.",
    "Warum gehen Ameisen nicht in die Kirche? Weil sie Insekten sind.",
    "Was sagt der große Stift zum kleinen Stift? Wachs mal, Stift.",
    "Ich habe meinem WLAN einen Namen gegeben. Jetzt fühlt es sich verbunden.",
    "Was ist ein Keks unter einem Baum? Ein schattiges Plätzchen.",
    "Warum sitzen Programmierer im Dunkeln? Weil Licht ein Feature ist, das niemand bestellt hat.",
    "Wie nennt man ein verschwundenes Rentier? Weg-Rentier."
  ];

  /* ================= Start ================= */
  async function start() {
    FX.start($("#fx"), $("#orbSlot"));
    setState("sleep"); setOrb("sleep");
    await Voice.init();
    const ok = await Voice.micPermission(true);
    micStatus(ok);
    if (ok) await Voice.listen();
    $("#grant").onclick = async () => { const g = await Voice.micPermission(true); micStatus(g); if (g) Voice.listen(); };
    document.addEventListener("visibilitychange", () => { if (document.hidden) { interrupt(); } });
  }
  function micStatus(ok) {
    $("#lockMic").textContent = ok ? "Ich höre zu" : "Kein Mikrofon-Zugriff";
    $("#lockDot").className = "dot " + (ok ? "on" : "off");
    $("#grantBox").hidden = ok;
  }
  window.Makho = { st, handle, onSpeech, wake, sleep };
  start();
})();
