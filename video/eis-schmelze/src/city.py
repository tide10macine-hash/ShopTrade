"""Küstenmetropole in 2.5D. Jede Tiefenschicht (z, Geländehöhe e(x)) wird perspektivisch
projiziert; die Wasserebene in Höhe Hm (Meter) wird pro Schicht korrekt verdeckt."""
import functools
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from lib import H, W, blur, clamp, fbm, noise, sstep

YH = 860.0      # Horizont (Bildschirm-y)
F = 2800.0      # Brennweite in px
CAM = 120.0     # Kamerahöhe in m


def y_of(z, e):
    return YH + F * (CAM - e) / z


def sc(z):
    return F / z


ROAD = [(850, 1830), (1070, 1700), (900, 1570), (1075, 1450), (960, 1335), (1080, 1190)]


def _col(c):
    return tuple(int(v) for v in c)


def _windows(d, x0, x1, ytop, ybot, s, rng, lit_p, warm=True):
    """Fensterraster; s = px pro Meter."""
    fy = 3.4 * s
    fx = 2.8 * s
    if fx < 2.2:
        n = int((x1 - x0) * (ybot - ytop) / 9 * lit_p)
        for _ in range(n):
            x = rng.uniform(x0 + 1, x1 - 1)
            y = rng.uniform(ytop + 2, ybot - 1)
            b = rng.uniform(0.35, 1.0)
            c = (255 * b, 150 * b, 70 * b) if rng.random() < 0.85 else (190 * b, 210 * b, 255 * b)
            d.point((x, y), fill=_col(c) + (255,))
        return
    ww = max(1.0, fx * 0.45)
    wh = max(1.0, fy * 0.45)
    y = ytop + fy * 0.6
    floor_lit = rng.random() < 0.5
    while y < ybot - fy * 0.4:
        if rng.random() < 0.12:
            floor_lit = not floor_lit
        x = x0 + fx * 0.5
        while x < x1 - fx * 0.4:
            p = lit_p * (1.6 if floor_lit else 0.6)
            if rng.random() < p:
                b = rng.uniform(0.35, 1.0)
                c = (255 * b, 148 * b, 62 * b) if rng.random() < 0.8 else (180 * b, 205 * b, 255 * b)
            else:
                c = (22, 26, 32)
            d.rectangle((x, y, x + ww, y + wh), fill=_col(c) + (255,))
            x += fx
        y += fy


def _building(d, cx, w, height_m, base_y, s, rng, lit_p, base_col, spire=False, beacons=None):
    top = base_y - height_m * s
    x0, x1 = cx - w / 2, cx + w / 2
    c = np.array(base_col) * rng.uniform(0.75, 1.2)
    d.rectangle((x0, top, x1, base_y + 2), fill=_col(c) + (255,))
    # Kantenlicht (Stadtglühen von rechts)
    d.rectangle((x1 - max(1, w * 0.06), top, x1, base_y), fill=_col(c * 1.6 + 6) + (255,))
    # Stufen/Krone
    if rng.random() < 0.4 and w > 6:
        tw = w * rng.uniform(0.4, 0.75)
        th = height_m * rng.uniform(0.06, 0.16) * s
        d.rectangle((cx - tw / 2, top - th, cx + tw / 2, top), fill=_col(c) + (255,))
        top -= th
    if spire and w > 5:
        sh = height_m * rng.uniform(0.12, 0.25) * s
        d.polygon([(cx - w * 0.08, top), (cx + w * 0.08, top), (cx, top - sh)], fill=_col(c) + (255,))
        if beacons is not None:
            beacons.append((cx, top - sh))
    elif beacons is not None and height_m > 260:
        beacons.append((cx, top))
    _windows(d, x0 + 1, x1 - 1, base_y - height_m * s, base_y, s, rng, lit_p)


class Slab:
    def __init__(self, z, e, img, name=""):
        self.z = z
        self.e = np.asarray(e, np.float32)  # pro Spalte
        self.img = img  # PIL RGBA, Bildgröße W x H
        self.name = name
        self.beacons = []


