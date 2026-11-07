"""Prepare the official assets supplied for the "3 Reasons" video. Pixels are not redrawn.
- PIKOBUY logo (JPG on white): white corners outside the rounded square -> transparent
  (flood fill from the border on near-white pixels only, so the white face inside is kept).
- Mascot PNG: copied as supplied.
- Link-in-bio screenshot: copied; the REEZY REPZ round badge is cropped with a circular mask.
Usage: python3 -I prepare_brand_assets.py <logo.jpg> <mascot.png> <linkinbio.jpg> <assets_dir>"""
import sys, os, shutil
import numpy as np, cv2
from PIL import Image

LOGO, MASCOT, BIO, OUT = sys.argv[1:5]
os.makedirs(f"{OUT}/logos", exist_ok=True); os.makedirs(f"{OUT}/stickers", exist_ok=True)

# logo
rgb = np.array(Image.open(LOGO).convert("RGB"))
H, W = rgb.shape[:2]
white = (rgb.min(2) > 225).astype(np.uint8)
ff = np.zeros((H + 2, W + 2), np.uint8)
outside = np.zeros((H, W), np.uint8)
for x, y in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
    if white[y, x]:
        m = white.copy()
        cv2.floodFill(m, ff, (x, y), 2)
        outside |= (m == 2).astype(np.uint8)
# soft edge: supersampled, slight erosion so no white fringe remains
big = cv2.resize((1 - outside) * 255, (W * 4, H * 4), interpolation=cv2.INTER_NEAREST)
big = cv2.erode(big, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
big = cv2.GaussianBlur(big, (0, 0), 2)
alpha = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA)
Image.fromarray(np.dstack([rgb, alpha])).save(f"{OUT}/logos/pikobuy-logo-official.png")
print("logo", W, H, "corner px removed", int(outside.sum()))

shutil.copy(MASCOT, f"{OUT}/stickers/pikobuy-mascot.png")
shutil.copy(BIO, f"{OUT}/stickers/link-in-bio-reezy-repz.jpg")

# REEZY REPZ badge: dark circle at the top of the link page
bio = np.array(Image.open(BIO).convert("RGB"))
top = bio[: int(bio.shape[0] * 0.3)]
dark = (top.max(2) < 30).astype(np.uint8)
dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
cnts, _ = cv2.findContours(dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
(cx, cy), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
yy, xx = np.mgrid[: bio.shape[0], : bio.shape[1]]
d = np.hypot(xx - cx, yy - cy)
a = (np.clip(r - 1 - d + 0.5, 0, 1) * 255).astype(np.uint8)
x0, y0, x1, y1 = int(cx - r - 2), int(cy - r - 2), int(cx + r + 3), int(cy + r + 3)
badge = np.dstack([bio, a])[max(y0, 0): y1, max(x0, 0): x1]
Image.fromarray(badge).save(f"{OUT}/logos/reezy-repz-logo.png")
print("reezy badge", badge.shape[1], badge.shape[0], "r", round(r))
