/* Makho – Sprachverständnis: aus einem gehörten Satz wird eine Absicht mit Details. */
(function (root) {
  "use strict";

  const norm = s => String(s || "")
    .toLowerCase()
    .replace(/[„“”"'»«‚‘’`´]/g, " ")
    .replace(/[!?;:]/g, " ")
    .replace(/(\D)[.,]|[.,](\D)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const words = s => norm(s).split(" ").filter(Boolean);

  /* ---------- Zahlen ---------- */
  const UNITS = { null: 0, ein: 1, eins: 1, eine: 1, einen: 1, einem: 1, einer: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
  const TENS = { zwanzig: 20, dreißig: 30, dreissig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
  function wordToNumber(w) {
    w = w.replace(/ß/g, "ß");
    if (w in UNITS) return UNITS[w];
    if (w in TENS) return TENS[w];
    if (w === "hundert" || w === "einhundert") return 100;
    if (w === "tausend" || w === "eintausend") return 1000;
    if (w === "halbe" || w === "halb") return 0.5;
    if (w === "anderthalb" || w === "eineinhalb") return 1.5;
    if (w === "zweieinhalb") return 2.5;
    let m;
    if ((m = w.match(/^(.+)tausend(.*)$/))) { const a = wordToNumber(m[1]); const b = m[2] ? wordToNumber(m[2]) : 0; if (a != null && b != null) return a * 1000 + b; }
    if ((m = w.match(/^(.+)hundert(.*)$/))) { const a = wordToNumber(m[1]); const b = m[2] ? wordToNumber(m[2]) : 0; if (a != null && b != null) return a * 100 + b; }
    if ((m = w.match(/^(.+)und(zwanzig|dreißig|dreissig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/))) { const a = UNITS[m[1]]; if (a != null) return a + TENS[m[2]]; }
    return null;
  }
  /** Liest eine Zahl am Anfang von s: "2,5 millionen", "52.000", "zwölf", "3 tausend". */
  function parseNumber(s) {
    const t = norm(s);
    let m = t.match(/^(-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?)(?:\s*(millionen|million|mio|milliarden|milliarde|mrd|tausend|tsd|k|hundert))?/);
    let val = null, rest = t;
    if (m) {
      let raw = m[1];
      if (/^\-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) raw = raw.replace(/\./g, "").replace(",", ".");
      else raw = raw.replace(",", ".");
      val = parseFloat(raw);
      const mul = m[2];
      if (mul) val *= /^mill|^mio/.test(mul) ? 1e6 : /^milliard|^mrd/.test(mul) ? 1e9 : /^hundert/.test(mul) ? 100 : 1000;
      rest = t.slice(m[0].length).trim();
      return { value: val, rest };
    }
    const w = t.split(" ");
    const first = wordToNumber(w[0] || "");
    if (first != null) {
      val = first; let used = 1;
      if (w[1] && /^(millionen|million|mio)$/.test(w[1])) { val *= 1e6; used = 2; }
      else if (w[1] && /^tausend$/.test(w[1])) { val *= 1000; used = 2; }
      return { value: val, rest: w.slice(used).join(" ") };
    }
    return null;
  }

  /* ---------- Orte ---------- */
  const PLACES = [
    ["Deutschland", /\b(deutschland|deutschen|bundesrepublik|inland)\b/, 51.2, 10.4],
    ["Russland", /\b(russland|russen|russisch\w*|moskau|kreml|putin)\b/, 55.8, 37.6],
    ["Ukraine", /\b(ukraine|ukrainisch\w*|kiew|kyjiw|selenskyj)\b/, 50.4, 30.5],
    ["USA", /\b(usa|amerika|vereinigten staaten|us-amerikanisch\w*|washington|trump)\b/, 38.9, -77],
    ["China", /\b(china|chinesisch\w*|peking)\b/, 39.9, 116.4],
    ["Iran", /\b(iran|iranisch\w*|teheran)\b/, 35.7, 51.4],
    ["Israel", /\b(israel|israelisch\w*|gaza|nahost|nahen osten)\b/, 31.5, 34.8],
    ["Frankreich", /\b(frankreich|französisch\w*|paris)\b/, 48.9, 2.35],
    ["Großbritannien", /\b(großbritannien|grossbritannien|england|britisch\w*|london)\b/, 51.5, -0.1],
    ["Türkei", /\b(türkei|türkisch\w*|ankara|istanbul)\b/, 39.9, 32.9],
    ["Italien", /\b(italien|italienisch\w*|rom)\b/, 41.9, 12.5],
    ["Spanien", /\b(spanien|spanisch\w*|madrid)\b/, 40.4, -3.7],
    ["Polen", /\b(polen|polnisch\w*|warschau)\b/, 52.2, 21],
    ["Österreich", /\b(österreich|wien)\b/, 48.2, 16.4],
    ["Schweiz", /\b(schweiz|bern|zürich)\b/, 46.9, 7.4],
    ["Japan", /\b(japan|japanisch\w*|tokio)\b/, 35.7, 139.7],
    ["Indien", /\b(indien|indisch\w*|neu-delhi)\b/, 28.6, 77.2],
    ["Syrien", /\b(syrien|damaskus)\b/, 33.5, 36.3],
    ["Brasilien", /\b(brasilien)\b/, -15.8, -47.9],
    ["Korea", /\b(korea|nordkorea|südkorea|seoul)\b/, 37.5, 127],
    ["Taiwan", /\b(taiwan)\b/, 25, 121.5],
    ["Kanada", /\b(kanada)\b/, 45.4, -75.7],
    ["Mexiko", /\b(mexiko)\b/, 19.4, -99.1],
    ["Venezuela", /\b(venezuela)\b/, 10.5, -66.9],
    ["Afrika", /\b(afrika|sudan|nigeria|kenia|südafrika)\b/, 5, 20],
    ["EU", /\b(eu|europäische union|brüssel)\b/, 50.85, 4.35]
  ];
  function findPlace(text) {
    const t = norm(text); let best = null, bi = 1e9;
    for (const p of PLACES) { const i = t.search(p[1]); if (i >= 0 && i < bi) { bi = i; best = p; } }
    return best ? { name: best[0], lat: best[2], lon: best[3] } : null;
  }

  /* ---------- Wörter, die oft falsch gehört werden ---------- */
  const NAME = "(makho|macho|makko|mako|maco|marco|marko|mago|maho|mahko|machu|matscho|mucho|maku|maka)";
  const WAKE = new RegExp("(^|\\s)(hallo|hallöchen|hey|hi|ok|okay|servus|moin|hello|halo|na)\\s*,?\\s*" + NAME + "\\b|^hallo" + NAME + "\\b|^" + NAME + "$");
  const NAME_PREFIX = new RegExp("^(hey |hallo |ok |okay )?" + NAME + "\\s*,?\\s*");
  const STOP_ANY = /^(stop+|stopp+|halt|ruhe|still|sei (mal |doch )?(still|ruhig|leise)|hör (doch |mal |bitte )?auf|aufhören|genug|abbrechen|abbruch|schweig\w*|leise|pause|psst?|klappe|ende|lass (es|das) gut sein|ist gut|schon gut)\b/;
  const STOP_SHORT = /\b(stop+|stopp+|halt|aufhören|genug|abbrechen|ruhe)\b/;
  const SLEEP = /(gute nacht|schlaf (jetzt|gut|ein)?|schlafen|geh schlafen|tschüss|tschüs|tschau|ciao|bis später|bis dann|bis morgen|auf wiedersehen|ruhemodus|leg dich hin|makho aus|ausschalten|schalt dich aus)/;
  const YES = /^(ja|jo|jap|jep|jawohl|jupp?|gerne?|klar|na klar|okay|ok|bitte|ja bitte|sicher|natürlich|unbedingt|auf jeden fall|warum nicht|mach (mal|das)?|zeig (mal|her|es)?|los|leg los|gerne doch|logisch|absolut|genau|immer|her damit|klingt gut|sehr gern|why not|yes)\b/;
  const NO = /^(nein|nee|nö|ne|nicht|nicht nötig|jetzt nicht|später|lass (mal|es|gut sein)?|kein|keine|danke nein|nein danke|nope|no|überspring\w*|weiter nicht|brauch ich nicht)\b/;

  const ORD = { erste: 1, ersten: 1, "1": 1, zweite: 2, zweiten: 2, "2": 2, dritte: 3, dritten: 3, "3": 3, vierte: 4, vierten: 4, "4": 4, fünfte: 5, fünften: 5, "5": 5, letzte: -1, letzten: -1 };

  /* ---------- Hauptfunktion ---------- */
  function parse(raw, ctx) {
    ctx = ctx || {};
    const full = norm(raw);
    if (!full) return { intent: "none" };
    const t = full.replace(NAME_PREFIX, "").trim() || full;
    const n = t.split(" ").length;
    let m;

    if (STOP_ANY.test(t) || (n <= 4 && STOP_SHORT.test(t))) {
      if (/timer|wecker|countdown/.test(t)) return { intent: "timer.cancel" };
      return { intent: "stop" };
    }
    if (!ctx.awake) return WAKE.test(full) ? { intent: "wake" } : { intent: "none" };
    if (WAKE.test(full) && n <= 3) return { intent: "wake" };
    if (SLEEP.test(t)) return { intent: "sleep" };

    if (ctx.pending && n <= 6) {
      if (NO.test(t)) return { intent: "no" };
      if (YES.test(t)) return { intent: "yes" };
    }
    if (ctx.awaitingCity && n <= 4 && !/\d/.test(t)) {
      return { intent: "weather", city: t.replace(/^(in|für|nach)\s+/, ""), day: ctx.awaitingCity.day || 0 };
    }

    /* Timer */
    if (/(timer|wecker|countdown|eieruhr)/.test(t) && /(stopp|aus\b|abbrechen|lösch|beend|weg|cancel|ausschalten)/.test(t)) return { intent: "timer.cancel" };
    if (/(wie lange|wie viel zeit|wieviel zeit|restzeit)/.test(t) && /(timer|noch|wecker)/.test(t)) return { intent: "timer.status" };
    if (/(timer|wecker|countdown|eieruhr|erinner\w* mich in|stell\w* .*(auf|für) .*(minute|sekunde|stunde))/.test(t)) {
      const secs = durationIn(t);
      if (secs) return { intent: "timer.set", seconds: secs, label: (t.match(/(?:für|zum|zur)\s+(?:den |die |das )?([a-zäöüß ]{3,30})$/) || [])[1] || "" };
      return { intent: "timer.ask" };
    }

    /* Uhrzeit und Datum */
    if (/(wie spät|uhrzeit|wie viel uhr|wieviel uhr|welche zeit)/.test(t)) return { intent: "time" };
    if (/(welcher tag|welches datum|der wievielte|den wievielten|datum heute|welchen tag)/.test(t)) return { intent: "date" };

    /* Rechnen */
    const expr = mathExpr(t);
    if (expr) return { intent: "calc", expr: expr.expr, spoken: expr.spoken };

    /* Wetter */
    if ((m = t.match(/(meine stadt ist|ich wohne in|ich lebe in|ich bin in|heimatstadt ist)\s+(.+)/))) return { intent: "city.set", city: m[2] };
    if (/(wetter|temperatur|regnet|regnen|regen|schnee|schneit|wie warm|wie kalt|grad draußen|sonnig|gewitter|brauche ich (einen |eine )?(schirm|jacke)|regenschirm)/.test(t)) {
      const day = /übermorgen/.test(t) ? 2 : /morgen/.test(t) ? 1 : /wochenende/.test(t) ? "we" : /woche/.test(t) ? "week" : 0;
      let city = null;
      if ((m = t.match(/\b(?:in|für|bei)\s+([a-zäöüß][a-zäöüß\- ]{1,40}?)(?:\s+(?:heute|morgen|übermorgen|am wochenende|diese woche|jetzt|gerade|aus))?$/))) city = m[1];
      if (city && /^(der|die|das|meiner|meinem|meine)\b/.test(city)) city = null;
      return { intent: "weather", city, day };
    }

    /* Notizen */
    if ((m = t.match(/^(?:bitte )?(?:merk(?:e)? dir|merk dir mal|notier(?:e)?|notiz|schreib(?:e)? (?:dir )?auf|vergiss nicht)\s*(?:dass|,|:)?\s*(.+)/))) return { intent: "note.add", text: m[1] };
    if (/(lösch|entfern|vergiss)\w*.*(notiz|alles was|gemerkt)/.test(t)) return { intent: "note.clear" };
    if (/(was (habe|hab) ich (mir )?(gemerkt|notiert)|meine notizen|was hast du dir gemerkt|zeig\w* .*notizen|lies .*notizen|notizen vor)/.test(t)) return { intent: "note.list" };

    /* Zahlen der Woche */
    const KPI = /(umsatz|umsätze|reichweite|aufrufe|views|newsletter|abonnenten|leser|bestellungen|orders)/;
    if (KPI.test(t) && (m = t.match(/(umsatz|umsätze|reichweite|aufrufe|views|newsletter|abonnenten|leser|bestellungen|orders)\w*\s+(?:auf|ist|sind|beträgt|liegt bei|von|=|mit|bei)?\s*(.+)/))) {
      const num = parseNumber(m[2].replace(/^(auf|bei)\s+/, ""));
      if (num && isFinite(num.value)) {
        const k = /umsatz|umsätze/.test(m[1]) ? "rev" : /reichweite|aufrufe|views/.test(m[1]) ? "reach" : /newsletter|abonnenten|leser/.test(m[1]) ? "news" : "orders";
        return { intent: "kpi.set", key: k, value: num.value };
      }
    }
    if (/neue woche/.test(t)) return { intent: "kpi.newweek" };
    if (/(zahlen der woche|wochenzahlen|meine zahlen|kennzahlen|kpis?|statistik|wie läuft (mein|das) (geschäft|business|shop)|mein umsatz|meine reichweite)/.test(t)) return { intent: "kpi.show" };

    /* Börse */
    const asset = findAsset(t);
    if (asset && /(wie steht|kurs|preis|aktie|steht|kostet|wert|chart|wie läuft|wie geht es)/.test(t)) return { intent: "markets.asset", asset };
    if (/(börse|boerse|aktienmarkt|aktien|märkte|finanzmarkt|dax|leitindex|wall street|wallstreet|kurse|marktlage)/.test(t)) return asset ? { intent: "markets.asset", asset } : { intent: "markets" };
    if (asset && n <= 3) return { intent: "markets.asset", asset };

    /* Nachrichten weiterführen */
    if ((m = t.match(/(?:mehr|details|genauer|näheres|ausführlich\w*|lies)\s*(?:zu|zur|zum|über|von)?\s*(?:der|die|dem)?\s*(erste|ersten|zweite|zweiten|dritte|dritten|vierte|vierten|fünfte|fünften|letzte|letzten|\d)\b/)) || (m = t.match(/(erste|ersten|zweite|zweiten|dritte|dritten|vierte|vierten|fünfte|fünften|letzte|letzten)\s+(meldung|nachricht|schlagzeile|artikel)/))) return { intent: "news.more", index: ORD[m[1]] };
    if (/^(mehr dazu|erzähl mehr|mehr details|genauer|erzähl (mir )?(mehr|was) dazu|was steht (da|drin)|mehr infos?)/.test(t)) return { intent: "news.more", index: 1 };
    if (/^(weiter|nächste|die nächsten|mehr nachrichten|noch mehr|was noch|und sonst|nächste seite)/.test(t)) return { intent: "news.next" };

    /* Nachrichten */
    const place = findPlace(t);
    const newsy = /(nachricht|news|neuigkeit|schlagzeile|was ist (in |mit |bei )?[a-zäöüß ]{0,30}los\b|was passiert in|was ist los|was gibt.s neues|was gibt es neues|was passiert|was ist passiert|lage|was tut sich|aktuell|meldungen|tagesschau|wie ist es in|wie sieht es in|wie siehts in|geh nach|gehe nach|flieg nach|zeig mir|zoom)/.test(t);
    if (place && (newsy || n <= 3)) return { intent: "news", place };
    if ((m = t.match(/(?:nachrichten|news|neuigkeiten|meldungen|neues)\s+(?:über|zu|zum|zur|von|aus dem|aus der|aus|in sachen)\s+(.+)/))) return { intent: "news", topic: m[1] };
    if (newsy && /(welt|ausland|international|global)/.test(t)) return { intent: "news", world: true };
    if (/(briefing|überblick|zusammenfassung|tagesüberblick|morgenbriefing|was steht heute an|was gibt.s heute|bring mich auf den neuesten stand|update)/.test(t)) return { intent: "briefing" };
    if (newsy) return { intent: "news", world: true };

    /* Steuerung */
    if (/(was kannst du|hilfe|welche befehle|was geht alles|deine funktionen|was kann ich (dich )?fragen|wie funktioniert)/.test(t)) return { intent: "help" };
    if (/(wiederhol|was hast du gesagt|nochmal bitte|noch mal bitte|wie bitte|sag das nochmal)/.test(t)) return { intent: "repeat" };
    if (/^(zurück|schließ\w*|schliess\w*|ausblenden|weg damit|startseite|home|übersicht schließen|mach (das|es) zu|ansicht schließen|bildschirm frei)/.test(t)) return { intent: "close" };
    if (/(sprich|rede|sprechen|reden)\s+(etwas |ein bisschen |bitte )?(schneller|zügiger)|schneller sprechen/.test(t)) return { intent: "voice.rate", delta: 0.12 };
    if (/(sprich|rede|sprechen|reden)\s+(etwas |ein bisschen |bitte )?(langsamer|ruhiger)|langsamer sprechen/.test(t)) return { intent: "voice.rate", delta: -0.12 };
    if (/(tiefer|tiefere stimme)/.test(t) && /(sprich|stimme|rede)/.test(t)) return { intent: "voice.pitch", delta: -0.1 };
    if (/(höher|höhere stimme)/.test(t) && /(sprich|stimme|rede)/.test(t)) return { intent: "voice.pitch", delta: 0.1 };
    if (/(andere|neue|nächste|bessere|weitere) stimme|stimme (ändern|wechseln|tauschen)|wechsel\w* (die |deine )?stimme/.test(t)) return { intent: "voice.next" };
    if (/(stimme zurücksetzen|normale stimme|standardstimme)/.test(t)) return { intent: "voice.reset" };

    /* Spaß */
    if (/(witz|lustiges|bring mich zum lachen|was zum lachen)/.test(t)) return { intent: "joke" };
    if (/(münze|kopf oder zahl)/.test(t)) return { intent: "coin" };
    if (/würfel/.test(t)) return { intent: "dice" };
    if ((m = t.match(/(?:zufallszahl|zufällige zahl|zahl)\s+(?:zwischen|von)\s+(\S+)\s+(?:und|bis)\s+(\S+)/))) {
      const a = parseNumber(m[1]), b = parseNumber(m[2]);
      if (a && b) return { intent: "random", min: Math.min(a.value, b.value), max: Math.max(a.value, b.value) };
    }

    /* Smalltalk */
    if (/^(guten morgen|guten tag|guten abend|moin|servus|hallo|hi|hey)\b/.test(t) && n <= 3) return { intent: "greet" };
    if (/(wie geht es dir|wie gehts|wie geht.s|alles gut bei dir|wie läuft.s bei dir)/.test(t)) return { intent: "howareyou" };
    if (/(wer bist du|was bist du|wie heißt du|stell dich vor)/.test(t)) return { intent: "whoami" };
    if (/(wer hat dich (gemacht|gebaut|erschaffen|programmiert)|wer ist dein (chef|erfinder))/.test(t)) return { intent: "creator" };
    if (/^(okay |ok |ja |alles klar )?(danke|dankeschön|vielen dank|danke schön|merci|top|super|perfekt|klasse|gut gemacht|stark|nice|cool)\b/.test(t)) return { intent: "thanks" };
    if (/(ich liebe dich|du bist (toll|super|der beste|cool))/.test(t)) return { intent: "compliment" };

    /* Wissen */
    if ((m = t.match(/^(?:wer|was)\s+(?:ist|war|sind|waren|bedeutet|heißt|bezeichnet)\s+(?:eigentlich\s+)?(?:ein|eine|der|die|das)?\s*(.+)/)) && !/^(los|passiert|neu)/.test(m[1])) return { intent: "wiki", query: m[1], raw: t };
    if ((m = t.match(/^(?:erzähl|erzähle|sag)\s+(?:mir\s+)?(?:etwas|was|mehr)\s+(?:über|zu)\s+(.+)/)) || (m = t.match(/^(?:was weißt du über|erklär\w*\s+(?:mir\s+)?|definiere|definition von|infos? (?:über|zu))\s*(.+)/))) return { intent: "wiki", query: m[1], raw: t };
    if (/^(wie|wo|wann|warum|wieso|weshalb|welche|welcher|welches|wer|was|woher|wohin|wieviel|wie viel|wie viele|gibt es|ist|sind|kann|hat)\b/.test(t) && n >= 3) return { intent: "wiki", query: questionKeywords(t), raw: t };

    if (place) return { intent: "news", place };
    return { intent: "unknown", text: t };
  }

  function questionKeywords(t) {
    const STOP = new Set("wie wo wann warum wieso weshalb welche welcher welches wer was woher wohin wieviel viel viele gibt es ist sind war waren kann können hat haben der die das den dem des ein eine einen einem einer und oder auf in im an am zu zum zur von vom mit für über bei groß hoch alt lang weit schwer eigentlich denn genau mir mich du dir".split(" "));
    const k = t.split(" ").filter(w => !STOP.has(w));
    return k.join(" ") || t;
  }

  function durationIn(t) {
    let total = 0, found = false; const re = /(\d+(?:[.,]\d+)?|[a-zäöüß]+)\s*(stunden?|std|minuten?|min|sekunden?|sek|s\b)/g; let m;
    while ((m = re.exec(t))) {
      const num = /\d/.test(m[1]) ? parseFloat(m[1].replace(",", ".")) : wordToNumber(m[1]);
      if (num == null) continue;
      found = true;
      total += num * (/^st/.test(m[2]) ? 3600 : /^min/.test(m[2]) ? 60 : 1);
    }
    if (/halbe stunde/.test(t)) { total += 1800; found = true; }
    if (/viertelstunde/.test(t)) { total += 900; found = true; }
    return found ? Math.round(total) : 0;
  }

  function mathExpr(t) {
    if (!/\d/.test(t) && !/(zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|hundert)\s+(plus|minus|mal|durch|geteilt)/.test(t)) return null;
    if (!/(plus|minus|mal\b|geteilt|durch\b|hoch\b|wurzel|prozent von|quadrat|[+\-*/×÷x])/.test(t)) return null;
    if (/(uhr|minute|sekunde|stunde|timer|grad)/.test(t)) return null;
    let s = t.replace(/^(was ist|was sind|wie viel ist|wieviel ist|wie viel sind|rechne|berechne|was ergibt|was gibt|sag mir)\s*/, "").replace(/\?/g, "");
    s = s.replace(/[a-zäöüß]+/g, w => { const v = wordToNumber(w); return v != null && !/^(ein|eine|einen)$/.test(w) ? String(v) : w; });
    let spoken = s;
    s = s.replace(/(\d),(\d)/g, "$1.$2")
      .replace(/(\d+(?:\.\d+)?)\s*prozent von\s*(\d+(?:\.\d+)?)/g, "($1/100*$2)")
      .replace(/(?:die )?(?:quadrat)?wurzel (?:aus|von)\s*(\d+(?:\.\d+)?)/g, "Math.sqrt($1)")
      .replace(/(\d+(?:\.\d+)?)\s*(?:zum quadrat|quadrat)/g, "($1**2)")
      .replace(/geteilt durch|durch|÷/g, "/").replace(/\bmal\b|×|\bx\b/g, "*").replace(/plus/g, "+").replace(/minus/g, "-").replace(/hoch/g, "**")
      .replace(/\bist\b|\bgleich\b|=|\bergibt\b/g, "").trim();
    if (!/^[\d\s+\-*/().]*(Math\.sqrt\([\d.]+\)[\d\s+\-*/().]*)*$/.test(s) || !/\d/.test(s)) return null;
    if (!/[+\-*/]|Math/.test(s)) return null;
    return { expr: s, spoken };
  }

  const ASSETS = [
    ["DAX", "^GDAXI", /\bdax\b/], ["S&P 500", "^GSPC", /(s ?(und|&) ?p|s&p|sp 500)/], ["Nasdaq", "^IXIC", /nasdaq/], ["Dow Jones", "^DJI", /dow( jones)?/],
    ["Bitcoin", "BTC-USD", /bitcoin|btc/], ["Ethereum", "ETH-USD", /ethereum|ether\b/], ["Gold", "GC=F", /\bgold(preis)?\b/], ["Silber", "SI=F", /\bsilber\b/],
    ["Öl (Brent)", "BZ=F", /(öl|ölpreis|brent|rohöl)/], ["Euro/Dollar", "EURUSD=X", /(euro.*dollar|dollar.*euro|eurokurs|euro kurs|wechselkurs)/],
    ["Apple", "AAPL", /\bapple\b/], ["Tesla", "TSLA", /\btesla\b/], ["Nvidia", "NVDA", /n ?vidia/], ["Microsoft", "MSFT", /microsoft/], ["Amazon", "AMZN", /amazon/],
    ["Alphabet (Google)", "GOOGL", /google|alphabet/], ["Meta", "META", /\bmeta\b|facebook/], ["Netflix", "NFLX", /netflix/], ["SAP", "SAP.DE", /\bsap\b/],
    ["Siemens", "SIE.DE", /siemens/], ["Allianz", "ALV.DE", /allianz/], ["Volkswagen", "VOW3.DE", /volkswagen|\bvw\b/], ["BMW", "BMW.DE", /\bbmw\b/],
    ["Mercedes-Benz", "MBG.DE", /mercedes/], ["Deutsche Bank", "DBK.DE", /deutsche bank/], ["Rheinmetall", "RHM.DE", /rheinmetall/], ["Adidas", "ADS.DE", /adidas/],
    ["Deutsche Telekom", "DTE.DE", /telekom/], ["BASF", "BAS.DE", /\bbasf\b/], ["Bayer", "BAYN.DE", /\bbayer\b/], ["Porsche", "P911.DE", /porsche/],
    ["Lufthansa", "LHA.DE", /lufthansa/], ["Puma", "PUM.DE", /\bpuma\b/], ["Nike", "NKE", /\bnike\b/], ["Coca-Cola", "KO", /coca|cola/], ["AMD", "AMD", /\bamd\b/],
    ["Intel", "INTC", /\bintel\b/], ["Palantir", "PLTR", /palantir/], ["Infineon", "IFX.DE", /infineon/]
  ];
  function findAsset(t) {
    for (const [name, sym, re] of ASSETS) if (re.test(t)) return { name, symbol: sym };
    const m = t.match(/(?:wie steht|kurs von|kurs der|aktie von|aktie der|preis von)\s+(?:die |der |das )?([a-zäöüß0-9\- ]{2,30}?)(?:\s*-?aktie)?$/);
    if (m && !/^(börse|markt|aktien|dax)$/.test(m[1])) return { name: m[1].replace(/\b\w/g, c => c.toUpperCase()), query: m[1] };
    return null;
  }

  /** Grobe Ähnlichkeit, um das eigene Echo zu erkennen. */
  function overlap(a, b) {
    const A = new Set(words(a)), B = words(b); if (!B.length || !A.size) return 0;
    let hit = 0; for (const w of B) if (A.has(w)) hit++;
    return hit / B.length;
  }

  const api = { norm, parse, parseNumber, wordToNumber, findPlace, findAsset, durationIn, mathExpr, overlap, PLACES };
  root.MakhoNLU = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