def _ground(d, z, e, col, rng, lamps=0.0):
    ys = [y_of(z, ee) for ee in e]
    pts = [(x, ys[x]) for x in range(0, W, 4)] + [(W, ys[-1]), (W, H), (0, H)]
    d.polygon(pts, fill=_col(col) + (255,))
    if lamps > 0:
        s = sc(z)
        for row in range(3):
            yoff = (row + 0.3) * 6 * s * 0.25
            n = int(W / max(4, 14 * s * 0.3) * lamps)
            for _ in range(n):
                x = rng.uniform(0, W)
                y = ys[int(min(W - 1, x))] + yoff + rng.uniform(0, 3)
                b = rng.uniform(0.5, 1)
                d.point((x, y), fill=_col((255 * b, 160 * b, 80 * b)) + (255,))


@functools.lru_cache(None)
def slabs():
    rng = np.random.default_rng(42)
    xs = np.arange(W, dtype=np.float32)
    out = []

    # Berge
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ridge = 180 + 650 * fbm(1, W, 3, 5, seed=7)[0] ** 1.3
    z = 5200
    pts = [(x, y_of(z, 0) - ridge[x] * sc(z)) for x in range(W)] + [(W, H), (0, H)]
    d.polygon(pts, fill=(14, 18, 25, 255))
    out.append(Slab(z, np.zeros(W), im, "berge"))

    # Hügel-Skyline weit hinten (hoch gelegen)
    def skyline(z, e_prof, n, hmin, hmax, wmin, wmax, col, lit, spire_p=0.1, ground_col=(12, 14, 18), lamps=0.6, xr=(0, W), seed=0):
        r = np.random.default_rng(seed)
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        s = sc(z)
        beac = []
        order = sorted(r.uniform(xr[0], xr[1], n))
        for cx in order:
            hm = hmin + (hmax - hmin) * r.random() ** 2.2
            w = r.uniform(wmin, wmax) * s
            by = y_of(z, e_prof[int(np.clip(cx, 0, W - 1))])
            _building(d, cx, w, hm, by, s, r, lit, col, spire=r.random() < spire_p, beacons=beac)
        _ground(d, z, e_prof, ground_col, r, lamps)
        sl = Slab(z, e_prof, im)
        sl.beacons = beac
        return sl

    out.append(skyline(2600, np.full(W, 58.0), 80, 15, 80, 14, 40, (17, 20, 26), 0.2, seed=1))
    out.append(skyline(1500, np.full(W, 24.0), 34, 50, 420, 22, 48, (16, 19, 25), 0.22, spire_p=0.35, seed=2, xr=(40, W - 40)))
    out.append(skyline(1000, np.full(W, 10.0), 48, 15, 150, 16, 40, (18, 21, 27), 0.24, seed=3))

    # Brücke über die Bucht (links), Land rechts
    z = 760
    e = np.where(xs < 470, -14.0, 6.0)
    e = np.where((xs >= 470) & (xs < 520), -14 + (xs - 470) / 50 * 20, e)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = sc(z)
    _ground(d, z, e, (13, 15, 19), rng, 0.8)
    r = np.random.default_rng(5)
    for cx in sorted(r.uniform(540, W, 26)):
        _building(d, cx, r.uniform(14, 34) * s, 10 + 70 * r.random() ** 2, y_of(z, 6), s, r, 0.4, (19, 22, 28))
    deck_e = 26.0
    yd = y_of(z, deck_e)
    d.rectangle((-10, yd, 560, yd + 2.2 * s), fill=(24, 27, 33, 255))
    for i in range(0, 560, 6):
        d.point((i, yd - 1), fill=(255, 170, 90, 255))
    for tx in (110, 400):
        top = y_of(z, deck_e + 95)
        d.rectangle((tx - 4, top, tx + 4, y_of(z, -14)), fill=(26, 29, 36, 255))
        d.point((tx, top - 2), fill=(255, 40, 30, 255))
    # Tragseile
    for a, b in ((-60, 110), (110, 400), (400, 640)):
        pts = []
        for k in range(41):
            u = k / 40
            x = a + (b - a) * u
            sag = 4 * u * (1 - u)
            ya = y_of(z, deck_e + 95) if a in (110, 400) else yd
            yb = y_of(z, deck_e + 95) if b in (110, 400) else yd
            y = ya + (yb - ya) * u + sag * (yd - y_of(z, deck_e + 95)) * 0.85
            pts.append((x, y))
        d.line(pts, fill=(60, 66, 76, 255), width=1)
    br = Slab(z, e, im, "bruecke")
    br.beacons = [(110, y_of(z, deck_e + 95) - 2), (400, y_of(z, deck_e + 95) - 2)]
    out.append(br)

    # Hafen / Uferfront
    z = 600
    e = np.where(xs < 430, -12.0, 3.0)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = sc(z)
    _ground(d, z, e, (14, 16, 20), rng, 0.0)
    yb = y_of(z, 3)
    r = np.random.default_rng(9)
    # Container
    pal = [(70, 38, 30), (34, 56, 62), (52, 52, 56), (78, 60, 34), (30, 40, 58)]
    for k in range(70):
        cx = r.uniform(470, 760)
        lvl = r.integers(0, 4)
        cw = 6 * s
        ch = 2.6 * s
        y = yb - (lvl + 1) * ch
        c = pal[r.integers(0, len(pal))]
        d.rectangle((cx, y, cx + cw, y + ch - 1), fill=c + (255,))
    # Kräne
    for cx in (500, 590, 680):
        top = yb - 62 * s
        d.line([(cx - 8, yb), (cx - 4, top)], fill=(40, 44, 50, 255), width=3)
        d.line([(cx + 8, yb), (cx + 4, top)], fill=(40, 44, 50, 255), width=3)
        d.line([(cx - 40, top), (cx + 34 * s, top)], fill=(44, 48, 55, 255), width=3)
        d.point((cx + 34 * s, top - 1), fill=(255, 50, 40, 255))
        for k in range(6):
            d.point((cx - 30 + k * 18, top + 2), fill=(255, 180, 90, 255))
    # Lagerhallen & Uferstraße
    for cx in sorted(r.uniform(780, W, 14)):
        _building(d, cx, r.uniform(18, 40) * s, r.uniform(8, 26), yb, s, r, 0.3, (20, 23, 29))
    for i in range(440, W, 9):
        d.point((i, yb + 3), fill=(255, 165, 80, 255))
    # Pier links
    d.rectangle((300, yb + 1, 460, yb + 4), fill=(22, 24, 28, 255))
    out.append(Slab(z, e, im, "hafen"))

    # Strand + Promenade
    z = 430
    e = np.where(xs < 300, -6.0, 1.2)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = sc(z)
    ys = y_of(z, 1.2)
    _ground(d, z, e, (44, 41, 38), rng, 0)
    # Promenade mit Laternen
    d.rectangle((300, ys - 1.2 * s, W, ys), fill=(28, 28, 30, 255))
    for i in range(310, W, 26):
        d.line([(i, ys - 1), (i, ys - 5 * s)], fill=(40, 40, 44, 255), width=1)
        d.point((i, ys - 5 * s), fill=(255, 190, 110, 255))
    out.append(Slab(z, e, im, "strand"))

    # Meeresboden-Stufen (nur sichtbar, wenn sich das Meer zurückzieht)
    for z, ee in ((380, -0.8), (330, -2.0), (285, -3.5), (240, -5.5), (200, -8.0)):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        e = np.full(W, ee, np.float32)
        _ground(d, z, e, (30, 30, 30), rng, 0)
        out.append(Slab(z, e, im, "boden"))

    # Vordergrund-Hügel rechts mit Straße (Evakuierung)
    z = 260
    u = clamp((xs - 760) / 320)
    e = -25 + 140 * (u ** 0.55)
    e = e + 6 * (fbm(1, W, 6, 4, seed=21)[0] - 0.5)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = sc(z)
    _ground(d, z, e, (9, 11, 13), rng, 0)
    # Bäume als Silhouetten auf der Kante
    r = np.random.default_rng(31)
    for k in range(160):
        x = r.uniform(780, W)
        y = y_of(z, e[int(x)])
        hgt = r.uniform(4, 11) * s
        d.polygon([(x - hgt * 0.25, y + 2), (x + hgt * 0.25, y + 2), (x, y - hgt)], fill=(7, 9, 10, 255))
    d.line(ROAD, fill=(30, 31, 33, 255), width=9, joint="curve")
    for k in range(len(ROAD) - 1):
        (xa, ya), (xb, yb) = ROAD[k], ROAD[k + 1]
        L = math.hypot(xb - xa, yb - ya)
        for j in range(int(L // 46)):
            u = (j + 0.5) * 46 / L
            x, y = xa + (xb - xa) * u, ya + (yb - ya) * u
            d.ellipse((x - 2, y - 14, x + 2, y - 10), fill=(255, 200, 120, 255))
            d.line([(x, y - 10), (x, y)], fill=(25, 25, 27, 255), width=1)
    out.append(Slab(z, e, im, "huegel"))
    return out


@functools.lru_cache(None)
def slab_arr(i):
    s = slabs()[i]
    arr = np.asarray(s.img, np.float32) / 255.0
    a = arr[..., 3:4]
    rows = np.nonzero(a[..., 0].max(1) > 0)[0]
    y0 = int(rows[0]) if rows.size else H
    haze = clamp((s.z - 300) / 6000) * 0.55
    rgbc = arr[..., :3] * (1 - haze) + np.array([0.07, 0.075, 0.09], np.float32) * haze
    return y0, np.ascontiguousarray(rgbc[y0:]), np.ascontiguousarray(a[y0:])


def road_path(t):
    """Serpentine auf dem Hügel (Bildschirmkoordinaten), t 0..1 von unten nach oben."""
    pts = ROAD
    t = clamp(t) * (len(pts) - 1)
    i = int(min(len(pts) - 2, math.floor(t)))
    f = t - i
    return (pts[i][0] * (1 - f) + pts[i + 1][0] * f, pts[i][1] * (1 - f) + pts[i + 1][1] * f)


@functools.lru_cache(None)
def sky_tex():
    h, w = 900, W * 2
    c = fbm(h, w, 3, 6, seed=3, ax=2.0) ** 1.4
    c2 = fbm(h, w, 6, 5, seed=4, ax=2.0)
    return (c * 0.75 + c2 * 0.25).astype(np.float32)


@functools.lru_cache(None)
def ripple_tex():
    return (fbm(512, W * 2, 8, 4, seed=11, ay=6.0, ax=1.2) - 0.5).astype(np.float32)


def sky(t, scroll=0.0, flash=0.0, glow=1.0):
    a = np.zeros((H, W, 3), np.float32)
    yy = np.arange(H, dtype=np.float32)[:, None]
    top = np.array([0.012, 0.018, 0.03], np.float32)
    hor = np.array([0.07, 0.085, 0.11], np.float32)
    g = clamp(yy / YH) ** 2.2
    base = top * (1 - g[..., None]) + hor * g[..., None]
    a[:] = base
    st = sky_tex()
    off = int(scroll) % W
    c = st[:, off:off + W]
    hh = min(int(YH) + 40, c.shape[0])
    cl = c[:hh, :, None]
    g3 = g[:hh][..., None]
    cloud_col = np.array([0.11, 0.12, 0.14], np.float32) * (0.5 + 0.9 * g3) + np.array([0.09, 0.05, 0.02], np.float32) * g3 ** 3 * glow
    a[:hh] = a[:hh] * (1 - cl * 0.85) + cloud_col * cl
    # Stadtglühen am Horizont
    gl = np.exp(-np.abs(yy - YH) / 90.0)
    a += gl[..., None] * np.array([0.10, 0.05, 0.015], np.float32) * glow
    if flash > 0:
        fl = np.zeros((H, W, 1), np.float32)
        fl[:hh] = cl
        a += flash * (0.15 + fl) * np.array([0.5, 0.55, 0.7], np.float32) * 0.5
    return a


def lightning(a, t, seed, x0, strength):
    """Blitz: verzweigte Linie mit Glow."""
    if strength <= 0:
        return a
    r = np.random.default_rng(seed)
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)

    def bolt(x, y, ang, length, width, depth):
        pts = [(x, y)]
        for _ in range(int(length / 18)):
            ang += r.normal(0, 0.45)
            ang = max(math.radians(40), min(math.radians(140), ang))
            x += math.cos(ang) * 18
            y += math.sin(ang) * 18
            pts.append((x, y))
            if depth < 2 and r.random() < 0.12:
                bolt(x, y, ang + r.choice([-0.7, 0.7]), length * 0.4, max(1, width - 1), depth + 1)
        d.line(pts, fill=255, width=width)

    bolt(x0, 0, math.radians(90), YH * 0.95, 3, 0)
    m = np.asarray(im, np.float32) / 255
    g = blur(m, 14)
    a = a + (m[..., None] * 1.2 + g[..., None] * 2.5) * np.array([0.75, 0.82, 1.0], np.float32) * strength
    return a


FOG = {2600: 70.0, 1500: 90.0, 1000: 70.0, 760: 50.0}


@functools.lru_cache(None)
def fog_tex():
    return fbm(400, W * 2, 3, 5, seed=77, ax=3.0).astype(np.float32)


def fog_band(cv, yc, hgt, t, amt=0.55):
    y0 = int(max(0, yc - hgt * 2.2))
    y1 = int(min(H, yc + hgt * 0.6))
    if y1 <= y0:
        return
    ys = np.arange(y0, y1, dtype=np.float32)
    prof = np.exp(-((ys - yc) / hgt) ** 2)[:, None]
    ft = fog_tex()
    off = int(t * 22 + yc) % W
    nz = ft[(ys.astype(int) - y0) % ft.shape[0]][:, off:off + W]
    a = prof * (0.35 + 0.8 * nz) * amt
    fogc = np.array([0.10, 0.105, 0.12], np.float32)
    cv[y0:y1] = cv[y0:y1] * (1 - a[..., None] * 0.8) + fogc * a[..., None]


def rain(cv, t, amt=0.5, seed=0):
    """Schräge Regenschlieren."""
    if amt <= 0:
        return cv
    r = np.random.default_rng(seed + int(t * 30))
    im = Image.new("L", (W // 2, H // 2), 0)
    d = ImageDraw.Draw(im)
    for _ in range(int(500 * amt)):
        x = r.uniform(-50, W // 2)
        y = r.uniform(-50, H // 2)
        L = r.uniform(18, 45)
        d.line([(x, y), (x + L * 0.25, y + L)], fill=int(r.uniform(40, 120)), width=1)
    m = np.asarray(im.resize((W, H), Image.BILINEAR), np.float32) / 255
    return cv + m[..., None] * np.array([0.5, 0.55, 0.62], np.float32) * 0.35 * amt


def water_band(cv, y0, y1, colmask, Hm, t, murk=0.0, foam=0.0, chop=1.0, refl=1.0):
    """Wasseroberfläche in Zeilen [y0,y1) für Spalten colmask. Spiegelt den Inhalt oberhalb y0."""
    y0i = int(max(0, math.floor(y0)))
    y1i = int(min(H, math.ceil(y1)))
    if y1i <= y0i or not colmask.any():
        return
    ys = np.arange(y0i, y1i)
    n = ys.size
    dist = F * max(CAM - Hm, 1.0) / np.maximum(ys - YH, 1.0)  # m
    near = clamp(1.0 - (ys - YH) / 1300.0)
    rt = ripple_tex()
    roff = int(t * 40) % W
    rr = rt[(ys * 3 + int(t * 25)) % rt.shape[0]][:, roff:roff + W]
    amp = (2.0 + 26.0 * clamp((ys - YH) / 1200.0)) * chop
    xs = np.arange(W)
    srcx = np.clip((xs[None, :] + rr * amp[:, None] * 2).astype(np.int32), 0, W - 1)
    srcy = np.clip(2 * y0i - ys - 1, 0, H - 1)
    refl_img = cv[srcy[:, None], srcx]
    # vertikale Verschmierung der Spiegelung
    k = max(2, int(7 * chop))
    rb = refl_img.copy()
    for s in range(1, k + 1):
        rb[s:] += refl_img[:-s]
    rb /= (k + 1)
    rb = rb * rb * 2.2
    fres = (0.25 + 0.55 * near)[:, None, None]
    base = np.array([0.004, 0.009, 0.016], np.float32)
    skyc = np.array([0.05, 0.058, 0.07], np.float32)
    col = base * (1 - fres) + skyc * fres
    col = col + rb * refl * (0.6 + 0.4 * near[:, None, None])
    # Glanzlichter
    spark = clamp(rr * 6 - 2.2)[..., None] * 0.04 * chop
    col = col + spark * np.array([0.6, 0.7, 0.8], np.float32)
    if murk > 0:
        col = col * (1 - 0.15 * murk) + np.array([0.012, 0.016, 0.012], np.float32) * murk
    if foam > 0:
        fd = clamp(1 - (ys - y0i) / max(3.0, (y1i - y0i) * 0.08))[:, None, None]
        fn = clamp(rr[..., None] * 3 + 0.6)
        col = col + fd * fn * foam * 0.5
    m = colmask[None, :, None]
    cv[y0i:y1i] = np.where(m, col, cv[y0i:y1i])


def render(t, Hm=0.0, H_of=None, sky_scroll=0.0, flash=0.0, murk=0.0, people=None,
           sirens=0.0, beacon_t=None, wave=None, chop=1.0, slab_foam=None):
    """Hm: Meeresspiegel in m (relativ zu heute). H_of: optionale Funktion name->Pegel.
    wave: dict(z=..., h=...) Flutwelle, die sich von der Kamera weg auf die Stadt zubewegt."""
    cv = sky(t, sky_scroll, flash)
    S = slabs()
    beacons = []
    imgs = []
    for i, s in enumerate(S):
        y0s, rgbc, a = slab_arr(i)
        if y0s < H:
            cv[y0s:] = cv[y0s:] * (1 - a) + rgbc * a
        if s.z in FOG:
            fog_band(cv, y_of(s.z, float(s.e.mean())), FOG[s.z], t)
        beacons += s.beacons
        h_here = Hm if H_of is None else H_of(s)
        # Welle: Kamm hinter dieser Schicht?
        if wave is not None and i + 1 < len(S) and S[i + 1].z < wave["z"] <= s.z:
            pass
        nxt = S[i + 1].z if i + 1 < len(S) else 1.0
        wet = s.e < h_here
        if wet.any():
            y0 = y_of(s.z, h_here)
            y1 = y_of(nxt, h_here) if i + 1 < len(S) else H
            ff = 0.0 if slab_foam is None else slab_foam(s)
            water_band(cv, y0, y1 + 1, wet, h_here, t, murk=murk, foam=ff, chop=chop)
        if wave is not None and (i + 1 == len(S) or S[i + 1].z < wave["z"]) and s.z >= wave["z"]:
            cv = draw_wave(cv, wave, t)
            wave = None
    # Leuchtfeuer (blinkend)
    if beacon_t is not None:
        on = (math.sin(beacon_t * 5.5) > 0.2)
        if on:
            m = np.zeros((H, W), np.float32)
            for (x, y) in beacons:
                xi, yi = int(x), int(y)
                if 0 <= xi < W and 0 <= yi < H:
                    m[yi, xi] = 1
            g = blur(m, 3) * 40
            cv += g[..., None] * np.array([1.0, 0.1, 0.05], np.float32)
    return cv


def draw_wave(cv, wave, t):
    """Wellenkamm in Entfernung z mit Höhe h (m), Rückansicht mit Gischt."""
    z, hgt = wave["z"], wave["h"]
    yb = y_of(z, 0.0)
    yt = y_of(z, hgt)
    if yb <= yt or yt > H:
        return cv
    rt = ripple_tex()
    xs = np.arange(W, dtype=np.float32)
    off = int(t * 90) % W
    crest = yt + rt[int(t * 30) % rt.shape[0], off:off + W] * (yb - yt) * 0.5
    sp_h = (yb - yt) * 1.6 * wave.get("spray", 1.0)
    y0 = int(max(0, yt - sp_h - 20))
    y1 = int(min(H, yb + 2))
    ys = np.arange(y0, y1, dtype=np.float32)[:, None]
    nz = rt[(np.arange(y0, y1) * 2 + int(t * 60)) % rt.shape[0]][:, off:off + W]
    rel = (ys - crest[None, :]) / max(1.0, yb - yt)
    face = (rel >= 0)
    foam = clamp(1.0 - rel * 1.3 + nz * 2.0) * face
    col = np.array([0.02, 0.04, 0.05], np.float32) * (1 - foam[..., None]) + np.array([0.7, 0.75, 0.8], np.float32) * foam[..., None]
    seg = cv[y0:y1]
    seg = np.where(face[..., None], col, seg)
    spray = clamp(1 + rel * (yb - yt) / max(sp_h, 1) + nz * 1.5) * (~face)
    spray = blur(spray.astype(np.float32), 5)
    seg = seg * (1 - spray[..., None] * 0.75) + spray[..., None] * np.array([0.55, 0.6, 0.66], np.float32) * 0.85
    cv[y0:y1] = seg
    return cv
