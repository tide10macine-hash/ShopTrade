"""Write an estimated words.json (Liam-like pace) for a script, so a video can be built before
the real voiceover exists. Replace it with real timings (generate_tips_voice.mjs or align_voice.py).
Usage: python3 -I estimate_words.py <script.json> <out_words.json>"""
import json, re, sys
text = json.load(open(sys.argv[1]))["text"]
t, out = 0.05, []
for w in text.split():
    core = re.sub(r"[^\w'-]", "", w)
    d = 0.11 + 0.055 * len(core)
    out.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
    t += d + 0.04
    if re.search(r"[.!?]$", w): t += 0.45
    elif re.search(r"[,:]$", w): t += 0.22
json.dump(out, open(sys.argv[2], "w"))
print(len(out), "words, est.", round(out[-1]["end"], 2), "s")
