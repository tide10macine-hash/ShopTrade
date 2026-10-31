"""Rendert das komplette Video (Bild) als H.264 über eine FFmpeg-Pipe.
Aufruf: python3 render.py [out.mp4] [--from S] [--to S] [--step N] [--sheet]"""
import math
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np

import shots_city as SC
import shots_ice as SI
import shots_space as SS
from lib import FPS, H, W, Overlay, affine, bloom, clamp, font, fstep, glitch, grade, shake_offsets, wrap_lines

# ------------------------------------------------------------------ Timeline
TL = [
    (0.00, 1.55, SI.shot_icecliff, {}),
    (1.55, 2.75, SC.shot_recede, {}),
    (2.75, 4.10, SS.shot_earth_title, {}),
    (4.10, 7.70, SI.shot_shelf, {}),
    (7.70, 10.60, SI.shot_underwater, {}),
    (10.60, 14.00, SI.shot_coast, {}),
    (14.00, 25.30, SC.shot_city_flood, {}),
    (25.30, 27.80, SI.shot_coast, dict(src=(330, 520), speed=650, start=0.9, seed=1, trigger=(330, 520, 0.9), zoom=(1.05, 1.2))),
    (27.80, 29.80, SC.shot_wave_city, {}),
    (29.80, 31.60, SC.shot_street, {}),
    (31.60, 33.60, SC.shot_harbor, {}),
    (33.60, 36.20, SC.shot_topdown, {}),
    (36.20, 38.60, SS.shot_rise, {}),
    (38.60, 47.20, SS.shot_globe_compare, {}),
    (47.20, 48.90, SS.shot_space_city, {}),
    (48.90, 50.60, SC.shot_icebergs, {}),
    (50.60, 52.30, SC.shot_road, {}),
    (52.30, 53.95, SC.shot_harbor, dict(late=True)),
    (53.95, 55.60, SS.shot_globe_global, {}),
    (55.60, 55.95, None, {}),
    (55.95, 58.60, SS.shot_earth_approach, {}),
    (58.60, 64.40, None, {}),
]
TOTAL = 64.40
NFRAMES = int(round(TOTAL * FPS))

VO = [  # (start, dauer, text)
    (0.35, 2.98, "Was wäre, wenn das gesamte Eis der Erde schmelzen würde?"),
    (4.40, 8.20, "Gigantische Eismassen würden verschwinden. Ganze Gletscher könnten abbrechen. Und gewaltige Eisabbrüche könnten lokal gefährliche Flutwellen auslösen."),
    (14.10, 10.45, "Der Meeresspiegel würde langfristig um rund 65 bis 70 Meter steigen. Küstenstädte könnten gewaltige Teile ihres Landes verlieren. Ganze Stadtviertel würden dauerhaft im Meer verschwinden."),
    (25.60, 6.40, "Und wenn gewaltige Eisabbrüche oder Erdrutsche das Meer plötzlich verdrängen, können lokal sogar gefährliche Flutwellen entstehen."),
    (37.60, 7.91, "Und das ist keine Veränderung, die über Nacht passiert. Es wäre eine langfristige Transformation der gesamten Küstengeografie unseres Planeten."),
    (47.50, 6.73, "Unsere Welt würde völlig anders aussehen. Und viele der Orte, die wir heute unser Zuhause nennen, könnten für immer verschwinden."),
    (60.90, 3.07, "Was würdest du tun? Schreib deine Antwort in die Kommentare."),
]

CUTS_FLASH = [1.55, 2.75, 4.10, 7.70, 10.60, 25.30, 27.80, 29.80, 31.60, 33.60, 47.20, 48.90, 50.60, 52.30, 53.95]
IMPACTS = [0.55, 1.05, 2.75, 26.2, 29.35, 31.45, 38.6, 47.2]
GLITCH = [0.20, 2.75, 14.0, 25.30, 31.45, 47.20, 50.60, 53.95, 55.55]


def captions():
    """Teilt die Sprechertexte in kurze Untertitel-Häppchen (zeitlich nach Zeichenanzahl)."""
    out = []
    for st, du, txt in VO:
        parts, cur = [], ""
        for w in txt.split():
            cur = (cur + " " + w).strip()
            if (len(cur) > 26 and w[-1] in ",.?") or len(cur) > 38:
                parts.append(cur)
                cur = ""
        if cur:
            parts.append(cur)
        tot = sum(len(p) for p in parts)
        t = st
        for p in parts:
            d = du * len(p) / tot
            out.append((t, t + d, p))
            t += d
    return out


CAPS = captions()


def shake_amp(t):
    a = 1.5
    if t < 1.55:
        a = 5 + 20 * fstep(0.5, 0.6, t) * (1 - fstep(1.3, 1.55, t) * 0.5)
    elif t < 2.75:
        a = 5
    elif 10.6 <= t < 14:
        a = 3 + 6 * fstep(11.5, 13, t)
    elif 25.3 <= t < 36.2:
        a = 9
        if 29.8 <= t < 31.6:
            a = 10 + 30 * fstep(30.6, 31.45, t)
    elif 47.2 <= t < 55.6:
        a = 8
    elif 38.6 <= t < 47.2 or 55.95 <= t:
        a = 0.6
    for it in IMPACTS:
        if 0 <= t - it < 0.5:
            a += 26 * math.exp(-(t - it) * 7)
    return a


