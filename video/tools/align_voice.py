"""Word timings for a voiceover recorded outside the API (no timestamps).
1) speech segments from silence detection; script split into phrases at . : ! ?
   (phrases are merged/split greedily so the counts match);
2) inside each segment, words recognised by pocketsphinx at matching spelling become anchors;
3) the other words are spread between anchors by character length.
Usage: python3 -I align_voice.py <voice.mp3> <script.json> <out_words.json>"""
import json, re, subprocess, sys
import numpy as np
from pocketsphinx import Decoder

mp3, script, out = sys.argv[1:4]
text = json.load(open(script))["text"]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3], capture_output=True, text=True).stdout)
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", mp3, "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
ss = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
se = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
segs, cur = [], 0.0
for a, b in zip(ss, se):
    if a - cur > 0.05: segs.append([cur, a])
    cur = b
if dur - cur > 0.1: segs.append([cur, dur])

words = text.split()
phrases, p = [], []
for i, w in enumerate(words):
    p.append(i)
    if re.search(r"[.:!?]$", w): phrases.append(p); p = []
if p: phrases.append(p)
# match counts: merge the shortest adjacent phrases / segments
while len(phrases) > len(segs):
    k = min(range(len(phrases) - 1), key=lambda j: len(phrases[j]) + len(phrases[j + 1])); phrases[k:k + 2] = [phrases[k] + phrases[k + 1]]
while len(segs) > len(phrases):
    k = min(range(len(segs) - 1), key=lambda j: segs[j + 1][0] - segs[j][1]); segs[k:k + 2] = [[segs[k][0], segs[k + 1][1]]]
print("segments", len(segs), "phrases", len(phrases))

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, "-ar", "16000", "-ac", "1", "-f", "s16le", "-"], capture_output=True).stdout
pcm = np.frombuffer(raw, dtype=np.int16)
dec = Decoder()
norm = lambda w: re.sub(r"[^a-z]", "", w.lower())
res = []
for (a, b), ph in zip(segs, phrases):
    dec.start_utt(); dec.process_raw(pcm[int(a * 16000):int(b * 16000)].tobytes(), full_utt=True); dec.end_utt()
    rec = [(re.sub(r"\(\d\)", "", s.word), a + s.start_frame / 100) for s in dec.seg() if s.word not in ("<s>", "</s>", "<sil>", "[NOISE]")]
    anchors, r = {}, 0
    for i in ph:
        for k in range(r, len(rec)):
            if norm(rec[k][0]) == norm(words[i]) and len(norm(words[i])) > 1:
                anchors[i] = rec[k][1]; r = k + 1; break
    pts = [(ph[0], a)] + sorted((i, t) for i, t in anchors.items() if i != ph[0]) + [(ph[-1] + 1, b)]
    for (i0, t0), (i1, t1) in zip(pts, pts[1:]):
        span = list(range(i0, i1))
        L = [len(norm(words[i])) + 2 for i in span]
        tot = sum(L) or 1
        t = t0
        for i, l in zip(span, L):
            d = (t1 - t0) * l / tot
            res.append({"w": words[i], "start": round(t, 3), "end": round(t + d * 0.9, 3)})
            t += d
json.dump(res, open(out, "w"))
print(len(res), "words, last ends", res[-1]["end"])
