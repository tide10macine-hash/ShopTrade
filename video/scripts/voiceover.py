"""Generate voiceover tracks with Kokoro (local neural TTS, no API key).

Usage:
  python scripts/voiceover.py <model_dir> [script] [voice] [out_path]

<model_dir> holds kokoro-v1.0.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
[script] is a key of SCRIPTS (default "pikobuy"). Writes a full-length track
aligned to that composition's timeline into public/vo/.
"""

import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "vo"
MAX_SPEED = 1.25

# Spoken-only respellings so Kokoro says the brand names clearly.
PRONUNCIATIONS = {"Pikobuy": "Peekoh-buy", "Hipobuy": "Hippo-buy", "Litbuy": "Litt-buy"}


@dataclass(frozen=True)
class Script:
    seconds: float
    voice: str
    speed: float
    file: str
    # (start_s, must_end_by_s, text). Lines mirror the on-screen copy.
    lines: tuple[tuple[float, float, str], ...]


SCRIPTS = {
    "pikobuy": Script(
        seconds=25.0,
        voice="am_michael",
        speed=1.0,
        file="voiceover.wav",
        lines=(
            (0.25, 2.9, "Wait... you're still paying full price for shipping?"),
            (3.3, 8.8, "Ordering from China? Between air freight, customs, and delivery, shipping adds up fast."),
            (9.25, 13.9, "Meet Pikobuy. Your shopping agent for China. You order, they ship it to you."),
            (14.35, 20.8, "New here? Sign up through my link, and get two forty-percent-off shipping coupons."),
            (21.25, 24.6, "Don't miss out. First link in my bio."),
        ),
    ),
    # Scene starts (s): 0, 3, 6.5, 10, 13, 16, 21, 26.5. Mirrors src/tips/timeline.ts.
    "tips": Script(
        seconds=30.0,
        voice="am_puck",
        speed=1.1,
        file="tips.wav",
        lines=(
            (0.1, 2.95, "Stop overpaying for shipping! Here are five ways to save."),
            (3.15, 6.4, "One: vacuum-bag your clothes to cut parcel volume."),
            (6.65, 9.9, "Two: remove extra boxes and packaging you don't need."),
            (10.15, 12.9, "Three: compare tax-free lines for your destination."),
            (13.15, 15.9, "Four: always use your shipping coupons."),
            (16.15, 20.9, "Five: use rehearsal, so you know your real packed size and weight before you ship."),
            (21.15, 26.4, "Pikobuy shipping is advertised from forty dollars for five kilos. Check current rates."),
            (26.65, 29.4, "Save on your next haul. First link in my bio!"),
        ),
    ),
    # Scene starts (s): 0, 6, 15.5, 22, 30.5, 34. Mirrors src/compare/timeline.ts.
    # Normal speed with separate price sentences so the names are never rushed.
    "compare": Script(
        seconds=39.0,
        voice="am_puck",
        speed=1.0,
        file="compare.wav",
        lines=(
            (0.15, 5.9, "Cheapest agent of 2026? Let's compare, Pikobuy, Hipobuy, and Litbuy."),
            (6.15, 10.4, "For a five kilo parcel, Pikobuy charges forty-two dollars."),
            (10.65, 12.9, "Hipobuy charges sixty-four dollars."),
            (13.1, 15.4, "And Litbuy charges seventy-two dollars."),
            (15.65, 21.9, "Warehouse arrival: one to three days with Pikobuy, versus three to five with Hipobuy and Litbuy."),
            (22.15, 28.2, "In this example, the same two-hundred-dollar item costs two hundred and twenty dollars on Litbuy."),
            (28.3, 30.45, "But on Pikobuy, it stays at two hundred."),
            (30.65, 33.9, "On these figures, Pikobuy stands out for price and speed."),
            (34.15, 38.7, "Check current rates for your destination, and find the first link in my bio!"),
        ),
    ),
}


def spoken(text: str) -> str:
    for written, said in PRONUNCIATIONS.items():
        text = text.replace(written, said)
    return text


def trim_silence(audio: np.ndarray, threshold: float = 0.01) -> np.ndarray:
    voiced = np.flatnonzero(np.abs(audio) > threshold)
    return audio if voiced.size == 0 else audio[voiced[0] : voiced[-1] + 1]


def synth_fitted(kokoro: Kokoro, voice: str, text: str, speed: float, budget: float) -> tuple[np.ndarray, int, float]:
    text = spoken(text)
    audio, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
    audio = trim_silence(audio)
    # Kokoro's speed isn't linear in duration, so refine a few times.
    for _ in range(4):
        length = len(audio) / sr
        if length <= budget or speed >= MAX_SPEED:
            break
        speed = min(MAX_SPEED, speed * length / budget * 1.03)
        audio, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        audio = trim_silence(audio)
    return audio, sr, speed


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    model_dir = Path(sys.argv[1])
    script = SCRIPTS[sys.argv[2] if len(sys.argv) > 2 else "pikobuy"]
    voice = sys.argv[3] if len(sys.argv) > 3 else script.voice
    target = Path(sys.argv[4]) if len(sys.argv) > 4 else OUT / script.file
    kokoro = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))

    sr = 24000
    track = np.zeros(int(script.seconds * sr), dtype=np.float32)
    ok = True
    for start, end, text in script.lines:
        audio, sr, used_speed = synth_fitted(kokoro, voice, text, script.speed, end - start)
        length = len(audio) / sr
        fits = start + length <= end
        ok &= fits
        print(f"{start:5.2f}s  {length:4.2f}s  x{used_speed:.2f}  {'ok ' if fits else 'OVER'}  {text}")
        begin = int(start * sr)
        track[begin : begin + len(audio)] += audio[: len(track) - begin]

    OUT.mkdir(parents=True, exist_ok=True)
    raw = target.with_suffix(".raw.wav")
    sf.write(raw, track, sr)
    # Broadcast-style loudness so the voice sits clearly above the music bed.
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100",
         str(target)],
        check=True,
    )
    raw.unlink()
    print(f"wrote {target}  voice={voice}")
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
