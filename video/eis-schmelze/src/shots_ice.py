"""Szenen mit Eis: Eisklippe, Schelfeis von oben, Unterwasser, Küste mit Welle (Draufsicht)."""
import functools
import math

import numpy as np
from PIL import Image, ImageDraw

from lib import H, W, affine, blur, clamp, ease_io, ease_out, fbm, fstep, from_img, noise, perspective_coeffs, resize_f, sstep, to_img
import city

ICE_DEEP = np.array([0.02, 0.09, 0.17], np.float32)
ICE_MID = np.array([0.22, 0.45, 0.62], np.float32)
ICE_HI = np.array([0.82, 0.92, 1.0], np.float32)


def ice_color(v):
    v = v[..., None]
    c = ICE_DEEP * (1 - sstep(0.0, 0.6, v)) + ICE_MID * sstep(0.0, 0.6, v)
    c = c * (1 - sstep(0.55, 0.95, v)) + ICE_HI * sstep(0.55, 0.95, v)
    return c


# ------------------------------------------------------------------ Eisklippe
@functools.lru_cache(None)
def cliff_tex():
    h, w = 1300, 3400
    stri = fbm(h, w, 3, 6, seed=1, ay=0.35, ax=5.0)
    layers = fbm(h, w, 4, 4, seed=2, ay=4.0, ax=0.4)
    det = fbm(h, w, 12, 4, seed=3)
    cols = fbm(1, w, 20, 4, seed=4)[0][None, :]
    v = 0.5 * stri + 0.15 * layers + 0.25 * det + 0.18 * cols - 0.05
    crev = clamp(1 - np.abs(stri - 0.5) * 18) * 0.7 + clamp(0.12 - cols) * 3.0 * clamp(det * 2 - 0.5)
    hs = np.gradient(cols[0] * 6)[None, :] * 40
    col = ice_color(clamp(v + hs * 0.3)) * (1 - 0.8 * clamp(crev)[..., None])
    # Schneekappe oben
    yy = np.arange(h, dtype=np.float32)[:, None]
    cap = clamp(1 - yy / 70)
    col = col * (1 - cap[..., None]) + np.array([0.75, 0.82, 0.9], np.float32) * cap[..., None]
    return to_img(col)


def _quad_warp(img, dst, src_box, size=(W, H)):
    x0, y0, x1, y1 = src_box
    src = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    co = perspective_coeffs(dst, src)
    return img.transform(size, Image.PERSPECTIVE, co, resample=Image.BILINEAR)


def stormy_sky(t, bright=1.0, scroll=0.0):
    a = city.sky(t, scroll, 0.0, glow=0.2)
    yy = np.arange(H, dtype=np.float32)[:, None, None]
    a = a * 1.6 * bright + np.array([0.03, 0.04, 0.05], np.float32) * clamp(1 - yy / 900)
    return a


