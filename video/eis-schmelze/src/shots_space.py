"""Weltraum-Szenen: Erde (Titel), Aufstieg durch die Wolken, Küstenvergleich,
Regionen-Vergleich, Montage-Globen, Annäherung an dunkle Küste."""
import functools
import math

import numpy as np

import city
import globe
from lib import H, W, affine, blur, clamp, ease_in, ease_io, ease_out, fbm, fstep, resize_f

REGIONS = [
    ("NORDSEEKÜSTE · NIEDERLANDE", 5.0, 52.3),
    ("FLORIDA · GOLFKÜSTE", -83.0, 28.5),
    ("BANGLADESCH · GANGESDELTA", 90.0, 23.5),
    ("OSTCHINA · SHANGHAI", 119.5, 31.5),
]


def shot_earth_title(lt, dur, fi):
    u = lt / dur
    R = 400 + 90 * ease_out(u)
    return globe.render(cx=540, cy=1180, R=R, lon0=-40 + 10 * u, lat0=48, roll=-12,
                        sun=(-0.85, 0.35, 0.1), cloud_amt=0.55, cloud_shift=lt * 3, coast_now=0.0, night_gain=1.4)


@functools.lru_cache(None)
def _cloud_layers():
    return [fbm(H // 3, W // 3, 3, 6, seed=900 + k) for k in range(4)]


def shot_rise(lt, dur, fi):
    """Kamera steigt über die überflutete Stadt, durch Wolken, ins All."""
    u = lt / dur
    if u < 0.42:
        f = u / 0.42
        base = city.render(lt + 20, Hm=70.0, sky_scroll=lt * 300, murk=1.0, beacon_t=lt)
        base = base * 1.35
        out = affine(base, zoom=1.0 - 0.25 * ease_in(f), cy=900 - 500 * ease_in(f), dy=0)
    else:
        out = np.zeros((H, W, 3), np.float32)
    # Wolkentunnel
    cw = clamp((u - 0.25) / 0.2) * clamp((0.92 - u) / 0.15)
    if cw > 0:
        acc = np.zeros((H, W), np.float32)
        for k, lay in enumerate(_cloud_layers()):
            ph = (u * 2.2 + k * 0.25) % 1.0
            zoom = 0.8 + 3.5 * ph ** 2
            a = affine(np.repeat(lay[..., None], 3, -1), zoom=zoom * 3, cx=W / 6, cy=H / 6)[..., 0]
            alpha = clamp(ph * 4) * clamp((1 - ph) * 3)
            acc = np.maximum(acc, clamp(a * 1.5 - 0.35) * alpha)
        cc = np.array([0.42, 0.45, 0.5], np.float32) * (0.6 + 0.6 * acc[..., None])
        out = out * (1 - acc[..., None] * cw) + cc * acc[..., None] * cw
    if u > 0.72:
        f = (u - 0.72) / 0.28
        R = 3600 - 1800 * ease_out(f)
        g = globe.render(cx=540, cy=1920 + R * 0.55, R=R, lon0=-74, lat0=36 + 10 * f, sun=(-0.6, 0.6, 0.5),
                         cloud_amt=0.7, coast_now=0.0)
        a = clamp(f * 3)
        out = out * (1 - a) + g * a
    return out


def shot_globe_compare(lt, dur, fi):
    """0–4 s: Globus mit heutigen und +70-m-Küstenlinien; danach 4 Regionen mit Wischvergleich."""
    if lt < 4.0:
        u = lt / 4.0
        flood = fstep(0.9, 2.6, lt)
        return globe.render(cx=540, cy=1060, R=470 + 30 * u, lon0=-75 + 50 * u, lat0=28 - 5 * u, roll=-8,
                            sun=(-0.55, 0.45, 0.6), flood=flood, coast_now=1.0, coast_new=flood,
                            contours=0.5, cloud_amt=0.35, cloud_shift=lt * 4)
    k = min(3, int((lt - 4.0) / 1.15))
    lt2 = lt - 4.0 - k * 1.15
    name, lon, lat = REGIONS[k]
    f = clamp(lt2 / 1.15)
    wipe = -40 + (W + 80) * ease_io(clamp((f - 0.12) / 0.6))
    R = 4300 + 500 * f
    out = globe.render(cx=540, cy=1000, R=R, lon0=lon, lat0=lat, sun=(-0.3, 0.4, 0.86), flood=1.0,
                       coast_now=0.45, coast_new=0.8, contours=0.3, cloud_amt=0.0, wipe_x=wipe, day_gain=0.95)
    xs = np.arange(W, dtype=np.float32)[None, :]
    line = np.exp(-((xs - wipe) / 2.5) ** 2) + 0.35 * np.exp(-((xs - wipe) / 18) ** 2)
    out = out + line[..., None] * np.array([1.0, 0.75, 0.5], np.float32) * 0.9
    return out


def region_at(lt):
    if lt < 4.0:
        return None
    k = min(3, int((lt - 4.0) / 1.15))
    lt2 = lt - 4.0 - k * 1.15
    f = clamp(lt2 / 1.15)
    wipe = -40 + (W + 80) * ease_io(clamp((f - 0.12) / 0.6))
    return REGIONS[k][0], wipe, f


def shot_space_city(lt, dur, fi):
    """Überflutete Küstenmetropole aus dem All bei Nacht: Lichter verlöschen."""
    u = lt / dur
    fl = fstep(0.15, 0.85, u)
    return globe.render(cx=540, cy=960, R=4200 + 500 * u, lon0=5.0, lat0=52.0, sun=(0.3, 0.2, -0.93),
                        flood=fl, coast_now=0.15, coast_new=fl * 0.35, cloud_amt=0.0, night_gain=2.0)


def shot_globe_global(lt, dur, fi):
    u = lt / dur
    return globe.render(cx=540, cy=980, R=520 - 40 * u, lon0=60 + 70 * u, lat0=20, roll=10,
                        sun=(-0.5, 0.4, 0.75), flood=1.0, coast_now=1.0, coast_new=1.0, contours=0.6,
                        cloud_amt=0.3)


def shot_earth_approach(lt, dur, fi):
    u = lt / dur
    R = 520 + 900 * ease_in(u)
    return globe.render(cx=540, cy=980 + 300 * ease_in(u), R=R, lon0=-74 + 4 * u, lat0=38, roll=-6,
                        sun=(0.75, 0.25, -0.3), cloud_amt=0.5, cloud_shift=lt * 2, night_gain=1.5)
