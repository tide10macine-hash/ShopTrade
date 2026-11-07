"""Cut the ElevenLabs voiceover into phrase clips and process them for the mix.

Chain per clip: high-pass 80 Hz -> gentle compression -> tempo x1.12 (pitch preserved)
-> 8 ms fades. Loudness is normalised once on the full take so phrases keep their
relative dynamics. Writes assets/audio/voice/vo-XX.wav and prints each clip's duration;
those durations are what src/voice.ts schedules.

Usage: python3 -I prepare_voice.py <voice.mp3> <out_dir> [phrases.json] [tempo]
  phrases.json: [[name, start, end, text], ...]; defaults to the 11.11 phrase list below.
"""
import json, os, subprocess, sys

SRC, OUT = sys.argv[1:3]
TEMPO = float(sys.argv[4]) if len(sys.argv) > 4 else 1.12
# phrase boundaries (seconds in the original take), from silence detection + recognition
PHRASES = [
    ("vo-01", 0.00, 2.70, "Eleven-eleven mega sale is here!"),
    ("vo-02", 2.90, 5.33, "The cheapest prices! More products"),
    ("vo-03", 5.64, 6.40, "less money!"),
    ("vo-04", 6.68, 7.90, "Fastest shipping!"),
    ("vo-05", 8.01, 9.66, "Your packages, faster!"),
    ("vo-06", 9.93, 12.98, "Up to eighty percent off, with exclusive coupons!"),
    ("vo-07", 12.98, 14.44, "Stack your savings!"),
    ("vo-08", 14.71, 15.66, "Why pay more?"),
    ("vo-09", 15.82, 17.49, "Shop smart with PikoBuy!"),
    ("vo-10", 17.73, 20.18, "The big shopping event. Don't miss out!"),
    ("vo-11", 20.39, 24.50, "PikoBuy eleven-eleven Mega Sale. Shop more, save more!"),
]
if len(sys.argv) > 3:
    PHRASES = [tuple(p) for p in json.load(open(sys.argv[3]))]
os.makedirs(OUT, exist_ok=True)
full = os.path.join(OUT, "_full.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-af",
                "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=2,"
                "loudnorm=I=-13:TP=-1.0:LRA=7", "-ar", "44100", "-ac", "2", full], check=True)
out = []
for name, a, b, text in PHRASES:
    dst = os.path.join(OUT, f"{name}.wav")
    d = b - a
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a}", "-t", f"{d}", "-i", full, "-af",
                    (f"atempo={TEMPO}," if TEMPO != 1 else "") + f"afade=t=in:d=0.008,areverse,afade=t=in:d=0.03,areverse",
                    "-ar", "44100", "-ac", "2", dst], check=True)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst],
                               capture_output=True, text=True).stdout)
    out.append({"clip": name, "dur": round(dur, 3), "text": text})
    print(f"{name}  {dur:5.2f}s  {text}")
os.remove(full)
with open(os.path.join(OUT, "clips.json"), "w") as f:
    json.dump(out, f, indent=2)
