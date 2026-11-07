"""Cut the EMS / UPS / Yodel carrier logos out of the "don't ship together" reference video.
Mask = saturated pixels (the logo tiles are solid colour), largest component, hole-filled,
anti-aliased edge; then 3x Lanczos upscale (source is 576x1024) with a light unsharp mask.
Usage: python3 -I extract_carrier_logos.py <frames_dir> <out_dir> ems=<file> ups=<file> yodel=<file>"""
import sys, os
import numpy as np, cv2
from PIL import Image, ImageFilter

src, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)
for arg in sys.argv[3:]:
    name, f = arg.split("=")
    im = cv2.cvtColor(cv2.imread(os.path.join(src, f)), cv2.COLOR_BGR2RGB)
    roi = im[600:1000, 60:520]
    h = cv2.cvtColor(roi, cv2.COLOR_RGB2HSV)
    m = ((h[..., 1] > 70) & (h[..., 2] > 40)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    m = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    ff = np.pad(m, 1).copy(); cv2.floodFill(ff, None, (0, 0), 2); m = (ff[1:-1, 1:-1] != 2).astype(np.uint8)
    m = cv2.erode(m, np.ones((3, 3), np.uint8))
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb, a = roi[y0:y1, x0:x1], m[y0:y1, x0:x1] * 255
    S = 3
    big = Image.fromarray(rgb).resize((rgb.shape[1] * S, rgb.shape[0] * S), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 80, 2))
    ab = cv2.GaussianBlur(cv2.resize(a, (rgb.shape[1] * S, rgb.shape[0] * S), interpolation=cv2.INTER_LINEAR), (0, 0), 1.2)
    rgba = np.dstack([np.array(big), ab])
    Image.fromarray(rgba).save(os.path.join(out, f"{name}-logo.png"))
    print(name, rgba.shape[1], "x", rgba.shape[0])
