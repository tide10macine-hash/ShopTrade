# Makho

Persönlicher Sprachassistent für Android, gebaut mit Capacitor.

## Ablauf

1. Die App startet gesperrt, nur die Kugel ist zu sehen.
2. „Hallo Makho“ weckt ihn. Er meldet sich und fragt, ob er die Nachrichten zeigen soll.
3. Erst nach „Ja“ (oder einem direkten Befehl) erscheint der Inhalt. Danach bietet er das nächste Thema an:
   Welt → Deutschland → Russland → Börse → Zahlen der Woche.
4. „Gute Nacht“, „Tschüss“ oder „Pause“ legt ihn wieder schlafen.

Befehle zu jeder Zeit: „Nachrichten“, „Deutschland“, „Russland“, „Börse“, „Zahlen der Woche“, „Ja“, „Nein“, „Danke“.

## Daten

- Nachrichten live von tagesschau.de, Kurse live von Yahoo Finance.
- Ohne Internet zeigt Makho das eingebaute Lagebild vom 07.11.2026.
- Zahlen der Woche trägst du über das Zahnrad ein, sie bleiben auf dem Handy.

## Bauen

Die APK baut GitHub Actions automatisch (`.github/workflows/makho-android.yml`) und legt sie als Release ab.
Lokal mit Android SDK: `npm ci && npm run apk`.