# ------------------------------------------------------------------ Texte
ICE = (160, 215, 255)
ORANGE = (255, 170, 90)
GREY = (190, 198, 210)


def hud(ov, label, value, sub=None, alpha=1.0, extra=None):
    ov.text((72, 205), label, font("mono", 26), alpha * 0.85, GREY, tracking=4)
    ov.text((68, 290), value, font("serif", 84), alpha)
    if sub:
        ov.text((72, 336), sub, font("mono_reg", 21), alpha * 0.75, GREY, tracking=2)
    if extra:
        ov.text((72, 385), extra[0], font("mono", 24), alpha * extra[1], ORANGE, tracking=3)


FLOOD_EVENTS = [(0.6, "STRÄNDE VERSCHWINDEN"), (3.2, "HAFENANLAGEN ÜBERFLUTET"), (9.5, "STRASSEN & UNTERFÜHRUNGEN LAUFEN VOLL"),
                (16.0, "BRÜCKEN & KÜSTENSTRASSEN UNPASSIERBAR"), (24.5, "TIEFE STADTVIERTEL VERSINKEN"), (55.0, "KÜSTENLINIE DAUERHAFT VERSCHOBEN")]


def overlays(t, ov):
    # Titel
    if 0.2 <= t < 4.1:
        a = fstep(0.2, 0.35, t) * (1 - fstep(3.8, 4.1, t))
        jit = 0
        if t < 0.5:
            jit = int(10 * math.sin(t * 90))
        f = font("serif", 74)
        ov.text_c(400 + jit, "", f, a, spans=[("WAS, WENN DAS GESAMTE", (255, 255, 255))])
        ov.text_c(500 - jit, "", f, a, spans=[("EIS", ICE), (" DER ERDE", (255, 255, 255))])
        ov.text_c(600 + jit, "SCHMILZT?", f, a)
    # HUD
    if 4.1 <= t < 10.6:
        a = fstep(4.1, 4.4, t) * (1 - fstep(10.3, 10.6, t))
        hud(ov, "IM LANDEIS GESPEICHERT", "≈ 65 m", "ANTARKTIS ≈ 58 m · GRÖNLAND ≈ 7 m · GLETSCHER < 1 m", a)
    elif 10.6 <= t < 14.0:
        a = fstep(10.6, 10.9, t) * (1 - fstep(13.75, 14.0, t))
        hud(ov, "LOKALES EREIGNIS", "FLUTWELLE", "AUSLÖSER: GLETSCHERABBRUCH INS MEER", a)
    elif 14.0 <= t < 25.3:
        u = (t - 14.0) / 11.3
        Hm = SC.flood_level(u)
        a = fstep(14.0, 14.3, t) * (1 - fstep(25.05, 25.3, t))
        ev = None
        for thr, txt in FLOOD_EVENTS:
            if Hm >= thr:
                ev = txt
        hud(ov, "MEERESSPIEGEL", f"+{Hm:4.1f} m".replace(".", ","), "ZEITRAFFER · ÜBER JAHRHUNDERTE BIS JAHRTAUSENDE", a,
            extra=("▲ " + ev, 1.0) if ev else None)
    elif 25.3 <= t < 36.2:
        a = fstep(25.3, 25.6, t) * (1 - fstep(35.9, 36.2, t))
        hud(ov, "SEPARATES EREIGNIS", "LOKALE FLUTWELLE", "PLÖTZLICHE VERDRÄNGUNG – NICHT DIE SCHMELZE SELBST", a)
    elif 38.6 <= t < 42.6:
        a = fstep(38.7, 39.0, t) * (1 - fstep(42.3, 42.6, t))
        f = font("serif", 92)
        ov.text_c(330, "+65 BIS 70 METER", f, a)
        ov.text_c(425, "MEERESSPIEGEL", f, a)
        ov.text_c(492, "BEI VOLLSTÄNDIGEM VERLUST DES LANDEISES", font("mono", 24), a * 0.8, GREY, tracking=3)
        ov.text_c(530, "MEEREIS ALLEIN: KAUM DIREKTER ANSTIEG", font("mono", 24), a * 0.8, GREY, tracking=3)
        fm = font("mono", 26)
        ov.rect((250, 1418, 290, 1424), (140, 210, 255), a)
        ov.text((305, 1431), "KÜSTE HEUTE", fm, a, (190, 225, 255), tracking=3)
        ov.rect((250, 1468, 290, 1474), (255, 150, 70), a * fstep(39.5, 41.2, t))
        ov.text((305, 1481), "+70 m (SCHEMATISCH)", fm, a * fstep(39.5, 41.2, t), ORANGE, tracking=3)
    elif 42.6 <= t < 47.2:
        r = SS.region_at(t - 38.6)
        if r:
            name, wipe, f = r
            a = fstep(0.0, 0.1, f) * (1 - fstep(0.92, 1.0, f))
            ov.text_c(300, name, font("mono", 34), a, tracking=5)
            fm = font("mono", 30)
            if wipe > 140:
                ov.text((max(40, wipe - 175), 1060), "+70 m", fm, a, ORANGE, tracking=3)
            if wipe < W - 170:
                ov.text((min(W - 160, wipe + 30), 1060), "HEUTE", fm, a, (190, 225, 255), tracking=3)
    # Endkarten
    if 58.6 <= t:
        f = font("serif", 58)
        a1 = fstep(58.8, 59.3, t) * (1 - fstep(60.2, 60.5, t))
        if a1 > 0:
            ov.text_c(900, "STELL DIR VOR,", f, a1)
            ov.text_c(990, "DEINE STADT LIEGT AM MEER …", f, a1)
        a2 = fstep(60.6, 61.0, t)
        if a2 > 0:
            f2 = font("serif", 82)
            ov.text_c(910, "WÜRDEST DU BLEIBEN", f2, a2)
            ov.text_c(1025, "ODER FLIEHEN?", f2, a2, spans=[("ODER ", (255, 255, 255)), ("FLIEHEN?", ICE)])
    # Untertitel
    for s0, s1, txt in CAPS:
        if s0 <= t < s1 and t < 58.6:
            a = fstep(s0, s0 + 0.08, t) * (1 - fstep(s1 - 0.05, s1, t))
            f = font("serif_it", 54)
            lines = wrap_lines(txt, f, 900)
            y0 = 1640 - 32 * (len(lines) - 1)
            for k, ln in enumerate(lines):
                ov.text_c(y0 + 64 * k, ln, f, a)


