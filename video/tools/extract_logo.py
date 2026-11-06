"""Extract the official PIKOBUY app-icon logo from the official PIKOBUY video.
Picks the sharpest static frame, masks the rounded-square icon by its own colours
(cyan top, black bottom band), fills holes, keeps pixels untouched.
Usage: python3 -I extract_logo.py <pikobuy_video.mp4> <out_dir>"""
import sys, os, subprocess, tempfile
import numpy as np, cv2
from PIL import Image

vid, out = sys.argv[1:3]
tmp = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-v", "error", "-ss", "10.5", "-t", "2.8", "-i", vid, "-vf", "fps=30", f"{tmp}/%03d.png"], check=True)
best, bs = None, -1
for f in sorted(os.listdir(tmp)):
    im = cv2.imread(os.path.join(tmp, f))
    roi = im[300:1000, 200:880]
    s = cv2.Laplacian(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
    if s > bs:
        best, bs = f, s
print("sharpest frame", best, round(bs, 1))
rgb = np.array(Image.open(os.path.join(tmp, best)).convert("RGB"))
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
cyan = (hsv[..., 0] > 80) & (hsv[..., 0] < 100) & (hsv[..., 1] > 90)
dark = hsv[..., 2] < 70
m = (cyan | dark).astype(np.uint8)
m[:200] = 0; m[1300:] = 0
n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
m = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
ff = np.pad(m, 1).copy(); cv2.floodFill(ff, None, (0, 0), 2); m = (ff[1:-1, 1:-1] != 2).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
# anti-aliased edge: supersample mask contour
big = cv2.resize(m * 255, None, fx=4, fy=4, interpolation=cv2.INTER_LINEAR)
big = cv2.GaussianBlur(big, (0, 0), 3)
big = (big > 127).astype(np.float32)
a = cv2.resize(big, (m.shape[1], m.shape[0]), interpolation=cv2.INTER_AREA)
ys, xs = np.where(a > 0.02)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
rgba = np.dstack([rgb, (a * 255).astype(np.uint8)])[y0:y1, x0:x1]
os.makedirs(out, exist_ok=True)
Image.fromarray(rgba).save(os.path.join(out, "pikobuy-logo.png"))
print("logo", rgba.shape[1], "x", rgba.shape[0])
