#!/usr/bin/env bash
# Renders the audio mix on its own, masters it (loudness -14 LUFS, true peak -1 dBTP — social platform targets)
# and muxes it onto the rendered video without re-encoding the picture.
#   usage: tools/master_audio.sh out/PIKOBUY_11.11_MEGA_SALE.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
VID=${1:-out/PIKOBUY_11.11_MEGA_SALE.mp4}
HS=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
BROWSER=(); [ -x "$HS" ] && BROWSER=(--browser-executable="$HS")
npx remotion render src/index.ts Pikobuy1111 out/mix.wav --codec wav "${BROWSER[@]}" --log error
ffmpeg -v error -y -i out/mix.wav -af "loudnorm=I=-14:TP=-2:LRA=7,alimiter=limit=0.63:attack=1:release=40:level=false,aresample=192000,alimiter=limit=0.63:level=false,aresample=48000" -ar 48000 out/mix_mastered.wav
ffmpeg -v error -y -i "$VID" -i out/mix_mastered.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart "${VID%.mp4}.tmp.mp4"
mv "${VID%.mp4}.tmp.mp4" "$VID"
rm -f out/mix.wav out/mix_mastered.wav
echo "mastered audio -> $VID"
