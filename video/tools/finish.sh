#!/usr/bin/env bash
# Final mastering pass: brick-wall limit + loudness normalise for social (≈ -11 LUFS, -1 dBTP).
# Video stream is copied untouched.  Usage: tools/finish.sh <in.mp4> <out.mp4>
set -euo pipefail
in="$1"; out="$2"
# trim audio to the exact video length (effect tails can run past the last frame)
dur=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$in")
ffmpeg -v error -y -i "$in" -t "$dur" -c:v copy \
  -af "alimiter=limit=0.8:attack=2:release=60:level=false,afade=t=out:st=$(echo "$dur - 0.25" | bc):d=0.25,loudnorm=I=-11:TP=-1.0:LRA=8,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart "$out"
ffmpeg -hide_banner -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" || true
