# Makho

Persönlicher Sprachassistent für Android (Capacitor + eigenes Sprach-Plugin). Alles läuft per Stimme.

## Bedienung

- **„Hallo Makho“** weckt ihn. Er meldet sich und bietet die Nachrichten an.
- **„Ja“ / „Nein“** beantwortet seine Angebote. Erst nach „Ja“ wird etwas gezeigt.
- **„Stopp“** unterbricht ihn sofort, auch mitten im Satz.
- **„Gute Nacht“** legt ihn schlafen. Nach 5 Minuten Ruhe schläft er von selbst ein.

## Fähigkeiten

| Bereich | Beispiele |
|---|---|
| Nachrichten | „Was gibt es Neues?“, „Wie ist es in Frankreich?“, „Nachrichten über Fußball“, „Mehr zur zweiten Meldung“, „Weiter“ |
| Börse | „Was macht der Aktienmarkt?“, „Wie steht Apple?“, „Was kostet ein Bitcoin?“ |
| Wetter | „Wie wird das Wetter morgen?“, „Wetter in Hamburg“, „Brauche ich einen Schirm?“, „Meine Stadt ist Köln“ |
| Wissen | „Wer ist Albert Einstein?“, „Was ist ein schwarzes Loch?“, „Wie hoch ist der Mount Everest?“ |
| Alltag | „Timer auf 10 Minuten“, „Wie lange noch?“, „Was ist 15 Prozent von 80?“, „Wie spät ist es?“ |
| Notizen | „Merke dir, dass ich Milch kaufen muss“, „Was habe ich mir gemerkt?“ |
| Zahlen der Woche | „Zahlen der Woche“, „Setze den Umsatz auf 60.000“, „Neue Woche“ |
| Stimme | „Sprich langsamer“, „Sprich schneller“, „Andere Stimme“, „Tiefer sprechen“ |
| Sonstiges | „Gib mir ein Briefing“, „Was kannst du?“, „Wiederhole das“, „Zurück“, „Erzähl einen Witz“ |

| Schule | „Löse 2x plus 3 gleich 11“, „Formel für die Kreisfläche“, „Welches Symbol hat Gold?“, „Mach ein Quiz in Geschichte“ |
| Business | „Was ist EBITDA?“, „Was bedeutet Deckungsbeitrag?“, über 55 Begriffe offline |
| Umrechnen | „100 Euro in Dollar“, „5 Meilen in Kilometer“, „30 Grad Celsius in Fahrenheit“ |
| Übersetzen | „Was heißt Danke auf Spanisch?“ (liest in der Zielsprache vor) |
| Zeit | „Weck mich um 7 Uhr“, „Starte die Stoppuhr“, „Wie viele Tage bis Weihnachten?“, „Welche Kalenderwoche?“ |
| Persönlich | „Ich heiße …“, „Neues Gespräch“, „Einstellungen“ |

## KI-Gehirn (optional)

Mit einem eigenen Claude-API-Key (console.anthropic.com) beantwortet Makho jede Frage mit Claude Opus 5.5, nutzt die Websuche für Aktuelles und merkt sich den Gesprächsverlauf. Den Key einmalig unter „Einstellungen“ eintragen; er bleibt nur auf dem Gerät. Ohne Key nutzt Makho das eingebaute Wissen und Wikipedia.

Datenquellen ohne API-Schlüssel: tagesschau.de, Yahoo Finance, Open-Meteo, Wikipedia, Frankfurter (EZB-Kurse), MyMemory (Übersetzung).

Das Claude-SDK ist in `www/js/vendor/anthropic.js` gebündelt (`npx esbuild src/claude-entry.js --bundle --format=iife --minify --outfile=www/js/vendor/anthropic.js`).

## Entwicklung

- `www/js/nlu.js` Sprachverständnis, `sources.js` Datenquellen, `app.js` Ablauf, `views.js` Ansichten, `fx.js` Grafik, `voice.js` Sprachbrücke.
- `android/app/src/main/java/de/makho/assistant/MakhoPlugin.java` Spracherkennung (dauerhaft, mit Teilergebnissen) und Sprachausgabe (bevorzugt Google).
- Tests: `node test/nlu.test.mjs`, `node test/sources.probe.mjs` (braucht Internet), `node test/e2e.mjs` (Playwright, simuliertes Gespräch auf drei Bildschirmgrößen).
- Die APK baut GitHub Actions automatisch und legt sie als Release ab.
