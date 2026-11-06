"""Fourth pass: re-extract stickers that were clipped by the frame/crop edge.
Usage: python3 -I extract_icons_pass4.py <frames_dir_A_4fps> <frames_dir_60fps_from_1.6s> <out_assets_dir>"""
import sys, os
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_icons_pass3 import robust, save, largest, fill_holes  # noqa: E402  (re-uses masks; pass3 body is guarded)

A, F60, OUT = sys.argv[1:4]
ICONS = os.path.join(OUT, "reference-icons")
f60 = lambda t: np.array(Image.open(os.path.join(F60, f"{round((t - 1.6) * 60) + 1:04d}.png")).convert("RGB"))
fA = lambda i: np.array(Image.open(os.path.join(A, f"{i:03d}.png")).convert("RGB"))

# Parcel: t=3.917s is the only moment the whole box (incl. bottom corner) is in frame
save(robust(f60(3.917)[1080:1920, 100:980], sat_min=45, use_rembg=False, close=9), "parcel-box.png", ICONS)

# Checkmark: wider crop so the disc is not cut on the right
im = fA(5)[1480:1920, 260:800].copy()
h = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)
g = ((h[..., 0] > 45) & (h[..., 0] < 85) & (h[..., 1] > 90)).astype(np.uint8)
g = cv2.morphologyEx(g, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
cnts, _ = cv2.findContours(g, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
(cx, cy), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
yy, xx = np.mgrid[:im.shape[0], :im.shape[1]]
d = np.hypot(xx - cx, yy - cy)
alpha = (np.clip(r + 1 - d + 0.5, 0, 1) * 255).astype(np.uint8)
print("check circle", round(cx), round(cy), round(r), "crop", im.shape)
save(np.dstack([im, alpha]), "checkmark.png", ICONS)

# Coins: keep only the one complete stack (others were cut by the frame bottom)
c = np.array(Image.open(os.path.join(ICONS, "coins-cash.png")))
stack = c[:300, 380:].copy()
m = fill_holes(largest(stack[..., 3] > 100))
stack[..., 3] = np.where(m, stack[..., 3], 0)
save(stack, "coin-stack.png", ICONS)

# Clean-up: stray tape fragment above the parcel, neighbouring-stack slivers on the coin stack
for name, cut_left, k in [("parcel-box.png", 0, 15), ("coin-stack.png", 36, 9)]:
    p = os.path.join(ICONS, name)
    a = np.array(Image.open(p))
    a[:, :cut_left, 3] = 0
    m = cv2.morphologyEx((a[..., 3] > 100).astype(np.uint8), cv2.MORPH_OPEN, np.ones((k, k), np.uint8))
    m = cv2.dilate(largest(m).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    a[..., 3] = np.where(m, a[..., 3], 0)
    save(a, name, ICONS, pad=4)

# Parcel: the SALE-tag string touching the lid -> drop rows above where the box itself starts
p = os.path.join(ICONS, "parcel-box.png"); a = np.array(Image.open(p))
widths = (a[..., 3] > 128).sum(1)
top = int(np.argmax(widths > 60))
a[:max(top - 4, 0), :, 3] = 0
save(a, "parcel-box.png", ICONS, pad=4)

# Coin stack: bottom coin was sliced flat by the stack below -> give it an elliptical underside
p = os.path.join(ICONS, "coin-stack.png"); a = np.array(Image.open(p))
cols = np.where((a[..., 3] > 128).any(0))[0]
cx, ax = (cols.min() + cols.max()) / 2, (cols.max() - cols.min()) / 2
rows = np.where((a[..., 3] > 128).any(1))[0]
b = ax * 0.3
yc = rows.max() - 10 - b
yy, xx = np.mgrid[:a.shape[0], :a.shape[1]]
u = np.clip((xx - cx) / ax, -1, 1)
limit = yc + b * np.sqrt(1 - u ** 2)
a[..., 3] = np.where(yy > limit, 0, a[..., 3])
# darken the new rim a touch so it reads as the coin edge
rim = (yy > limit - 7) & (yy <= limit) & (a[..., 3] > 0)
a[rim, :3] = (a[rim, :3] * 0.72).astype(np.uint8)
save(a, "coin-stack.png", ICONS, pad=4)
