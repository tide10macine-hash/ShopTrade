# Was wäre, wenn das gesamte Eis der Erde schmelzen würde? – Kurzvideo

Vertikales Katastrophen-Short (9:16, 1080 × 1920, 30 fps, ~64 s, Deutsch), vollständig
prozedural erzeugt mit Python/NumPy (2.5D-Rendering), FFmpeg und Offline-Sprachsynthese.

**Ergebnis:** `eis_schmilzt_1080x1920.mp4` (H.264 + AAC)

## Aufbau

| Zeit | Szene |
|---|---|
| 0–4 s | Hook: Eisklippe bricht, Meer zieht sich vor einer Küstenstadt zurück, Erde aus dem All + Titel |
| 4–14 s | Schelfeis reißt und kalbt (Draufsicht), Eisblöcke unter Wasser, lokale Flutwelle an einer Küste |
| 14–25 s | Zeitraffer: Meeresspiegel steigt in der Küstenmetropole von +0 auf +70 m (HUD-Zähler) |
| 25–36 s | Separates Ereignis: Eisabbruch löst lokale Flutwelle aus → Stadt, Straße, Hafen, Straßenraster |
| 36–47 s | Aufstieg durch die Wolken, 3D-Globus: Küsten heute (cyan) vs. +70 m (orange), 4 Regionen im Wischvergleich |
| 47–56 s | Finale Montage, Höhepunkt, abrupte Stille |
| 56–64 s | Annäherung an dunkle Küste, Schlussfragen auf Schwarz |

## Wissenschaftliche Einordnung im Video
- +65–70 m nur durch **Landeis** (Antarktis ≈ 58 m, Grönland ≈ 7 m); Meereis: kaum direkter Anstieg.
- Anstieg als **Zeitraffer** über Jahrhunderte bis Jahrtausende gekennzeichnet.
- Flutwellen werden ausdrücklich als **separate, lokale Ereignisse** durch plötzliche Verdrängung gezeigt.
- Die +70-m-Küstenlinie ist **schematisch** (Schwellwert auf einer groben globalen Reliefkarte, nur mit dem Ozean
  verbundene Senken) – keine exakte Höhenmodell-Simulation.

## Quellen / Assets
- Erdtexturen (NASA Blue Marble, Nachtlichter, Topografie, Wolken, Sternhimmel) aus dem npm-Paket `three-globe`.
- Schriften: Cormorant Garamond, JetBrains Mono, Inter (Google Fonts, OFL) über `@expo-google-fonts`.
- Stimme: Piper TTS, Stimme „de_DE thorsten (low)“.

## Neu rendern
```bash
pip install numpy pillow scipy piper-tts
cd src
python3 render.py ../build/video_noaudio.mp4          # Bild (~20 min auf 4 Kernen)
python3 render.py ../build/sheet.png --step 30 --sheet # Kontaktabzug zur Kontrolle
python3 audio.py                                       # Sprecher + Sounddesign + Mischung (benötigt build/vo/n1..n7.wav)
ffmpeg -i ../build/video_noaudio.mp4 -i ../build/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest ../eis_schmilzt_1080x1920.mp4
```
Die Sprecherdateien `build/vo/n1.wav … n7.wav` entstehen mit
`echo "<Text>" | python3 -m piper -m de-thorsten-low.onnx --length-scale 0.92 -f nX.wav` (Texte in `src/render.py`, `VO`).