def shot_icecliff(lt, dur, fi):
    tex = cliff_tex()
    # Kamera rast entlang der Wand, bremst beim Abbruch ab
    speed = 2600 * (1 - fstep(0.15, 0.6, lt)) + 120
    xoff = 2600 * min(lt, 0.6) - 2600 * (fstep(0.15, 0.6, min(lt, 0.6)) * 0.45 * 0.6) + 120 * lt
    sky = stormy_sky(lt, 1.0, lt * 60)
    out = sky.copy()
    # Meer
    yy = np.arange(H, dtype=np.float32)
    sea_top = 1480
    sea = np.zeros((H, W, 3), np.float32)
    rt = city.ripple_tex()
    for_rows = np.arange(sea_top, H)
    rr = rt[(for_rows * 2 + int(lt * 200)) % rt.shape[0]][:, :W]
    sea[sea_top:] = np.array([0.01, 0.025, 0.04], np.float32) + clamp(rr * 4 + 0.3)[..., None] * 0.04
    out[sea_top:] = sea[sea_top:]
    # Wand: perspektivisches Viereck (links nah, rechts fern) mit Bewegungsunschärfe
    dst = [(-260, 60), (W + 40, 520), (W + 40, 1360), (-260, 1560)]
    acc = None
    nsub = 4 if speed > 600 else 1
    for k in range(nsub):
        xo = (xoff + speed * (k / nsub) / 30.0) % (3400 - 1500)
        im = _quad_warp(tex, dst, (xo, 0, xo + 1500, 1300))
        a = np.asarray(im, np.float32) / 255
        acc = a if acc is None else acc + a
    wall = acc / nsub
    mask_im = Image.new("L", (W, H), 0)
    top = []
    tn = _top_noise()
    for k in range(0, 61):
        fx = k / 60
        x = -260 + (W + 300) * fx
        y = 60 + 460 * fx + tn[int((k * 37 + xoff * 0.35) % 1000)] * (160 - 110 * fx)
        top.append((x, y))
    ImageDraw.Draw(mask_im).polygon(top + [(W + 40, 1360), (-260, 1560)], fill=255)
    wm = np.asarray(mask_im, np.float32)[..., None] / 255
    # Licht: Wand heller oben, Nebel unten
    shade = (0.65 + 0.6 * clamp(1 - yy / 1500))[:, None, None]
    wall = wall * shade
    xx_ = np.arange(W, dtype=np.float32)[None, :, None]
    fogm = clamp((xx_ - 350) / 900) * 0.55
    wall = wall * (1 - fogm) + np.array([0.12, 0.14, 0.17], np.float32) * fogm
    out = out * (1 - wm) + wall * wm
    # Abbruch
    crack_t = 0.32
    fall_t = 0.55
    slab_poly = [(120, 250), (300, 300), (430, 330), (560, 420), (500, 560), (540, 700), (520, 760), (640, 900), (610, 1050), (560, 1200), (500, 1360), (260, 1440), (60, 1490), (-40, 900)]
    if lt > crack_t:
        cr = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(cr)
        grow = fstep(crack_t, fall_t, lt)
        pts = slab_poly[1:6]
        n = max(2, int(len(pts) * grow + 1))
        d.line(pts[:n], fill=255, width=int(4 + 10 * grow))
        cm = np.asarray(cr, np.float32) / 255
        gl = blur(cm, 8)
        out = out * (1 - cm[..., None] * 0.9) + gl[..., None] * np.array([0.5, 0.8, 1.0], np.float32) * 1.2
    if lt > fall_t:
        f = lt - fall_t
        # Loch: frisches, tiefblaues Eis
        hole = Image.new("L", (W, H), 0)
        ImageDraw.Draw(hole).polygon(slab_poly, fill=255)
        hm = np.asarray(hole, np.float32)[..., None] / 255
        fresh = _fresh_ice()
        fresh_img = out * (1 - hm) + fresh * hm
        # Platte fällt (Translation + Rotation + Vergrößerung zur Kamera)
        dy = 0.5 * 2600 * f * f
        rot = -0.35 * f * f
        zoom = 1 + 0.25 * f
        slab_im = to_img(out)
        sl_mask = hole
        # Affin: Quelle = R^-1 (dst - c)/zoom + c - (0,dy)
        cx, cy = 300, 1000
        c_, s_ = math.cos(rot), math.sin(rot)
        a0, b0 = c_ / zoom, s_ / zoom
        d0, e0 = -s_ / zoom, c_ / zoom
        tx = cx - (a0 * (cx) + b0 * (cy + dy))
        ty = cy - (d0 * (cx) + e0 * (cy + dy))
        moved = slab_im.transform((W, H), Image.AFFINE, (a0, b0, tx, d0, e0, ty), resample=Image.BILINEAR)
        mmask = sl_mask.transform((W, H), Image.AFFINE, (a0, b0, tx, d0, e0, ty), resample=Image.BILINEAR)
        mm = np.asarray(mmask, np.float32)[..., None] / 255
        # Unterkante unter Wasser abschneiden
        mm[sea_top + 20:] *= 0.0
        out = fresh_img * (1 - mm) + from_img(moved) * mm * 0.9
        # Eissplitter
        r = np.random.default_rng(3)
        lay = Image.new("RGB", (W, H), (0, 0, 0))
        dl = ImageDraw.Draw(lay)
        for k in range(70):
            x0 = r.uniform(80, 620)
            y0 = r.uniform(350, 1300)
            vx = r.normal(-60, 140)
            vy = r.uniform(-200, 100)
            x = x0 + vx * f
            y = y0 + vy * f + 0.5 * 2600 * f * f
            if y > sea_top + 30:
                continue
            sz = r.uniform(6, 38)
            ang = r.uniform(0, 6.28) + f * r.normal(0, 6)
            pts = [(x + sz * math.cos(ang + j * 2.1 + r.uniform(-.4, .4)), y + sz * math.sin(ang + j * 2.1)) for j in range(3)]
            b = r.uniform(0.45, 1.0)
            dl.polygon(pts, fill=(int(170 * b), int(215 * b), int(240 * b)))
        sh = np.asarray(lay, np.float32) / 255
        shm = (sh.max(-1, keepdims=True) > 0)
        out = np.where(shm, sh, out)
        # Staubwolke (Eispulver)
        pw = fbm(H // 4, W // 4, 3, 4, seed=int(5 + f * 0)) if False else None
        cloud = _powder(f, (300, 900))
        out = out * (1 - cloud[..., None] * 0.8) + cloud[..., None] * np.array([0.7, 0.78, 0.85], np.float32)
    # Aufschlag + Gischtfontäne
    imp_t = 1.05
    if lt > imp_t:
        f = lt - imp_t
        out = splash_plume(out, f, 320, sea_top + 10, 620, 1.0)
    # Gischt am Wandfuß
    foam = clamp((rr[:60] * 5 + 0.5))
    out[sea_top:sea_top + 60] += foam[..., None] * 0.25 * np.linspace(1, 0, 60)[:, None, None]
    # Kamerawackeln
    return out


@functools.lru_cache(None)
def _fresh_ice():
    v = resize_f(fbm(H // 2, W // 2, 5, 5, seed=9), W, H)
    return (ice_color(v * 0.55 + 0.1) * 1.15).astype(np.float32)


@functools.lru_cache(None)
def _block_tex():
    v = resize_f(fbm(H // 2, W // 2, 4, 5, seed=19), W, H)
    d = resize_f(fbm(H // 2, W // 2, 16, 3, seed=20), W, H)
    return (0.55 * v + 0.45 * d).astype(np.float32)


@functools.lru_cache(None)
def _top_noise():
    a = noise(1, 1000, 1, 60, 17)[0] - 0.5
    b = noise(1, 1000, 1, 300, 18)[0] - 0.5
    return (a * 1.0 + b * 0.5).astype(np.float32)


@functools.lru_cache(None)
def _powder_tex():
    return fbm(H // 4, W // 4, 3, 5, seed=12)


def _powder(f, center):
    tx = _powder_tex()
    yy, xx = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32)
    cx, cy = center[0] / 4, center[1] / 4
    rad = 40 + 260 * ease_out(min(f / 1.0, 1))
    d = np.sqrt(((xx - cx) / 1.2) ** 2 + ((yy - cy - 30 * f * 4) / 1.6) ** 2)
    m = clamp(1 - d / rad) ** 0.8 * clamp(tx * 1.6 - 0.2)
    m = m * clamp(f * 4) * (0.9 - 0.3 * f)
    return resize_f(m.astype(np.float32), W, H)


def splash_plume(out, f, x, y, width, power=1.0, seed=7, n=900):
    """Gischtfontäne: Partikel ballistisch + Nebelschleier."""
    r = np.random.default_rng(seed)
    vx = r.normal(0, 260, n) * width / 600
    vy = -r.uniform(300, 1700, n) * power
    x0 = x + r.uniform(-width / 2, width / 2, n)
    g = 1500
    px = x0 + vx * f
    py = y + vy * f + 0.5 * g * f * f
    ok = py < y + 5
    rs = r.uniform(2, 9, n) * (1 + f)
    lay = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lay)
    for X, Y, R_ in zip(px[ok], py[ok], rs[ok]):
        d.ellipse((X - R_, Y - R_, X + R_, Y + R_), fill=200)
    m = np.asarray(lay, np.float32) / 255
    m = blur(m, 2) * 0.8 + blur(m, 14) * 1.6
    # Nebelschleier
    hgt = 1700 * power * min(f, 0.8)
    yy = np.arange(H, dtype=np.float32)[:, None]
    xx = np.arange(W, dtype=np.float32)[None, :]
    veil = clamp(1 - np.abs(xx - x) / (width * (0.8 + f))) * clamp((yy - (y - hgt)) / max(hgt, 1)) * (yy < y + 30)
    veil = veil * clamp(f * 3) * 0.55
    m = clamp(m + veil)
    return out * (1 - m[..., None] * 0.85) + m[..., None] * np.array([0.78, 0.85, 0.9], np.float32)


# ------------------------------------------------------------------ Schelfeis von oben
@functools.lru_cache(None)
def shelf_tex():
    h, w = int(H * 1.3), int(W * 1.6)
    base = fbm(h, w, 3, 6, seed=21)
    det = fbm(h, w, 14, 4, seed=22)
    yy0, xx0 = np.mgrid[0:h, 0:w].astype(np.float32)
    warp = fbm(h, w, 2, 4, seed=26)
    phase = yy0 * 0.045 + xx0 * 0.012 + warp * 14
    zone = sstep(0.3, 0.6, fbm(h, w, 3, 4, seed=27))
    crev = clamp(1.25 - np.abs(np.sin(phase)) * 6) * zone
    crev = crev * clamp(det * 2.2 - 0.4)
    relief = base * 1.0 + det * 0.25 - crev * 0.4
    gy, gx = np.gradient(relief * 60)
    hs = clamp(0.62 - gx * 0.5 + gy * 0.35)
    v = 0.55 + 0.35 * hs
    col = np.array([0.80, 0.87, 0.94], np.float32) * v[..., None]
    col = col * (1 - crev[..., None] * 0.85) + crev[..., None] * np.array([0.03, 0.14, 0.26], np.float32) * 0.85
    # Kante (Schelfeisfront) unten: Meer
    xs = np.arange(w)
    edge = (0.70 * h + 60 * (noise(1, w, 1, 6, 5)[0] - 0.5) * 2 + 18 * (noise(1, w, 1, 40, 6)[0] - 0.5)).astype(np.float32)
    yy = np.arange(h, dtype=np.float32)[:, None]
    land = (yy < edge[None, :]).astype(np.float32)
    ocean = np.array([0.008, 0.02, 0.035], np.float32) + (fbm(h, w, 10, 3, seed=24)[..., None] - 0.5) * 0.02
    # Treibeis im Meer
    brash = clamp(fbm(h, w, 24, 3, seed=25) * 3 - 2.1) * clamp(1 - (yy - edge[None, :]) / 300)
    ocean = ocean + brash[..., None] * 0.6
    # Schattenkante
    cliff = clamp(1 - np.abs(yy - edge[None, :]) / 6)[..., None]
    col = col * land[..., None] + ocean * (1 - land[..., None])
    col = col * (1 - cliff * 0.5)
    return col.astype(np.float32), edge, land


def shot_shelf(lt, dur, fi):
    col, edge, land = shelf_tex()
    h, w = col.shape[:2]
    u = lt / dur
    # Riss quer über das Schelfeis (oberhalb der Front)
    xs = np.arange(w, dtype=np.float32)
    crack_y = 0.52 * h + 40 * np.sin(xs / 140) + 25 * (noise(1, w, 1, 30, 31)[0] - 0.5) * 2
    grow = ease_io(fstep(0.08, 0.5, u))
    front_x = grow * w
    img = col.copy()
    yy = np.arange(h, dtype=np.float32)[:, None]
    open_w = 2 + 30 * fstep(0.45, 0.75, u)
    cm = clamp(1 - np.abs(yy - crack_y[None, :]) / open_w) * (xs[None, :] < front_x)
    img = img * (1 - cm[..., None]) + cm[..., None] * np.array([0.0, 0.03, 0.06], np.float32)
    glow = blur(cm.astype(np.float32), 6)
    img = img + glow[..., None] * np.array([0.1, 0.35, 0.55], np.float32) * (1 - fstep(0.6, 0.9, u) * 0.5)
    # Kalben: unteres Stück driftet ab und kippt
    cv = u > 0.55
    if cv:
        f = fstep(0.55, 1.0, u)
        piece = (yy > crack_y[None, :]) & (land > 0.5)
        pm = piece.astype(np.float32)
        pimg = to_img(img)
        dy = 260 * f ** 1.5
        rot = 0.05 * f
        ang = rot
        c_, s_ = math.cos(ang), math.sin(ang)
        cx, cy = w / 2, h * 0.75
        a0, b0, d0, e0 = c_, s_, -s_, c_
        tx = cx - (a0 * cx + b0 * (cy + dy))
        ty = cy - (d0 * cx + e0 * (cy + dy))
        moved = from_img(pimg.transform((w, h), Image.AFFINE, (a0, b0, tx, d0, e0, ty), resample=Image.BILINEAR))
        mmask = np.asarray(Image.fromarray((pm * 255).astype(np.uint8)).transform((w, h), Image.AFFINE, (a0, b0, tx, d0, e0, ty), resample=Image.BILINEAR), np.float32)[..., None] / 255
        ocean = np.array([0.006, 0.018, 0.03], np.float32)
        base = img * (1 - pm[..., None]) + ocean * pm[..., None]
        # Schaum im Spalt
        foam = clamp(fbm(h // 4, w // 4, 8, 3, seed=40 + int(f * 10)) * 2.5 - 1.2)
        foam = resize_f(foam.astype(np.float32), w, h) * pm * clamp(1 - mmask[..., 0])
        base = base + foam[..., None] * 0.5
        shade = 1 - 0.45 * f
        img = base * (1 - mmask) + moved * mmask * shade
    # Kamera: sinkt + dreht
    z = 1.0 + 0.22 * ease_io(u)
    out = affine(img, zoom=z * W / (w * 0.62), cx=w / 2, cy=h * 0.56, rot=math.radians(-3 + 6 * u), out=(W, H))
    # Licht: kalter Sonnenstreifen
    yyo = np.arange(H, dtype=np.float32)[:, None, None]
    out = out * (0.62 + 0.3 * clamp(1 - yyo / H))
    return out


# ------------------------------------------------------------------ Unterwasser
@functools.lru_cache(None)
def _ice_block_shapes():
    r = np.random.default_rng(55)
    shapes = []
    for k in range(3):
        n = 11
        rad = r.uniform(0.7, 1.0, n)
        pts = [(math.cos(i / n * 6.283) * rad[i], math.sin(i / n * 6.283) * rad[i] * 0.7) for i in range(n)]
        shapes.append(pts)
    return shapes


def shot_underwater(lt, dur, fi):
    u = lt / dur
    yy = np.arange(H, dtype=np.float32)[:, None]
    xx = np.arange(W, dtype=np.float32)[None, :]
    surf = np.array([0.05, 0.2, 0.25], np.float32)
    deep = np.array([0.0, 0.01, 0.025], np.float32)
    g = clamp(yy / 1500) ** 0.7
    out = (surf * (1 - g[..., None]) + deep * g[..., None]) * np.ones((1, W, 1), np.float32)
    # Lichtstrahlen
    ang = np.arctan2(xx - W / 2, yy + 300)
    rays = noise(1, 600, 1, 40, 61)[0]
    ri = ((ang + 1.2) / 2.4 * 599).clip(0, 599).astype(int)
    rv = rays[ri] ** 3 * clamp(1 - yy / 1400)
    sh = math.sin(lt * 1.3) * 0.1
    out += rv[..., None] * np.array([0.25, 0.45, 0.45], np.float32) * 0.35
    # Oberfläche: Kaustik oben
    caus = noise(160, W // 4, 6, 24, 62 + int(lt * 8))
    out[:160] += (resize_f(caus, W, 160) ** 4)[..., None] * 0.35 * clamp(1 - np.arange(160) / 160)[:, None, None]
    # Sediment am Grund, steigt auf
    sed = resize_f(fbm(H // 4, W // 4, 3, 5, seed=63), W, H)
    rise = 1920 - 700 * ease_out(u) - 300
    sm = clamp((yy - rise) / 600) * clamp(sed * 1.8 - 0.3)
    out = out * (1 - sm[..., None] * 0.85) + sm[..., None] * np.array([0.09, 0.08, 0.06], np.float32)
    # Eisblöcke stürzen herein
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    blocks = [(330, 380, 0.0, 0.35), (780, 300, 0.3, -0.25), (560, 230, 0.7, 0.2)]
    bubbles = []
    for (bx, size, t0, spin), shape in zip(blocks, _ice_block_shapes()):
        f = lt - t0
        if f < 0:
            continue
        y = -size * 0.6 + 1300 * (1 - math.exp(-f * 1.4))
        a = spin * f
        pts = [(bx + size * (px * math.cos(a) - py * math.sin(a)), y + size * (px * math.sin(a) + py * math.cos(a))) for px, py in shape]
        d.polygon(pts, fill=(150, 200, 225, 255))
        bubbles.append((bx, y, size, f))
    bl = np.asarray(lay, np.float32) / 255
    bm = bl[..., 3:4]
    if bm.max() > 0:
        tex = _block_tex()[..., None]
        bcol = (0.3 + 0.9 * tex) * np.array([0.45, 0.78, 0.95], np.float32) * (0.3 + 0.7 * clamp(1 - yy / 1500))[..., None]
        edge = clamp(bm[..., 0] - blur(bm[..., 0], 6))
        bcol = bcol + edge[..., None] * 0.6
        out = out * (1 - bm * 0.92) + bcol * bm * 0.92
    # Blasen
    r = np.random.default_rng(70)
    lay = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lay)
    for (bx, by, size, f) in bubbles:
        n = 520
        sx = bx + r.normal(0, size * 0.45, n)
        birth = r.uniform(0, max(f, 0.01), n)
        age = f - birth
        sy = by - size * 0.3 + r.normal(0, size * 0.2, n) - age * r.uniform(200, 700, n)
        sx = sx + np.sin(age * 9 + r.uniform(0, 6, n)) * 8
        rad = r.uniform(1.5, 7, n)
        for X, Y, R_ in zip(sx, sy, rad):
            if Y > -10:
                d.ellipse((X - R_, Y - R_, X + R_, Y + R_), outline=190, width=1)
    m = np.asarray(lay, np.float32) / 255
    out += (m + blur(m, 3) * 0.6)[..., None] * np.array([0.6, 0.85, 0.95], np.float32) * 0.6
    # Trübung + Wackeln
    out = affine(out, zoom=1.06 + 0.04 * u, dx=8 * math.sin(lt * 9), dy=6 * math.cos(lt * 7))
    return out


# ------------------------------------------------------------------ Küste von oben mit Welle
@functools.lru_cache(None)
def coast_tex(seed=0):
    h, w = H, W
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    n = fbm(h, w, 3, 6, seed=80 + seed)
    # Land unten links, Meer oben rechts; Küstenlinie diagonal
    if seed == 0:
        grad = (yy / h) * 1.2 + (1 - xx / w) * 0.25
        hmap = grad + (n - 0.5) * 0.55 - 0.82
    else:
        grad = (yy / h) * 1.1 + (xx / w) * 0.4
        hmap = grad + (n - 0.5) * 0.6 - 0.95
    det = fbm(h, w, 16, 4, seed=90 + seed)
    land = sstep(-0.005, 0.005, hmap)
    gy, gx = np.gradient((hmap + det * 0.06) * 900)
    hs = clamp(0.55 - gx * 0.6 - gy * 0.45)[..., None]
    rock = np.array([0.06, 0.065, 0.07], np.float32) * (0.4 + 1.6 * hs)
    snow = sstep(0.3, 0.45, hmap + (det - 0.5) * 0.25)[..., None] * 0.8
    lcol = rock * (1 - snow) + np.array([0.5, 0.56, 0.62], np.float32) * snow * (0.3 + 1.0 * hs)
    # Ortschaft entlang der Küste
    town = (hmap > 0.01) & (hmap < 0.07)
    r = np.random.default_rng(5 + seed)
    lights = np.zeros((h, w), np.float32)
    ty, tx = np.nonzero(town)
    if ty.size:
        idx = r.choice(ty.size, min(1400, ty.size), replace=False)
        lights[ty[idx], tx[idx]] = r.uniform(0.4, 1.0, idx.size)
    lights = blur(lights, 1.2) * 5
    return hmap.astype(np.float32), land.astype(np.float32), lcol.astype(np.float32), lights


def shot_coast(lt, dur, fi, src=(1300, -500), speed=520, start=0.0, seed=0, trigger=None, zoom=(1.0, 1.15)):
    hmap, land, lcol, lights = coast_tex(seed)
    u = lt / dur
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    sx, sy = src
    d = np.sqrt((xx - sx) ** 2 + (yy - sy) ** 2)
    rad = (lt - start) * speed
    wl = 90.0
    crest = np.exp(-((d - rad) / wl) ** 2) * (lt > start)
    trough = np.exp(-((d - rad + 2.2 * wl) / (1.4 * wl)) ** 2) * (lt > start)
    rt = city.ripple_tex()
    small = noise(H // 4, W // 4, 30, 18, 99 + int(lt * 6)) - 0.5
    ripple = resize_f(small.astype(np.float32), W, H) * 0.25
    hgt = crest * 1.0 - trough * 0.45 + ripple
    gy, gx = np.gradient(hgt * 40)
    light = clamp(0.5 - gx * 0.35 - gy * 0.55)
    water = np.array([0.006, 0.02, 0.035], np.float32) + light[..., None] * np.array([0.06, 0.12, 0.16], np.float32)
    fz = resize_f(fbm(H // 4, W // 4, 12, 3, seed=121), W, H)
    foam = clamp(crest * 2.0 - 0.9 + (fz - 0.5) * 0.8)
    water = water + foam[..., None] * 0.75
    # Überflutung der Küste: Welle läuft auf das Land
    inund = clamp((rad - d) / 140) * (hmap < 0.09 * clamp((rad - d) / 400 + 0.2)) * (lt > start)
    inund = inund * land
    lightsk = lights * (1 - clamp(inund * 2))
    out = lcol * land[..., None] + water * (1 - land[..., None])
    out = out + lightsk[..., None] * np.array([1.0, 0.6, 0.25], np.float32) * 0.9
    out = out * (1 - inund[..., None] * 0.85) + inund[..., None] * (water * 0.8 + foam[..., None] * 0.3 + np.array([0.04, 0.05, 0.05], np.float32))
    # Auslöser: Eisblock stürzt ins Wasser
    if trigger is not None:
        tx_, ty_, t_imp = trigger
        if lt < t_imp + 0.05:
            f = clamp((lt - (t_imp - 0.8)) / 0.8)
            s = 160 * (1.4 - 0.5 * f)
            lay = Image.new("L", (W, H), 0)
            ImageDraw.Draw(lay).polygon([(tx_ - s, ty_ - s * 0.6 - 120 * (1 - f)), (tx_ + s * 0.8, ty_ - s * 0.7 - 120 * (1 - f)), (tx_ + s, ty_ + s * 0.5 - 120 * (1 - f)), (tx_ - s * 0.7, ty_ + s * 0.6 - 120 * (1 - f))], fill=255)
            m = np.asarray(lay, np.float32)[..., None] / 255
            out = out * (1 - m) + m * np.array([0.75, 0.85, 0.92], np.float32) * (0.8 + 0.2 * f)
            # Schatten
        if lt > t_imp:
            f = lt - t_imp
            ring = np.exp(-((np.sqrt((xx - tx_) ** 2 + (yy - ty_) ** 2) - f * 600) / 50) ** 2)
            burst = np.exp(-np.sqrt((xx - tx_) ** 2 + (yy - ty_) ** 2) / (80 + 500 * f)) * clamp(1.6 - f)
            out = out + (ring * clamp(1.5 - f) * 0.8 + burst * 1.2)[..., None] * np.array([0.8, 0.88, 0.92], np.float32)
    z = zoom[0] + (zoom[1] - zoom[0]) * ease_io(u)
    out = affine(out, zoom=z, rot=math.radians(2 * u - 1))
    return out
