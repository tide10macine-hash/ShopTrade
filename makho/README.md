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

Datenquellen ohne API-Schlüssel: tagesschau.de, Yahoo Finance, Open-Meteo, Wikipedia.

## Entwicklung

- `www/js/nlu.js` Sprachverständnis, `sources.js` Datenquellen, `app.js` Ablauf, `views.js` Ansichten, `fx.js` Grafik, `voice.js` Sprachbrücke.
- `android/app/src/main/java/de/makho/assistant/MakhoPlugin.java` Spracherkennung (dauerhaft, mit Teilergebnissen) und Sprachausgabe (bevorzugt Google).
- Tests: `node test/nlu.test.mjs`, `node test/sources.probe.mjs` (braucht Internet), `node test/e2e.mjs` (Playwright, simuliertes Gespräch auf drei Bildschirmgrößen).
- Die APK baut GitHub Actions automatisch und legt sie als Release ab.
