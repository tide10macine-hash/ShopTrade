"""3D-Erdkugel: orthografischer Raycast auf NASA-Texturen (Blue Marble, Nachtlichter,
Wolken, Topografie). Enthält die schematische +65–70-m-Überflutungsmaske."""
import functools
import math
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

from lib import ASSETS, H, W, blur, clamp, sstep

TW, TH = 4096, 2048


def _load(name, mode="RGB"):
    return np.asarray(Image.open(os.path.join(ASSETS, name)).convert(mode))


@functools.lru_cache(None)
def tex():
    day = _load("earth-blue-marble.jpg")
    night = _load("earth-night.jpg")
    clouds = _load("clouds.png", "L")
    topo = np.asarray(Image.open(os.path.join(ASSETS, "earth-topology.png")).convert("L")).astype(np.int16)
    water = np.asarray(Image.open(os.path.join(ASSETS, "earth-water.png")).convert("L").resize((2048, 1024), Image.NEAREST)) > 128
    land = ~water
    lat = (0.5 - (np.arange(1024) + 0.5) / 1024) * 180
    latg = np.repeat(lat[:, None], 2048, 1)
    # Kandidaten: tief liegendes Land (schematische Schwelle aus der Reliefkarte)
    cand = land & (topo <= 2) & (latg > -60) & (latg < 75)
    lab, n = ndimage.label(cand | water)
    sizes = ndimage.sum(water, lab, index=np.arange(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes > 900  # nur mit Ozean/Meeren verbundene Senken
    flood = cand & keep[lab]
    # leicht glätten
    flood = ndimage.binary_opening(flood, iterations=1) | (flood & ndimage.binary_erosion(flood))

    def up(m):
        im = Image.fromarray((m * 255).astype(np.uint8)).resize((TW, TH), Image.BILINEAR)
        return np.asarray(im) > 127

    land4 = up(land)
    flood4 = up(flood) & land4
    newland4 = land4 & ~flood4

    def edge(m, r=1.6):
        e = (m ^ ndimage.binary_erosion(m, iterations=1)).astype(np.float32)
        e = np.asarray(Image.fromarray(e * 255).convert("L").filter(ImageFilter.GaussianBlur(r)), np.float32) / 255
        return (clamp(e * 3.0) * 255).astype(np.uint8)

    coast_now = edge(land4)
    coast_new = edge(newland4)
    # Höhenlinien (transparente Höhenkarte)
    tq = (np.asarray(Image.fromarray(topo.astype(np.uint8)).resize((TW, TH), Image.BILINEAR)).astype(np.int16) // 22)
    cont = ((tq != np.roll(tq, 1, 0)) | (tq != np.roll(tq, 1, 1))) & land4
    cont = (cont * 255).astype(np.uint8)
    return dict(day=day, night=night, clouds=clouds, land=land4, flood=flood4.astype(np.uint8) * 255,
                coast_now=coast_now, coast_new=coast_new, cont=cont)


@functools.lru_cache(None)
def stars():
    im = Image.open(os.path.join(ASSETS, "night-sky.png")).convert("RGB")
    im = im.crop((600, 300, 600 + 1300, 300 + 2311)).resize((W, H), Image.BICUBIC)
    a = np.asarray(im, np.float32) / 255
    a = a ** 1.6 * 0.9
    return a


def _sample(t, u, v):
    """Bilineares Abtasten einer uint8-Textur an float-Koordinaten (u wrap)."""
    th, tw = t.shape[:2]
    u0 = np.floor(u).astype(np.int32)
    v0 = np.floor(v).astype(np.int32)
    fu = (u - u0).astype(np.float32)
    fv = (v - v0).astype(np.float32)
    u0 %= tw
    u1 = (u0 + 1) % tw
    v0 = np.clip(v0, 0, th - 1)
    v1 = np.clip(v0 + 1, 0, th - 1)
    if t.ndim == 3:
        fu = fu[:, None]
        fv = fv[:, None]
    a = t[v0, u0].astype(np.float32)
    b = t[v0, u1].astype(np.float32)
    c = t[v1, u0].astype(np.float32)
    d = t[v1, u1].astype(np.float32)
    return ((a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv) / 255.0


def render(cx=W / 2, cy=H / 2, R=450.0, lon0=0.0, lat0=20.0, roll=0.0,
           sun=(-0.6, 0.35, 0.5), flood=0.0, coast_now=0.0, coast_new=0.0,
           contours=0.0, cloud_amt=0.85, cloud_shift=0.0, night_gain=1.0,
           day_gain=0.7, star_amt=1.0, wipe_x=None, bg=None, desat=0.35):
    """Rendert die Erde. Winkel in Grad. sun: Richtung im Bildschirmraum (x rechts, y oben, z zum Betrachter).
    wipe_x: Bildschirm-x, rechts davon wird die Überflutung (flood=1) gezeigt, links heute."""
    T = tex()
    out = (stars() * star_amt).copy() if bg is None else bg.copy()
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx - cx) / R
    ny = -(yy - cy) / R
    r2 = nx * nx + ny * ny
    # Atmosphärenhalo außen
    r = np.sqrt(r2)
    s = np.array(sun, np.float32)
    s = s / np.linalg.norm(s)
    ang = (nx * s[0] + ny * s[1]) / np.maximum(r, 1e-4)
    halo = np.exp(-np.maximum(r - 1, 0) / 0.035) * (r >= 1)
    halo_col = np.array([0.25, 0.5, 1.0], np.float32)
    out += (halo * (0.35 + 0.65 * clamp(ang * 0.8 + 0.4)))[..., None] * halo_col * 0.9
    inside = r2 < 1.0
    iy, ix = np.nonzero(inside)
    if iy.size == 0:
        return out
    x = nx[iy, ix]
    y = ny[iy, ix]
    z = np.sqrt(np.maximum(0, 1 - x * x - y * y))
    # Roll im Bildschirmraum
    cr, sr = math.cos(math.radians(roll)), math.sin(math.radians(roll))
    x, y = cr * x - sr * y, sr * x + cr * y
    la, lo = math.radians(lat0), math.radians(lon0)
    # Rx(-lat0)
    y1 = y * math.cos(-la) - z * math.sin(-la)
    z1 = y * math.sin(-la) + z * math.cos(-la)
    x1 = x
    # Ry(lon0)
    x2 = x1 * math.cos(lo) + z1 * math.sin(lo)
    z2 = -x1 * math.sin(lo) + z1 * math.cos(lo)
    lon = np.arctan2(x2, z2)
    lat = np.arcsin(np.clip(y1, -1, 1))
    u = (lon / (2 * math.pi) + 0.5) * TW
    v = (0.5 - lat / math.pi) * TH
    day = _sample(T["day"], u, v)
    night = _sample(T["night"], u, v)
    # Beleuchtung im Bildschirmraum (Normal = (x_orig, y_orig, z))
    xo = nx[iy, ix]
    yo = ny[iy, ix]
    ndl = xo * s[0] + yo * s[1] + z * s[2]
    lit = sstep(-0.12, 0.35, ndl)
    landm = T["land"][np.clip(v.astype(np.int32), 0, TH - 1), u.astype(np.int32) % TW]
    gray = day.mean(1, keepdims=True)
    day = day * (1 - desat) + gray * desat
    day = day * np.array([0.82, 0.92, 1.05], np.float32)
    col = day * (0.03 + 1.05 * lit[:, None]) * day_gain
    # Ozean-Glanz
    hx, hy, hz = s[0], s[1], s[2] + 1
    hn = math.sqrt(hx * hx + hy * hy + hz * hz)
    ndh = (xo * hx + yo * hy + z * hz) / hn
    spec = np.clip(ndh, 0, 1) ** 60 * (~landm) * lit
    col += spec[:, None] * np.array([0.7, 0.8, 0.9], np.float32) * 0.6
    # Nachtlichter
    nl = night.mean(1) ** 1.3
    lights_off = np.zeros_like(nl)
    fl = _sample(T["flood"], u, v)
    fmask = fl
    if wipe_x is not None:
        side = clamp((wipe_x - xx[iy, ix]) / 3.0 + 0.5)
        famt = flood * side
    else:
        famt = np.full_like(fl, flood)
    lights_off = fmask * famt
    nl = nl * (1 - lights_off)
    col += (nl * (1 - lit) * 1.8 * night_gain)[:, None] * np.array([1.0, 0.62, 0.28], np.float32)
    # Wolken
    if cloud_amt > 0:
        cu = u + cloud_shift * TW / 360.0
        cl = _sample(T["clouds"], cu, v) ** 1.5 * cloud_amt * 0.8
        ccol = (0.03 + 0.7 * lit)[:, None] * np.array([0.85, 0.9, 1.0], np.float32)
        col = col * (1 - cl[:, None]) + ccol * cl[:, None]
    # Überflutung: neue Meeresflächen
    if flood > 0:
        fa = (fmask * famt)[:, None]
        sea = np.array([0.02, 0.07, 0.16], np.float32) * (0.4 + 0.8 * lit[:, None])
        col = col * (1 - 0.85 * fa) + sea * 0.85 * fa
        col += fa * np.array([1.0, 0.35, 0.12], np.float32) * (0.10 + 0.08 * (1 - lit[:, None]))
    # Linien
    if coast_now > 0:
        cn = _sample(T["coast_now"], u, v)
        cna = coast_now * (1 - (famt if flood > 0 else 0) * 0.55)
        col += (cn * cna)[:, None] * np.array([0.55, 0.85, 1.0], np.float32) * 0.9
    if coast_new > 0:
        cw = _sample(T["coast_new"], u, v)
        cwa = coast_new * (famt if wipe_x is not None else 1.0)
        col += (cw * cwa)[:, None] * np.array([1.0, 0.55, 0.2], np.float32) * 1.4
    if contours > 0:
        ct = _sample(T["cont"], u, v)
        col += (ct * contours)[:, None] * np.array([0.3, 0.6, 0.9], np.float32) * 0.25
    # Atmosphärenrand (Fresnel)
    fres = (1 - z) ** 2.5
    col = col * (1 - 0.5 * fres[:, None]) + fres[:, None] * np.array([0.25, 0.5, 1.0], np.float32) * (0.25 + 0.9 * clamp(ndl + 0.3))[:, None]
    # Kantenglättung
    edge = clamp((1 - np.sqrt(r2[iy, ix])) * R / 1.5)[:, None]
    out[iy, ix] = out[iy, ix] * (1 - edge) + col * edge
    return out
