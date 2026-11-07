import { createRequire } from "module"; const require = createRequire(import.meta.url);
const N = require("../www/js/nlu.js");
const A = { awake: true };
const cases = [
  ["Hallo Makho", {awake:false}, "wake"], ["hallo Macho", {awake:false}, "wake"], ["Hey Marco", {awake:false}, "wake"], ["hallomacho", {awake:false}, "wake"],
  ["Wie spät ist es", {awake:false}, "none"], ["Stopp", {awake:false}, "stop"],
  ["Stopp", A, "stop"], ["stop stop", A, "stop"], ["hör auf", A, "stop"], ["Makho stopp", A, "stop"], ["okay stopp bitte", A, "stop"], ["sei still", A, "stop"], ["Halt", A, "stop"],
  ["Ja", {awake:true,pending:"world"}, "yes"], ["ja gerne", {awake:true,pending:"world"}, "yes"], ["Nein danke", {awake:true,pending:"world"}, "no"], ["jetzt nicht", {awake:true,pending:"world"}, "no"],
  ["Mach mir mal bitte die Nachrichten an", A, "news"], ["Was gibt es Neues", A, "news"], ["Wie ist es in Deutschland", A, "news"], ["Geh mal noch mal nach Russland bitte", A, "news"],
  ["Was ist in China los", A, "news"], ["Nachrichten über Fußball", A, "news"], ["Frankreich", A, "news"],
  ["Was macht der Aktienmarkt", A, "markets"], ["Wie steht der DAX", A, "markets.asset"], ["Wie steht Apple", A, "markets.asset"], ["Was kostet ein Bitcoin", A, "markets.asset"], ["Wie steht die Rheinmetall Aktie", A, "markets.asset"],
  ["Gib mir jetzt noch mal die Zahlen der Woche bitte", A, "kpi.show"], ["Setze den Umsatz auf 60000", A, "kpi.set"], ["Reichweite 2,5 Millionen", A, "kpi.set"], ["Newsletter auf viertausend", A, "kpi.set"],
  ["Wie wird das Wetter morgen in Hamburg", A, "weather"], ["Wie ist das Wetter", A, "weather"], ["Brauche ich einen Regenschirm", A, "weather"], ["Meine Stadt ist Köln", A, "city.set"],
  ["Stell einen Timer auf 5 Minuten", A, "timer.set"], ["Timer für 1 Stunde und 30 Minuten", A, "timer.set"], ["Wecker in zehn Minuten", A, "timer.set"], ["Wie lange läuft der Timer noch", A, "timer.status"], ["Timer stoppen", A, "timer.cancel"],
  ["Wie spät ist es", A, "time"], ["Welcher Tag ist heute", A, "date"],
  ["Was ist 12 mal 7", A, "calc"], ["Wie viel ist 15 Prozent von 80", A, "calc"], ["Wurzel aus 144", A, "calc"], ["was ist 100 geteilt durch 8", A, "calc"],
  ["Wer ist Angela Merkel", A, "wiki"], ["Was ist ein schwarzes Loch", A, "wiki"], ["Erzähl mir etwas über den Mond", A, "wiki"], ["Wie hoch ist der Mount Everest", A, "wiki"], ["Wann wurde Berlin gegründet", A, "wiki"],
  ["Merke dir dass ich morgen Milch kaufen muss", A, "note.add"], ["Was habe ich mir gemerkt", A, "note.list"], ["Lösche meine Notizen", A, "note.clear"],
  ["Erzähl mehr", A, "news.more"], ["Mehr zur zweiten Meldung", A, "news.more"], ["Weiter", A, "news.next"],
  ["Was kannst du", A, "help"], ["Wiederhole das", A, "repeat"], ["Zurück", A, "close"], ["Sprich langsamer", A, "voice.rate"], ["Andere Stimme", A, "voice.next"],
  ["Erzähl einen Witz", A, "joke"], ["Wirf eine Münze", A, "coin"], ["Zufallszahl zwischen 1 und 100", A, "random"],
  ["Gute Nacht", A, "sleep"], ["Tschüss Makho", A, "sleep"], ["Danke", A, "thanks"], ["Okay danke", A, "thanks"], ["Wie geht es dir", A, "howareyou"], ["Wer bist du", A, "whoami"],
  ["Ich heiße Junas", A, "name.set"], ["Wie heiße ich", A, "name.get"], ["Öffne die Einstellungen", A, "settings"],
  ["Starte die Stoppuhr", A, "sw.start"], ["Stoppuhr stopp", A, "sw.stop"], ["Weck mich um 7 Uhr 30", A, "alarm.at"], ["Stell den Wecker um 6:45", A, "alarm.at"],
  ["Wie viele Tage bis Weihnachten", A, "days.until"], ["Welcher Wochentag war der 1.1.2000", A, "weekday.of"], ["Welche Kalenderwoche haben wir", A, "kw"],
  ["Wie viel sind 5 Meilen in Kilometer", A, "convert"], ["100 Euro in Dollar", A, "convert"], ["Was sind 30 Grad Celsius in Fahrenheit", A, "convert"], ["Wie viel ist ein Dollar in Euro", A, "convert"],
  ["Was heißt Schmetterling auf Englisch", A, "translate"], ["Übersetze guten Morgen ins Spanische", A, "translate"],
  ["Löse 2x plus 3 gleich 11", A, "equation"], ["Welches Symbol hat Gold", A, "element"], ["Welches Element hat die Ordnungszahl 26", A, "element"], ["Wie lautet die Formel für die Kreisfläche", A, "formula"],
  ["Mach ein Quiz", A, "quiz.start"], ["Frag mich in Geschichte ab", A, "quiz.start"], ["1989", {awake:true,quiz:true}, "quiz.answer"], ["Keine Ahnung", {awake:true,quiz:true}, "quiz.skip"], ["Quiz beenden", {awake:true,quiz:true}, "quiz.end"],
  ["Erzähl mir einen Fakt", A, "fact"], ["Motivier mich", A, "quote"], ["Neues Gespräch", A, "brain.reset"],
  ["Gib mir ein Briefing", A, "briefing"], ["Guten Morgen", A, "greet"], ["blablub", A, "unknown"]
];
let fail = 0;
for (const [text, ctx, want] of cases) { const r = N.parse(text, ctx); if (r.intent !== want) { fail++; console.log("FAIL", JSON.stringify(text), "->", r.intent, "erwartet", want); } }
const ex = [["Setze den Umsatz auf 60000", 60000], ["Reichweite 2,5 Millionen", 2.5e6], ["Newsletter auf viertausend", 4000]];
for (const [t, v] of ex) { const r = N.parse(t, A); if (r.value !== v) { fail++; console.log("FAIL Wert", t, r.value); } }
const calc = [["Was ist 12 mal 7", 84], ["Wie viel ist 15 Prozent von 80", 12], ["Wurzel aus 144", 12], ["was ist 100 geteilt durch 8", 12.5]];
for (const [t, v] of calc) { const r = N.parse(t, A); const got = Function("return " + r.expr)(); if (Math.abs(got - v) > 1e-9) { fail++; console.log("FAIL Rechnung", t, r.expr, got); } }
const tm = [["Stell einen Timer auf 5 Minuten", 300], ["Timer für 1 Stunde und 30 Minuten", 5400], ["Wecker in zehn Minuten", 600]];
for (const [t, v] of tm) { const r = N.parse(t, A); if (r.seconds !== v) { fail++; console.log("FAIL Timer", t, r.seconds); } }
const w = N.parse("Wie wird das Wetter morgen in Hamburg", A); if (w.city !== "hamburg" || w.day !== 1) { fail++; console.log("FAIL Wetter", w); }
const pl = N.parse("Geh mal noch mal nach Russland bitte", A); if (!pl.place || pl.place.name !== "Russland") { fail++; console.log("FAIL Ort", pl); }
const cv = N.parse("Wie viel sind 5 Meilen in Kilometer", A); if (cv.value !== 5 || cv.from !== "meilen" || cv.to !== "kilometer") { fail++; console.log("FAIL Umrechnung", cv); }
const tr = N.parse("Was heißt Schmetterling auf Englisch", A); if (tr.text !== "schmetterling" || tr.lang !== "englisch") { fail++; console.log("FAIL Übersetzung", tr); }
const al = N.parse("Weck mich um 7 Uhr 30", A); if (al.h !== 7 || al.m !== 30) { fail++; console.log("FAIL Wecker", al); }
console.log(`${cases.length + 16 - fail}/${cases.length + 16} bestanden`); process.exit(fail ? 1 : 0);
