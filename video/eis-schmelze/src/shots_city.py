"""Stadt- und Flut-Szenen: Rückzug des Meeres, Zeitraffer-Überflutung, Flutwelle,
Straße (bodennah), Hafen, Straßenraster von oben, Küstenstraße, Eisberge."""
import functools
import math

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

import city
from lib import H, W, affine, blur, clamp, ease_in, ease_io, ease_out, fbm, fstep, from_img, noise, perspective_coeffs, resize_f, sstep, to_img
from shots_ice import ice_color, splash_plume, stormy_sky

ORANGE = np.array([1.0, 0.58, 0.24], np.float32)


# ------------------------------------------------------------------ Meer zieht sich zurück (Blick aufs Meer)
@functools.lru_cache(None)
def _recede_static():
    r = np.random.default_rng(3)
    side = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(side)
    # Gebäudesilhouetten an den Rändern (nah)
    for x0, x1, top in ((-40, 170, 120), (150, 260, 520), (880, 1120, 60), (800, 900, 610)):
        d.rectangle((x0, top, x1, 1300), fill=(10, 12, 15, 255))
        for yy in range(int(top) + 20, 1280, 26):
            for xx in range(int(x0) + 10, int(x1) - 10, 22):
                if r.random() < 0.3:
                    b = r.uniform(0.4, 1)
                    d.rectangle((xx, yy, xx + 9, yy + 12), fill=(int(255 * b), int(150 * b), int(70 * b), 255))
    # Promenade + Geländer im Vordergrund
    d.rectangle((0, 1690, W, H), fill=(14, 15, 17, 255))
    for x in range(0, W, 60):
        d.line([(x, 1600), (x, 1700)], fill=(30, 32, 36, 255), width=5)
    d.line([(0, 1605), (W, 1605)], fill=(40, 42, 46, 255), width=6)
    for x in (120, 960):
        d.line([(x, 1240), (x, 1700)], fill=(28, 30, 34, 255), width=8)
        d.ellipse((x - 14, 1225, x + 14, 1253), fill=(255, 200, 130, 255))
    sand = fbm(H // 2, W // 2, 8, 5, seed=301)
    return side, resize_f(sand, W, H)


def shot_recede(lt, dur, fi):
    u = lt / dur
    hy = 840
    out = stormy_sky(lt, 0.8, 30 + lt * 120)
    yy = np.arange(H, dtype=np.float32)[:, None]
    # Meer
    rt = city.ripple_tex()
    rows = np.arange(hy, H)
    rr = rt[(rows * 2 + int(lt * 50)) % rt.shape[0]][:, :W]
    near = clamp((rows - hy) / 900)[:, None]
    sea = np.array([0.01, 0.02, 0.03], np.float32) + (0.05 * (1 - near) + clamp(rr * 5) * 0.05 * near)[..., None]
    out[hy:] = sea
    # Freigelegter Meeresboden: Wasserlinie wandert zum Horizont
    shore = 1520 - 560 * ease_out(u)
    side, sand = _recede_static()
    m = (yy > shore).astype(np.float32)[..., None]
    bed = (np.array([0.05, 0.048, 0.045], np.float32) * (0.5 + 0.9 * sand[..., None]))
    # Pfützen-Reflexe
    pud = clamp(sand * 3 - 1.9)[..., None]
    bed = bed * (1 - pud) + pud * np.array([0.12, 0.1, 0.08], np.float32)
    out = out * (1 - m) + bed * m
    fl = clamp(1 - np.abs(yy - shore) / 10)[..., None]
    out += fl * 0.35
    # Welle am Horizont baut sich auf
    wh = 6 + 120 * ease_in(u)
    band = clamp((yy - (hy - wh)) / max(wh, 1)) * (yy < hy + 6)
    xs = np.arange(W, dtype=np.float32)[None, :]
    var = 0.55 + 0.9 * (city.ripple_tex()[40, :W][None, :] + 0.5) * 0.5 + 0.1 * np.sin(xs / 23 + lt * 9)
    crest = clamp(1 - np.abs(yy - (hy - wh * var)) / (4 + wh * 0.25))
    out = out * (1 - band[..., None] * 0.9) + band[..., None] * np.array([0.03, 0.05, 0.06], np.float32)
    out += crest[..., None] * np.array([0.7, 0.75, 0.8], np.float32) * (0.4 + u)
    mist = blur(crest.astype(np.float32), 30) * (0.3 + u)
    out += mist[..., None] * 0.35
    # Vordergrund
    s = np.asarray(side, np.float32) / 255
    out = out * (1 - s[..., 3:]) + s[..., :3] * s[..., 3:]
    # Sirenenlicht
    ph = (lt * 4) % 1
    sc = np.array([1, 0.1, 0.1], np.float32) if ph < 0.5 else np.array([0.1, 0.3, 1], np.float32)
    glow = np.exp(-((xs - 540) ** 2 + (yy - 1650) ** 2) / (2 * 260 ** 2))
    out += glow[..., None] * sc * 0.08
    out = city.rain(out, lt, 0.5, seed=4)
    z = 1.04 + 0.08 * u
    return affine(out, zoom=z, cy=H / 2 + 30 * u)


# ------------------------------------------------------------------ Zeitraffer-Überflutung
def flood_level(u):
    return 70.0 * ease_io(fstep(0.06, 0.93, u) * 1.0) if u < 0.93 else 70.0


PEOPLE = [(0.02 + 0.045 * k, 0.9 + 0.1 * ((k * 37) % 7) / 7) for k in range(16)]


def _draw_people(out, lt, Hm):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for base, spd in PEOPLE:
        p = base + 0.07 * spd * lt
        x, y = city.road_path(p)
        # über Wasser?
        x_i = int(min(W - 1, max(0, x)))
        e = city.slabs()[-1].e[x_i]
        yw = city.y_of(260, Hm)
        if y > yw - 4:
            continue
        hh = 19
        bob = math.sin(lt * 9 + base * 40) * 1.2
        d.rectangle((x - 3, y - hh + 6 + bob, x + 3, y), fill=(4, 5, 6, 255))
        d.ellipse((x - 3, y - hh + bob, x + 3, y - hh + 6 + bob), fill=(4, 5, 6, 255))
        d.line([(x + 2, y - hh + 7), (x + 2, y - 2)], fill=(90, 80, 70, 255), width=1)
        # Handylicht / Taschenlampe
        d.ellipse((x + 3, y - 12, x + 6, y - 9), fill=(255, 245, 220, 255))
    a = np.asarray(lay, np.float32) / 255
    out = out * (1 - a[..., 3:]) + a[..., :3] * a[..., 3:]
    m = (a[..., 0] > 0.8).astype(np.float32)
    out += blur(m, 5)[..., None] * 1.6 * np.array([1, 0.95, 0.85], np.float32)
    return out


SIRENS = [(600, 1408), (720, 1410), (980, 1408), (300, 1172), (840, 1170), (560, 1287)]


def _sirens(out, lt, Hm, amt=1.0):
    m = np.zeros((H, W), np.float32)
    mb = np.zeros((H, W), np.float32)
    for k, (x, y) in enumerate(SIRENS):
        # über Wasser?
        e_here = {1408: 3, 1410: 3, 1172: 10, 1170: 10, 1287: 6}.get(y, 3)
        if Hm > e_here + 1:
            continue
        on = ((lt * 3.3 + k * 0.37) % 1)
        if on < 0.5:
            m[y, x] = 1
        else:
            mb[y, x] = 1
    g = blur(m, 9) * 380
    gb = blur(mb, 9) * 380
    out = out + (g[..., None] * np.array([1, 0.1, 0.06], np.float32) + gb[..., None] * np.array([0.1, 0.3, 1], np.float32)) * amt
    return out


FLASHES = [2.2, 5.9, 8.8]


def shot_city_flood(lt, dur, fi):
    u = lt / dur
    Hm = flood_level(u)
    fl = 0.0
    for ft in FLASHES:
        if 0 <= lt - ft < 0.35:
            fl = max(fl, math.exp(-(lt - ft) * 12) * (1.0 if (lt - ft) > 0.05 or (lt - ft) < 0.02 else 0.4))
    out = city.render(lt, Hm=Hm, sky_scroll=lt * 420, flash=fl * 1.2, murk=Hm / 70, beacon_t=lt)
    for ft, x0 in zip(FLASHES, (300, 820, 520)):
        if 0 <= lt - ft < 0.22:
            out = city.lightning(out, lt, int(ft * 10), x0, math.exp(-(lt - ft) * 10))
    out = _sirens(out, lt, Hm)
    out = _draw_people(out, lt, Hm)
    # Zeitraffer-Lichtpulse (Tag/Nacht-Flackern sehr dezent)
    out = out * (1.35 + 0.12 * math.sin(lt * 2 * math.pi * 0.7))
    out = city.rain(out, lt, 0.45, seed=9)
    z = 1.16 - 0.14 * ease_io(u)
    return affine(out, zoom=z, cx=W / 2 + 40 * u, cy=1040 - 120 * u)


# ------------------------------------------------------------------ Flutwelle trifft Stadt (aus der Distanz)
def shot_wave_city(lt, dur, fi):
    u = lt / dur
    zw = 200 + 420 * ease_in(min(1, u / 0.8))
    hit = clamp((u - 0.78) / 0.22)

    def H_of(s):
        if s.z < zw:
            return 2.5 + 2 * math.sin(lt * 7 + s.z)
        if s.z <= 620 and hit > 0:
            return 12 * ease_out(hit)
        return 0.0

    wave = dict(z=zw, h=24.0, spray=1.0) if hit < 1 else None
    out = city.render(lt, H_of=H_of, sky_scroll=lt * 60, murk=0.3, beacon_t=lt, wave=wave,
                      slab_foam=lambda s: 1.0 if s.z < zw else 0.0, chop=2.0)
    if hit > 0:
        f = (u - 0.78) * dur
        out = splash_plume(out, f, 640, int(city.y_of(600, 3)), 900, 0.8, seed=11, n=700)
    out = _sirens(out, lt, 0.0)
    out = out * 1.35
    out = city.rain(out, lt, 0.5, seed=12)
    return affine(out, zoom=1.12 + 0.05 * u, cy=1080)


# ------------------------------------------------------------------ Straße bodennah: Wasserwand rollt heran
@functools.lru_cache(None)
def facade_tex(seed):
    r = np.random.default_rng(seed)
    w, h = 900, 1800
    im = Image.new("RGB", (w, h), (16, 18, 22))
    d = ImageDraw.Draw(im)
    for y in range(40, h - 40, 60):
        for x in range(30, w - 30, 52):
            if r.random() < 0.35:
                b = r.uniform(0.35, 1)
                d.rectangle((x, y, x + 30, y + 36), fill=(int(255 * b), int(150 * b), int(70 * b)))
            else:
                d.rectangle((x, y, x + 30, y + 36), fill=(26, 30, 36))
    # Ladenzeile unten
    d.rectangle((0, h - 160, w, h), fill=(20, 22, 26))
    for x in range(20, w, 140):
        d.rectangle((x, h - 140, x + 100, h - 30), fill=(int(r.uniform(80, 200)), int(r.uniform(60, 120)), 50))
    return im


def _quad(img, dst, size=(W, H)):
    w, h = img.size
    co = perspective_coeffs(dst, [(0, 0), (w, 0), (w, h), (0, h)])
    return img.transform(size, Image.PERSPECTIVE, co, resample=Image.BILINEAR)


def shot_street(lt, dur, fi):
    u = lt / dur
    vx, vy = 540, 860
    out = stormy_sky(lt, 0.7, lt * 50)
    yy = np.arange(H, dtype=np.float32)[:, None]
    xs = np.arange(W, dtype=np.float32)[None, :]
    # Straße
    road = (yy > vy).astype(np.float32)
    dist = clamp((yy - vy) / (H - vy))
    asphalt = np.array([0.025, 0.027, 0.03], np.float32) * (0.6 + dist[..., None])
    out = out * (1 - road[..., None]) + asphalt * road[..., None]
    # Mittellinie
    lane = clamp(1 - np.abs(xs - vx) / (2 + 14 * dist)) * (np.sin((1 / np.maximum(dist, 0.02)) * 3 + lt * 0) > 0) * road
    out += lane[..., None] * 0.25
    # Fassaden
    lay = np.zeros((H, W, 4), np.float32)
    L = _quad(facade_tex(1).convert("RGBA"), [(-500, -900), (470, 560), (470, 880), (-500, 2100)])
    R = _quad(facade_tex(2).convert("RGBA"), [(610, 560), (1580, -900), (1580, 2100), (610, 880)])
    for im in (L, R):
        a = np.asarray(im, np.float32) / 255
        out = out * (1 - a[..., 3:]) + a[..., :3] * a[..., 3:]
    # Nasse Straße spiegelt Licht
    refl = out[::-1][: H - vy]
    k = min(refl.shape[0], H - vy)
    out[vy:vy + k] += refl[:k] * 0.18 * road[vy:vy + k, :, None]
    # Wasserwand
    s = ease_in(u) * 0.97 + 0.03
    z = 1 / (0.04 + 0.96 * s)  # Tiefe (relativ)
    by = vy + (H - vy + 300) / z
    wh = (by - vy) * 4.0
    ty = by - wh
    xl = vx - (vx + 500) / z * 1.0
    xr = vx + (W - vx + 500) / z * 1.0
    fz = fbm(H // 4, W // 4, 6, 5, seed=401)
    off = int(lt * 260)
    scroll = np.roll(resize_f(fz, W, H), -off, axis=0)
    crest = ty + (scroll[0] - 0.5) * wh * 0.25
    rel = (yy - crest[None, :]) / np.maximum(by - crest[None, :], 1)
    inwave = (rel >= 0) & (rel <= 1) & (xs >= xl) & (xs <= xr)
    foam = clamp(1.0 - rel * 3.2 + (scroll - 0.5) * 2.2)
    streak = clamp((resize_f(fz, W, H)[:, ::-1] - 0.55) * 4) * 0.5
    bodyc = np.array([0.025, 0.05, 0.055], np.float32) * (0.6 + 1.4 * (1 - rel[..., None])) + streak[..., None] * 0.25
    body = bodyc * (1 - foam[..., None]) + np.array([0.72, 0.78, 0.8], np.float32) * foam[..., None]
    out = np.where(inwave[..., None], body, out)
    spray = clamp(1 + rel * 6 + (scroll - 0.5) * 2) * (rel < 0) * (xs >= xl - 60) * (xs <= xr + 60)
    spray = blur(spray.astype(np.float32), 10) * 0.7
    out = out * (1 - spray[..., None] * 0.8) + spray[..., None] * np.array([0.6, 0.65, 0.7], np.float32)
    # Wasserfilm + Trümmer vor der Welle
    film = clamp((yy - by) * -1 / 300 + 1) * (yy > by) * road
    out = out * (1 - film[..., None] * 0.5) + film[..., None] * np.array([0.04, 0.06, 0.07], np.float32)
    r = np.random.default_rng(42)
    lay = Image.new("L", (W, H), 0)
    dl = ImageDraw.Draw(lay)
    for k in range(40):
        p = r.uniform(0.0, 1.0)
        zz = 1 / (0.04 + 0.96 * min(1, s + p * 0.15))
        x = vx + r.uniform(-1, 1) * (W / 2) / zz * 1.6
        y = vy + (H - vy + 300) / zz + r.uniform(-30, 0)
        sz = 26 / zz
        a = lt * r.uniform(-8, 8)
        pts = [(x + sz * math.cos(a + j * 1.57), y + sz * 0.6 * math.sin(a + j * 1.57)) for j in range(4)]
        dl.polygon(pts, fill=int(r.uniform(30, 90)))
    dm = np.asarray(lay, np.float32) / 255
    out = np.where(dm[..., None] > 0, dm[..., None] * np.array([0.6, 0.5, 0.4], np.float32), out)
    # Laternen
    for side_ in (-1, 1):
        for k in range(1, 7):
            zz = k * 1.0
            x = vx + side_ * 380 / zz
            y = vy - 420 / zz
            g = np.exp(-((xs - x) ** 2 + (yy - y) ** 2) / (2 * (30 / zz + 4) ** 2))
            out += g[..., None] * ORANGE * 1.4
    # Wasser trifft Kamera
    if u > 0.9:
        f = (u - 0.9) / 0.1
        wash = resize_f(fbm(H // 4, W // 4, 4, 4, seed=402 + int(lt * 30)), W, H)
        a = clamp(f * 1.5)
        out = out * (1 - a) + (np.array([0.5, 0.56, 0.6], np.float32) * wash[..., None] + 0.1) * a
    return out


# ------------------------------------------------------------------ Hafen überflutet
@functools.lru_cache(None)
def _harbor_layer():
    r = np.random.default_rng(77)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    qy = 1240
    d.rectangle((0, qy, W, H), fill=(22, 23, 25, 255))
    d.rectangle((0, qy, W, qy + 10), fill=(50, 50, 52, 255))
    cont = []
    pal = [(110, 50, 35), (40, 80, 90), (75, 75, 80), (120, 90, 45), (45, 60, 95)]
    for col in range(9):
        for lvl in range(r.integers(1, 5)):
            x = 60 + col * 112
            y = qy - (lvl + 1) * 52
            c = pal[r.integers(0, 5)]
            cont.append((x, y, c))
    # Kran
    for cx in (230, 760):
        d.line([(cx - 60, qy), (cx - 40, 300)], fill=(38, 40, 46, 255), width=10)
        d.line([(cx + 60, qy), (cx + 40, 300)], fill=(38, 40, 46, 255), width=10)
        d.line([(cx - 260, 300), (cx + 300, 300)], fill=(42, 44, 50, 255), width=14)
        d.line([(cx - 40, 300), (cx, 180), (cx + 40, 300)], fill=(42, 44, 50, 255), width=6)
        d.ellipse((cx - 6, 172, cx + 6, 184), fill=(255, 40, 30, 255))
        for k in range(8):
            d.ellipse((cx - 240 + k * 66 - 4, 306, cx - 240 + k * 66 + 4, 314), fill=(255, 190, 110, 255))
    return im, cont


def shot_harbor(lt, dur, fi, late=False):
    u = lt / dur
    out = stormy_sky(lt, 0.6, 200 + lt * 80)
    yy = np.arange(H, dtype=np.float32)[:, None]
    xs = np.arange(W, dtype=np.float32)[None, :]
    lay, cont = _harbor_layer()
    a = np.asarray(lay, np.float32) / 255
    out = out * (1 - a[..., 3:]) + a[..., :3] * a[..., 3:]
    qy = 1240
    level = qy + 120 - 360 * ease_out(u if not late else min(1, 0.5 + u))
    # Wasserfront läuft von links nach rechts über den Kai
    front = -200 + 1600 * ease_out(min(1, u * 1.4 + (0.4 if late else 0)))
    surge = (xs < front)
    wl = np.where(surge, level, qy + 120) + 18 * np.sin(xs / 55 + lt * 6)
    # Container (schwimmen auf, kippen)
    clay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dc = ImageDraw.Draw(clay)
    for k, (x, y, c) in enumerate(cont):
        lift = 0.0
        ang = 0.0
        wl_x = wl[0, int(min(W - 1, max(0, x + 50)))]
        if wl_x < y + 52:
            lift = (y + 52 - wl_x) * 0.85
            ang = math.sin(lt * 2 + k) * 0.25 * clamp((y + 52 - wl_x) / 80)
        cx, cy = x + 50 + (lift * 0.4), y + 26 - lift
        pts = [(cx + px * math.cos(ang) - py * math.sin(ang), cy + px * math.sin(ang) + py * math.cos(ang)) for px, py in ((-50, -24), (50, -24), (50, 24), (-50, 24))]
        dc.polygon(pts, fill=c + (255,))
        dc.line(pts + [pts[0]], fill=tuple(int(v * 0.6) for v in c) + (255,), width=2)
    ca = np.asarray(clay, np.float32) / 255
    out = out * (1 - ca[..., 3:]) + ca[..., :3] * ca[..., 3:]
    # Wasser
    water = yy > wl
    rt = city.ripple_tex()
    rr = rt[(np.arange(H) * 2 + int(lt * 120)) % rt.shape[0]][:, :W]
    wcol = np.array([0.015, 0.03, 0.04], np.float32) + clamp(rr * 3 + 0.5)[..., None] * 0.05
    foam = clamp(1 - (yy - wl) / 40) * water + clamp(rr * 6 - 1.6) * water * 0.35 * clamp(1 - (yy - wl) / 300)
    wcol = wcol + foam[..., None] * 0.6
    out = np.where(water[..., None], wcol, out)
    # Gischt an der Front
    sp = np.exp(-((xs - front) / 120) ** 2) * clamp((yy - (level - 500)) / 500) * (yy < level + 40)
    sp = blur(sp.astype(np.float32), 10) * 0.9
    out = out * (1 - sp[..., None] * 0.7) + sp[..., None] * 0.75
    out = splash_plume(out, (lt % 0.9) + 0.05, int(min(W, max(0, front))), int(level), 400, 0.7, seed=int(lt / 0.9) + 5, n=300)
    # Flutlicht
    for x in (100, 540, 980):
        g = np.exp(-((xs - x) ** 2) / (2 * 140 ** 2) - ((yy - 420) ** 2) / (2 * 300 ** 2))
        out += g[..., None] * ORANGE * 0.12
    out = city.rain(out, lt, 0.6, seed=14)
    return affine(out * 1.25, zoom=1.08 + 0.06 * u, dx=-40 * u)


# ------------------------------------------------------------------ Straßenraster von oben
@functools.lru_cache(None)
def _grid():
    h, w = H // 3, W // 3
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ang = math.radians(18)
    ru = xx * math.cos(ang) + yy * math.sin(ang)
    rv = -xx * math.sin(ang) + yy * math.cos(ang)
    street = ((ru % 52) < 8) | ((rv % 64) < 8)
    # Küste unten
    sea = (yy > h * 0.86 + 12 * np.sin(xx / 20))
    street = street & ~sea
    # Flutdistanz entlang der Straßen
    dist = np.full((h, w), 1e9, np.float32)
    front = sea.copy()
    dist[front] = 0
    visited = front.copy()
    passable = street | sea
    for i in range(1, 600):
        nb = ndimage.binary_dilation(front) & passable & ~visited
        if not nb.any():
            break
        dist[nb] = i
        visited |= nb
        front = nb
    r = np.random.default_rng(5)
    roof = fbm(h, w, 10, 3, seed=501) * 0.5 + 0.5
    blocks = ~street & ~sea
    bid = (np.floor(ru / 52) * 1000 + np.floor(rv / 64)).astype(np.int64)
    shade = ((bid * 2654435761) % 1000) / 1000.0
    return street, sea, dist, shade.astype(np.float32), blocks


def shot_topdown(lt, dur, fi):
    u = lt / dur
    street, sea, dist, shade, blocks = _grid()
    h, w = street.shape
    reach = 30 + 330 * ease_out(u)
    wet = (street & (dist < reach)) | sea
    foamf = street & (np.abs(dist - reach) < 6)
    base = np.zeros((h, w, 3), np.float32)
    roof = (0.05 + 0.06 * shade)[..., None] * np.array([1, 1.02, 1.05], np.float32)
    base[blocks] = roof[blocks]
    base[street] = np.array([0.03, 0.03, 0.035], np.float32)
    # Straßenlichter
    rng = np.random.default_rng(9)
    lights = (street & (rng.random((h, w)) < 0.05)).astype(np.float32)
    lights = lights * (~wet)
    big = resize_f(base, W, H, Image.NEAREST)
    lg = blur(resize_f(lights, W, H), 3) * 18
    big += lg[..., None] * ORANGE * 0.5
    wm = resize_f(wet.astype(np.float32), W, H)
    fm = resize_f(foamf.astype(np.float32), W, H)
    flow = resize_f(fbm(H // 4, W // 4, 20, 3, seed=600 + int(lt * 10)), W, H)
    wcol = np.array([0.05, 0.12, 0.14], np.float32) + flow[..., None] * 0.12
    big = big * (1 - wm[..., None]) + wcol * wm[..., None]
    big += blur(fm, 3)[..., None] * 1.4
    # Gebäudeschatten/Dachkanten
    big = big * (0.75 + 0.5 * resize_f(blocks.astype(np.float32), W, H)[..., None] * 0 + 0.25)
    out = affine(big * 1.4, zoom=1.15 + 0.15 * u, rot=math.radians(-4 + 8 * u))
    return out


# ------------------------------------------------------------------ Küstenstraße verschwindet
def shot_road(lt, dur, fi):
    u = lt / dur
    vx, vy = 560, 900
    out = stormy_sky(lt, 0.7, 400 + lt * 200)
    yy = np.arange(H, dtype=np.float32)[:, None]
    xs = np.arange(W, dtype=np.float32)[None, :]
    dist = clamp((yy - vy) / (H - vy))
    rt = city.ripple_tex()
    rr = rt[(np.arange(H) * 3 + int(lt * 80)) % rt.shape[0]][:, :W]
    below = yy > vy
    seac = np.array([0.012, 0.025, 0.035], np.float32) + clamp(rr * 5 + 0.2)[..., None] * 0.07 * (0.2 + dist[..., None])
    out = np.where(below[..., None], seac, out)
    left = vx - (vx + 100) * dist
    right = vx + (W + 300 - vx) * dist
    onroad = (xs > left) & (xs < right) & below
    # Hang rechts der Straße
    hill = (xs >= right) & (yy > vy - 0.5 * (xs - vx))
    out = np.where(hill[..., None], np.array([0.018, 0.02, 0.022], np.float32), out)
    hill2 = (xs > vx) & (yy > vy - 0.5 * (xs - vx)) & ~below
    out = np.where(hill2[..., None], np.array([0.018, 0.02, 0.022], np.float32), out)
    asph = np.array([0.05, 0.052, 0.058], np.float32) * (0.5 + 0.9 * dist[..., None])
    out = np.where(onroad[..., None], asph, out)
    # Mittellinie gestrichelt
    rel = (xs - left) / np.maximum(right - left, 1)
    zline = 1.0 / np.maximum(dist, 0.01)
    dash = (np.sin(zline * 2.2 + lt * 0) > 0.2)
    cl = (np.abs(rel - 0.5) < 0.012) & dash & onroad
    out = np.where(cl[..., None], np.array([0.6, 0.6, 0.55], np.float32) * (0.4 + dist[..., None]), out)
    # Leitplanke links
    rail = (np.abs(xs - left - 4 * dist) < (1 + 5 * dist)) & below
    out = np.where(rail[..., None], np.array([0.3, 0.31, 0.33], np.float32), out)
    # Laternen rechts + Spiegelung auf nasser Straße
    for k in range(1, 10):
        d_ = 1 / (k * 0.8)
        if d_ > 1.2:
            continue
        x = vx + (W + 300 - vx) * d_ * 0.92
        y = vy + (H - vy) * d_ - 1100 * d_
        g = np.exp(-((xs - x) ** 2 + (yy - y) ** 2) / (2 * (36 * d_ + 3) ** 2))
        out += g[..., None] * ORANGE * 1.6
        ry = vy + (H - vy) * d_
        gr = np.exp(-((xs - x + 120 * d_) ** 2) / (2 * (24 * d_ + 2) ** 2) - ((yy - ry - 60 * d_) ** 2) / (2 * (160 * d_ + 4) ** 2)) * onroad
        out += gr[..., None] * ORANGE * 0.35
    # Steigendes Wasser: Wasserlinie wandert auf die Kamera zu
    wy = vy + (H - vy) * (0.03 + 0.8 * ease_io(u))
    wav = 12 * np.sin(xs / 40 + lt * 5) + 6 * np.sin(xs / 13 - lt * 7)
    cover = (yy < wy + wav) & below & (onroad | (xs < left))
    out = np.where(cover[..., None], seac, out)
    foam = clamp(1 - np.abs(yy - (wy + wav)) / (3 + 22 * dist)) * (onroad | (xs < left)) * below
    out += foam[..., None] * 0.7
    out = city.rain(out, lt, 0.6, seed=15)
    return affine(out * 1.3, zoom=1.05 + 0.05 * u)


# ------------------------------------------------------------------ Eisberge im dunklen Meer
@functools.lru_cache(None)
def _bergs():
    r = np.random.default_rng(88)
    out = []
    for k, (x, w, h) in enumerate(((260, 520, 420), (820, 380, 260), (560, 220, 120))):
        n = 18
        top = [(x - w / 2 + w * i / (n - 1), -h * (0.55 + 0.45 * math.sin(math.pi * i / (n - 1)) ** 0.6) + r.normal(0, h * 0.08)) for i in range(n)]
        out.append((x, w, h, top))
    return out


def shot_icebergs(lt, dur, fi):
    u = lt / dur
    hy = 1060
    out = stormy_sky(lt, 0.7, lt * 30)
    yy = np.arange(H, dtype=np.float32)[:, None]
    xs = np.arange(W, dtype=np.float32)[None, :]
    rt = city.ripple_tex()
    rr = rt[(np.arange(H) * 3 + int(lt * 40)) % rt.shape[0]][:, :W]
    sea = (yy > hy)
    dist = clamp((yy - hy) / 900)
    out = np.where(sea[..., None], np.array([0.008, 0.016, 0.026], np.float32) + clamp(rr * 5 + 0.3)[..., None] * 0.05 * (0.3 + dist[..., None]), out)
    tex = None
    for k, (x, w, h, top) in enumerate(_bergs()):
        x = x + (lt * (30 - 12 * k))
        lay = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(lay)
        pts = [(px + lt * (30 - 12 * k), hy + 4 + py) for px, py in top]
        pts = pts + [(pts[-1][0], hy + 6), (pts[0][0], hy + 6)]
        d.polygon(pts, fill=255)
        m = np.asarray(lay, np.float32) / 255
        under = Image.new("L", (W, H), 0)
        ImageDraw.Draw(under).polygon([(pts[0][0] - 30, hy + 6), (pts[-3][0] + 30, hy + 6), (x + w * 0.3, hy + h * 1.6), (x - w * 0.4, hy + h * 1.4)], fill=255)
        um = blur(np.asarray(under, np.float32) / 255, 12) * 0.25
        xn = clamp((xs - (x - w / 2)) / w)
        light = 0.5 + 0.5 * xn
        v = fbm(H // 4, W // 4, 6, 4, seed=700 + k)
        v = resize_f(v, W, H)
        col = ice_color(0.45 + 0.4 * v * light) * (0.6 + 0.6 * light[..., None])
        gray = col.mean(-1, keepdims=True)
        col = col * 0.55 + gray * 0.45
        col = col * (0.55 + 0.45 * clamp((hy - yy) / (h * 0.8)))[..., None] ** 0 * (1 - 0.5 * clamp((yy - (hy - h * 0.25)) / (h * 0.3)))[..., None]
        out = out * (1 - m[..., None]) + col * m[..., None]
        out = out + um[..., None] * np.array([0.1, 0.3, 0.4], np.float32)
    # Nebelbänke
    ft = city.fog_tex()
    fogm = np.exp(-((yy - hy) / 90) ** 2) * (0.5 + 0.5 * ft[(np.arange(H) % 400)][:, int(lt * 30) % W:int(lt * 30) % W + W])
    out = out * (1 - fogm[..., None] * 0.6) + fogm[..., None] * np.array([0.14, 0.15, 0.17], np.float32)
    bob = math.sin(lt * 1.7) * 14
    return affine(out * 1.2, zoom=1.08, dy=bob, rot=math.radians(math.sin(lt * 1.3) * 1.2))
