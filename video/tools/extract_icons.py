"""Extract sticker graphics from the reference video frames into transparent PNGs.

Usage: python3 -I extract_icons.py <frames_dir_A> <frames_dir_B> <out_assets_dir>
  frames_dir_A: reference style video sampled at 4 fps (001.png = t 0.00s)
  frames_dir_B: previous PIKOBUY video sampled at 4 fps (logo source)

Each asset: crop a region of a full-res 1080x1920 frame, segment with rembg
(isnet-general-use), then apply an asset-specific cleanup (circle mask, colour
key, remove overlapping foreign colours) and trim to the alpha bounding box.
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
import cv2

A, B, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
ICONS = os.path.join(OUT, "reference-icons")
LOGOS = os.path.join(OUT, "logos")
os.makedirs(ICONS, exist_ok=True)
os.makedirs(LOGOS, exist_ok=True)
sess = new_session("isnet-general-use")


def frame(d, i):
    return Image.open(os.path.join(d, f"{i:03d}.png")).convert("RGB")


def seg(img):
    return np.array(remove(img, session=sess, post_process_mask=True))


def hsv(rgba):
    return cv2.cvtColor(np.ascontiguousarray(rgba[..., :3]), cv2.COLOR_RGB2HSV)


def save(rgba, name, d=ICONS, pad=6):
    a = rgba[..., 3]
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        print("EMPTY", name)
        return
    rgba = rgba[max(ys.min() - pad, 0): ys.max() + pad, max(xs.min() - pad, 0): xs.max() + pad]
    Image.fromarray(rgba).save(os.path.join(d, name), optimize=True)
    print(name, rgba.shape[1], "x", rgba.shape[0])


def largest_component(rgba, keep=1):
    a = (rgba[..., 3] > 40).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(a, 8)
    if n <= 1:
        return rgba
    order = np.argsort(-stats[1:, cv2.CC_STAT_AREA])[:keep] + 1
    m = np.isin(lab, order)
    m = cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    rgba = rgba.copy()
    rgba[..., 3] = np.where(m, rgba[..., 3], 0)
    return rgba


def circle_cut(img, cx, cy, r, feather=1.5):
    arr = np.array(img.convert("RGBA"))
    yy, xx = np.mgrid[: arr.shape[0], : arr.shape[1]]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    arr[..., 3] = (np.clip((r - d) / feather + 0.5, 0, 1) * 255).astype(np.uint8)
    return arr


def fit_circle(img, hue_lo, hue_hi, sat_min=90):
    """Fit the dominant coloured disc (e.g. green check badge)."""
    h = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2HSV)
    m = ((h[..., 0] >= hue_lo) & (h[..., 0] <= hue_hi) & (h[..., 1] > sat_min)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)
    (cx, cy), r = cv2.minEnclosingCircle(c)
    return cx, cy, r


def red_key(img):
    """Keep only saturated red pixels (stamps, arrows over unrelated artwork)."""
    arr = np.array(img.convert("RGBA"))
    h = hsv(arr)
    red = ((h[..., 0] < 8) | (h[..., 0] > 168)) & (h[..., 1] > 110) & (h[..., 2] > 70)
    m = cv2.morphologyEx(red.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.GaussianBlur(m.astype(np.float32), (3, 3), 0)
    arr[..., 3] = (np.clip(m, 0, 1) * 255).astype(np.uint8)
    return arr


def crop(d, i, box):
    return frame(d, i).crop(box)


# ---------------------------------------------------------------- reference icons
# Hanging SALE tags (clean, nothing overlapping)
save(largest_component(seg(crop(A, 13, (0, 0, 1080, 612))), keep=4), "sale-tags.png")

# Orange delivery truck (unbranded side)
save(largest_component(seg(crop(A, 13, (420, 730, 1080, 1210)))), "delivery-truck.png")

# Green checkmark badge: geometric circle cut around the fitted disc
im = crop(A, 5, (290, 1500, 700, 1910))
cx, cy, r = fit_circle(im, 45, 85)
save(circle_cut(im, cx, cy, r + 1), "checkmark.png")

# Thumbs-up badge
im = crop(A, 15, (330, 420, 740, 820))
cx, cy, r = fit_circle(im, 45, 85, 60)
save(circle_cut(im, cx, cy, r + 1), "thumbs-up.png")

# Airplane: it sits in front of the check badge, so drop green pixels afterwards
im = crop(A, 11, (380, 1240, 1060, 1860))
p = seg(im)
h = hsv(p)
green = (h[..., 0] > 40) & (h[..., 0] < 90) & (h[..., 1] > 80)
green = cv2.dilate(green.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
p[..., 3] = np.where(green, 0, p[..., 3])
save(largest_component(p), "airplane.png")

# Cardboard parcel
save(largest_component(seg(crop(A, 19, (120, 1280, 960, 1920)))), "parcel-box.png")

# Parcel + red price-drop zigzag arrow (combo sticker)
save(largest_component(seg(crop(A, 21, (0, 1300, 1080, 1920))), keep=2), "parcel-price-drop.png")

# Red zigzag arrow alone (colour key over the brown box)
save(largest_component(red_key(crop(A, 21, (0, 1300, 1080, 1920)))), "zigzag-arrow.png")

# Small red down-arrow (over yellow tile / black bar -> red key)
save(largest_component(red_key(crop(A, 25, (320, 520, 540, 1020)))), "down-arrow.png")

# Coupon tickets with gifts
save(largest_component(seg(crop(A, 37, (20, 1260, 1000, 1920)))), "coupon-gifts.png")

# Coins and cash stack
save(largest_component(seg(crop(A, 47, (0, 1300, 1080, 1920))), keep=3), "coins-cash.png")

# Calendar with pencil (cut above the -30% badge)
save(largest_component(seg(crop(A, 51, (80, 440, 1040, 1065)))), "calendar.png")

# REDEEMED stamp (colour key: only the red ink)
save(red_key(crop(A, 59, (60, 170, 1020, 640))), "redeemed-stamp.png")

# 11.11 Singles' Day shopping bag
save(largest_component(seg(crop(A, 11, (630, 70, 1020, 430)))), "singles-day-bag.png")

# Discount badge (-30%) used only as shape reference, kept for the editor
save(largest_component(seg(crop(A, 51, (80, 1000, 940, 1300))), keep=2), "discount-badge-ref.png")

# ---------------------------------------------------------------- official logo
# PIKOBUY app icon from the official PIKOBUY video (static "MEET" scene)
im = frame(B, int(sys.argv[4]) if len(sys.argv) > 4 else 49)
im.save(os.path.join(LOGOS, "_logo_source_frame.png"))
