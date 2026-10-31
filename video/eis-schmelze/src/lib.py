"""Gemeinsame Werkzeuge: Rauschen, Text, Farbkorrektur, Hilfsfunktionen."""
import functools
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
FPS = 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
FONTS = os.path.join(ASSETS, "fonts")


# ---------------------------------------------------------------- math
def clamp(x, a=0.0, b=1.0):
    return np.minimum(np.maximum(x, a), b)


def sstep(a, b, x):
    t = clamp((np.asarray(x, dtype=np.float32) - a) / (b - a))
    return t * t * (3 - 2 * t)


def fstep(a, b, x):
    t = min(max((x - a) / (b - a), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def ease_in(t):
    return t * t * t


def ease_out(t):
    return 1 - (1 - t) ** 3


def ease_io(t):
    t = min(max(t, 0.0), 1.0)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def lerp(a, b, t):
    return a + (b - a) * t


def rgb(*c):
    return np.array(c, dtype=np.float32)


# ---------------------------------------------------------------- noise
def noise(h, w, cy, cx, seed):
    """Glattes Wertrauschen 0..1 (bikubisch hochskaliertes Zufallsgitter)."""
    r = np.random.default_rng(seed).random((cy + 2, cx + 2)).astype(np.float32)
    im = Image.fromarray(r, mode="F")
    sx = w / cx
    sy = h / cy
    big = im.resize((int(round((cx + 2) * sx)), int(round((cy + 2) * sy))), Image.BICUBIC)
    a = np.asarray(big)
    oy, ox = int(sy), int(sx)
    return np.ascontiguousarray(a[oy:oy + h, ox:ox + w])


def fbm(h, w, cells=4, octaves=5, seed=0, pers=0.5, ay=1.0, ax=1.0):
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        c = cells * 2 ** o
        cy = max(1, int(c * ay))
        cx = max(1, int(c * ax))
        if (h > 1 and cy > h // 2) or cx > w // 2:
            break
        acc += amp * noise(h, w, cy, cx, seed * 101 + o)
        tot += amp
        amp *= pers
    acc /= tot
    lo, hi = np.percentile(acc, 0.5), np.percentile(acc, 99.5)
    return clamp((acc - lo) / (hi - lo + 1e-6))


def blur(a, r):
    """Gauß-Weichzeichner für float-Arrays (H,W) oder (H,W,C). r ~ Sigma in px."""
    if r <= 0:
        return a
    from scipy.ndimage import gaussian_filter
    a = np.asarray(a, np.float32)
    if r > 6 and a.shape[0] > 64:
        # schneller über Verkleinerung
        k = int(r // 3)
        h, w = a.shape[:2]
        sm = resize_f(a, max(1, w // k), max(1, h // k))
        sm = gaussian_filter(sm, (r / k, r / k) + ((0,) if a.ndim == 3 else ()))
        return resize_f(sm, w, h)
    return gaussian_filter(a, (r, r) + ((0,) if a.ndim == 3 else ()))


def resize_f(a, w, h, method=Image.BILINEAR):
    if a.ndim == 2:
        return np.asarray(Image.fromarray(a.astype(np.float32), "F").resize((w, h), method))
    return np.stack([resize_f(a[..., i], w, h, method) for i in range(a.shape[2])], -1)


def to_img(a):
    return Image.fromarray((clamp(a) * 255 + 0.5).astype(np.uint8))


def from_img(im):
    return np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0


def affine(a, zoom=1.0, cx=None, cy=None, dx=0.0, dy=0.0, rot=0.0, out=(W, H)):
    """Zoom/Verschiebung/Rotation eines float-RGB-Bildes um (cx,cy)."""
    h, w = a.shape[:2]
    if cx is None:
        cx, cy = w / 2, h / 2
    im = to_img(a)
    ow, oh = out
    c, s = math.cos(rot), math.sin(rot)
    # Ausgabe-Pixel (u,v) -> Quelle
    # src = R^-1 * ((u,v) - (ow/2,oh/2)) / zoom + (cx,cy) - (dx,dy)
    a0 = c / zoom
    b0 = s / zoom
    d0 = -s / zoom
    e0 = c / zoom
    tx = cx - dx - (a0 * ow / 2 + b0 * oh / 2)
    ty = cy - dy - (d0 * ow / 2 + e0 * oh / 2)
    im = im.transform((ow, oh), Image.AFFINE, (a0, b0, tx, d0, e0, ty), resample=Image.BILINEAR)
    return from_img(im)


def perspective_coeffs(dst, src):
    """Koeffizienten für PIL PERSPECTIVE: Ausgabe-Viereck dst -> Quell-Viereck src."""
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    A = np.array(m, dtype=np.float64)
    B = np.array(src, dtype=np.float64).reshape(8)
    return np.linalg.solve(A, B).tolist()


# ---------------------------------------------------------------- text
@functools.lru_cache(None)
def font(name, size):
    files = {
        "serif": "CormorantGaramond_600SemiBold.ttf",
        "serif_med": "CormorantGaramond_500Medium.ttf",
        "serif_it": "CormorantGaramond_500Medium_Italic.ttf",
        "mono": "JetBrainsMono_500Medium.ttf",
        "mono_reg": "JetBrainsMono_400Regular.ttf",
        "sans": "Inter_600SemiBold.ttf",
    }
    return ImageFont.truetype(os.path.join(FONTS, files[name]), size)


def text_width(txt, f, tracking=0):
    if tracking == 0:
        return f.getlength(txt)
    return sum(f.getlength(ch) for ch in txt) + tracking * (len(txt) - 1)


def draw_text(d, xy, txt, f, fill, tracking=0, anchor="ls"):
    x, y = xy
    if tracking == 0:
        d.text((x, y), txt, font=f, fill=fill, anchor=anchor)
        return
    for ch in txt:
        d.text((x, y), ch, font=f, fill=fill, anchor=anchor)
        x += f.getlength(ch) + tracking


class Overlay:
    """RGBA-Textebene mit weichem Glow, wird über das Bild gelegt."""

    def __init__(self):
        self.im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.used = False

    def text_c(self, y, txt, f, alpha=1.0, color=(255, 255, 255), tracking=0, spans=None):
        """Zentrierter Text. spans: Liste (text, farbe) für farbige Wortteile."""
        self.used = True
        a = int(255 * max(0.0, min(1.0, alpha)))
        if spans is None:
            spans = [(txt, color)]
        full = "".join(s for s, _ in spans)
        x = W / 2 - text_width(full, f, tracking) / 2
        for s, col in spans:
            draw_text(self.d, (x, y), s, f, tuple(col) + (a,), tracking)
            x += text_width(s, f, tracking) + (tracking if tracking else 0)

    def text(self, xy, txt, f, alpha=1.0, color=(255, 255, 255), tracking=0):
        self.used = True
        a = int(255 * max(0.0, min(1.0, alpha)))
        draw_text(self.d, xy, txt, f, tuple(color) + (a,), tracking)

    def rect(self, box, color, alpha):
        self.used = True
        self.d.rectangle(box, fill=tuple(color) + (int(255 * alpha),))

    def apply(self, frame, glow=0.55, shadow=0.6):
        if not self.used:
            return frame
        al = np.asarray(self.im, dtype=np.float32) / 255.0
        a = al[..., 3:4]
        col = al[..., :3]
        # dunkler Schatten für Lesbarkeit + heller Glow
        sh = blur(a[..., 0], 10)[..., None]
        out = frame * (1 - shadow * sh)
        gl = blur(a[..., 0], 6)[..., None]
        out = out + glow * 0.35 * gl * np.array([0.75, 0.88, 1.0], np.float32)
        out = out * (1 - a) + col * a
        return out


def wrap_lines(txt, f, maxw):
    words = txt.split()
    lines, cur = [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if f.getlength(t) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- grading
@functools.lru_cache(None)
def vignette_mask():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (x - W / 2) / (W / 2)
    ny = (y - H / 2) / (H / 2)
    r = np.sqrt(nx ** 2 * 1.0 + ny ** 2 * 0.75)
    return (1 - 0.55 * sstep(0.55, 1.45, r))[..., None].astype(np.float32)


def grade(a, frame_idx, ca=1.6, grain=0.03, lift=0.0):
    """Filmischer Look: Kontrast, kühle Schatten, Vignette, Farbsaum, Korn."""
    a = np.maximum(a, 0)
    # weiche Schulter
    a = a / (1 + 0.25 * a)
    a = a * 1.25
    lum = (a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11)[..., None]
    shadow = 1 - sstep(0.0, 0.45, lum)
    a = a + shadow * np.array([-0.012, 0.004, 0.03], np.float32) + lift
    # S-Kurve
    a = clamp(a)
    a = a * a * (3 - 2 * a) * 0.35 + a * 0.65
    a = a * vignette_mask()
    if ca > 0:
        c = int(round(ca))
        if c > 0:
            a[..., 0] = np.roll(a[..., 0], c, axis=1)
            a[..., 2] = np.roll(a[..., 2], -c, axis=1)
    if grain > 0:
        rng = np.random.default_rng(frame_idx * 7919 + 13)
        g = rng.standard_normal((H // 2, W // 2), dtype=np.float32)
        g = np.repeat(np.repeat(g, 2, 0), 2, 1)
        a = a + g[..., None] * grain * (0.6 + 0.4 * (1 - lum))
    return clamp(a)


def glitch(a, frame_idx, amt):
    """Kurzer digitaler Störeffekt: Zeilenversatz + RGB-Split."""
    if amt <= 0:
        return a
    rng = np.random.default_rng(frame_idx * 31 + 5)
    out = a.copy()
    n = int(6 + 14 * amt)
    for _ in range(n):
        y0 = rng.integers(0, H - 20)
        hh = rng.integers(8, int(30 + 140 * amt))
        sh = int(rng.normal(0, 60 * amt))
        out[y0:y0 + hh] = np.roll(out[y0:y0 + hh], sh, axis=1)
    s = int(4 + 18 * amt)
    out[..., 0] = np.roll(out[..., 0], s, axis=1)
    out[..., 2] = np.roll(out[..., 2], -s, axis=1)
    return out


def shake_offsets(t, amp, seed=0, freq=17.0):
    """Kamerawackeln: glatte Pseudozufallsbewegung."""
    dx = amp * (math.sin(t * freq + seed) * 0.6 + math.sin(t * freq * 2.3 + seed * 3) * 0.4)
    dy = amp * (math.sin(t * freq * 1.3 + seed * 7) * 0.6 + math.sin(t * freq * 2.9 + seed) * 0.4)
    rot = amp * 0.0006 * math.sin(t * freq * 0.9 + seed * 2)
    return dx, dy, rot


# ---------------------------------------------------------------- particles
def splat(canvas, xs, ys, rs, cols, alpha=1.0):
    """Additive weiche Punkte (für Gischt, Blasen, Funken) – auf kleiner Ebene + Blur."""
    h, w = canvas.shape[:2]
    layer = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x, y, r, c in zip(xs, ys, rs, cols):
        if -r < x < w + r and -r < y < h + r:
            cc = tuple(int(255 * min(1, v * alpha)) for v in c)
            d.ellipse((x - r, y - r, x + r, y + r), fill=cc)
    return np.asarray(layer, dtype=np.float32) / 255.0


def bloom(a, thr=0.55, strength=0.6, r=18):
    lum = a.max(-1)
    m = np.clip(lum - thr, 0, None)[..., None] * a
    small = resize_f(m, W // 4, H // 4)
    small = blur(small, r / 4)
    big = resize_f(small, W, H)
    return a + big * strength