# ------------------------------------------------------------------ Frame
def render_frame(fi):
    t = fi / FPS
    shot = None
    for s0, s1, fn, kw in TL:
        if s0 <= t < s1:
            shot = (s0, s1, fn, kw)
            break
    if shot is None or shot[2] is None:
        img = np.zeros((H, W, 3), np.float32)
        black = True
    else:
        s0, s1, fn, kw = shot
        img = fn(t - s0, s1 - s0, fi, **kw)
        black = False
        img = bloom(img, 0.5, 0.55)
        amp = shake_amp(t)
        dx, dy, rot = shake_offsets(t, amp, seed=int(s0 * 10))
        img = affine(img, zoom=1.0 + amp * 0.0012 + 0.01, dx=dx, dy=dy, rot=rot)
        # Weißblitz an Schnitten/Einschlägen
        fl = 0.0
        for c in CUTS_FLASH + IMPACTS:
            if 0 <= t - c < 0.2:
                fl = max(fl, math.exp(-(t - c) * 22))
        img = img + fl * 0.9
        # Einblendung aus Schwarz am Anfang der Annäherung
        if 55.95 <= t < 56.6:
            img = img * fstep(55.95, 56.6, t)
        if 58.3 <= t < 58.6:
            img = img * (1 - fstep(58.3, 58.6, t))
    g = 0.0
    for c in GLITCH:
        if 0 <= t - c < 0.1:
            g = 0.9
    img = grade(img, fi, ca=1.3, grain=0.028 if not black else 0.018)
    if g > 0 and not black:
        img = glitch(img, fi, g)
    ov = Overlay()
    overlays(t, ov)
    img = ov.apply(img)
    return (clamp(img) * 255 + 0.5).astype(np.uint8).tobytes()


def main():
    args = sys.argv[1:]
    out = args[0] if args and not args[0].startswith("--") else os.path.join(os.path.dirname(__file__), "..", "build", "video_noaudio.mp4")
    t0 = float(args[args.index("--from") + 1]) if "--from" in args else 0.0
    t1 = float(args[args.index("--to") + 1]) if "--to" in args else TOTAL
    step = int(args[args.index("--step") + 1]) if "--step" in args else 1
    frames = list(range(int(round(t0 * FPS)), min(NFRAMES, int(round(t1 * FPS))), step))
    if "--sheet" in args:
        from PIL import Image
        with Pool(4) as p:
            res = p.map(render_frame, frames, chunksize=1)
        ims = [Image.frombytes("RGB", (W, H), r).resize((216, 384)) for r in res]
        cols = 8
        sheet = Image.new("RGB", (216 * cols, 384 * ((len(ims) + cols - 1) // cols)))
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % cols) * 216, (i // cols) * 384))
        sheet.save(out)
        return
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS // step if step > 1 else FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(4) as p:
        for k, buf in enumerate(p.imap(render_frame, frames, chunksize=2)):
            ff.stdin.write(buf)
            if k % 60 == 0:
                print(f"frame {k}/{len(frames)}", flush=True)
    ff.stdin.close()
    ff.wait()


if __name__ == "__main__":
    main()
