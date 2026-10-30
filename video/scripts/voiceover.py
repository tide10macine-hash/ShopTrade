"""Generate the voiceover track with Kokoro (local neural TTS, no API key).

Usage:
  python scripts/voiceover.py <model_dir> [voice]

<model_dir> holds kokoro-v1.0.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Writes public/vo/voiceover.wav, a full-length track aligned to the timeline.
"""

import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "vo"
TOTAL_SECONDS = 25.0
MAX_SPEED = 1.25

# Spoken-only respellings. Kokoro reads "Pikobuy" as "PICK-uh-buy".
PRONUNCIATIONS = {"Pikobuy": "Peekoh-buy"}

# (start_s, must_end_by_s, speed, text). Lines mirror the on-screen copy in src/copy.ts.
LINES = [
    (0.25, 2.9, 1.0, "Wait... you're still paying full price for shipping?"),
    (3.3, 8.8, 1.0, "Ordering from China? Between air freight, customs, and delivery, shipping adds up fast."),
    (9.35, 13.8, 1.0, "Meet Pikobuy. Your shopping agent for China. You order, they buy, it ships to you."),
    (14.35, 20.8, 1.0, "New here? Sign up through my link, and get two forty-percent-off shipping coupons."),
    (21.25, 24.6, 1.0, "Don't miss out. First link in my bio."),
]


def trim_silence(audio: np.ndarray, threshold: float = 0.01) -> np.ndarray:
    voiced = np.flatnonzero(np.abs(audio) > threshold)
    return audio if voiced.size == 0 else audio[voiced[0] : voiced[-1] + 1]


def spoken(text: str) -> str:
    for written, said in PRONUNCIATIONS.items():
        text = text.replace(written, said)
    return text


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
    voice = sys.argv[2] if len(sys.argv) > 2 else "af_heart"
    kokoro = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))

    sr = 24000
    track = np.zeros(int(TOTAL_SECONDS * sr), dtype=np.float32)
    ok = True
    for start, end, speed, text in LINES:
        audio, sr, used_speed = synth_fitted(kokoro, voice, text, speed, end - start)
        length = len(audio) / sr
        fits = start + length <= end
        ok &= fits
        print(f"{start:5.2f}s  {length:4.2f}s  x{used_speed:.2f}  {'ok ' if fits else 'OVER'}  {text}")
        begin = int(start * sr)
        track[begin : begin + len(audio)] += audio[: len(track) - begin]

    OUT.mkdir(parents=True, exist_ok=True)
    raw = OUT / "voiceover.raw.wav"
    sf.write(raw, track, sr)
    # Broadcast-style loudness so the voice sits clearly above the music bed.
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100",
         str(OUT / "voiceover.wav")],
        check=True,
    )
    raw.unlink()
    print(f"wrote {OUT / 'voiceover.wav'}  voice={voice}")
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
