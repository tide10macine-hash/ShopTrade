"""Pass 5: geometric clean-up of the truck and parcel cut-outs.
- parcel: alpha = anti-aliased convex hull of the cardboard/label pixels (a box is convex), so
  shadow fringe and the stray string blob from the reference disappear.
- truck: cargo side panel re-cut as the convex hull of its orange pixels, dark specks on the
  outer edge removed, rear wheel completed by mirroring its intact half.
Usage: python3 -I cleanup_truck_parcel.py <truck_in.png> <parcel_in.png> <icons_out_dir>"""
import sys, os
import numpy as np, cv2
from PIL import Image

T_IN, P_IN, OUT = sys.argv[1:4]


def aa_poly_mask(shape, pts, shrink=1.5):
    """anti-aliased filled polygon (4x supersampled), optionally shrunk inward"""
    H, W = shape
    big = np.zeros((H * 4, W * 4), np.uint8)
    cv2.fillPoly(big, [np.round(pts * 4).astype(np.int32)], 255, lineType=cv2.LINE_AA)
    if shrink > 0:
        k = int(shrink * 4) * 2 + 1
        big = cv2.erode(big, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    return cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def trim(rgba, pad=4):
    ys, xs = np.where(rgba[..., 3] > 6)
    return rgba[max(ys.min() - pad, 0): ys.max() + pad + 1, max(xs.min() - pad, 0): xs.max() + pad + 1]


# ---------------------------------------------------------------- parcel
p = np.array(Image.open(P_IN).convert("RGBA"))
hsv = cv2.cvtColor(p[..., :3], cv2.COLOR_RGB2HSV)
card = (hsv[..., 0] >= 6) & (hsv[..., 0] <= 25) & (hsv[..., 1] > 50) & (hsv[..., 2] > 90) & (p[..., 3] > 128)
card = cv2.morphologyEx(card.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(card, 8)
card = lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
hull = cv2.convexHull(np.argwhere(card)[:, ::-1].astype(np.float32))[:, 0, :]
a = aa_poly_mask(card.shape, hull, shrink=2.0)
# fill any pixels inside the hull that were transparent with the nearest cardboard colour
rgb = p[..., :3].copy()
holes = (a > 0) & (p[..., 3] < 200)
if holes.any():
    rgb = cv2.inpaint(rgb, holes.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
p = np.dstack([rgb, (a * 255).astype(np.uint8)])
Image.fromarray(trim(p)).save(os.path.join(OUT, "parcel-box.png"), optimize=True)
print("parcel", trim(p).shape)

# ---------------------------------------------------------------- truck
t = np.array(Image.open(T_IN).convert("RGBA"))
H, W = t.shape[:2]
hsv = cv2.cvtColor(t[..., :3], cv2.COLOR_RGB2HSV)
alpha = t[..., 3].astype(np.float32) / 255
orange = (hsv[..., 0] >= 10) & (hsv[..., 0] <= 30) & (hsv[..., 1] > 90) & (hsv[..., 2] > 120) & (t[..., 3] > 128)

# 1) cargo box: everything right of the cab roof and above the grey skirt is one convex shape
#    (front face + side panel). Rebuild its silhouette from the orange pixels only.
cab_x = int(W * 0.33)          # cargo front face starts right of the cab
skirt_y = int(H * 0.72)        # grey skirt / wheels start below this
reg = np.zeros_like(orange); reg[:skirt_y, cab_x:] = orange[:skirt_y, cab_x:]
reg = cv2.morphologyEx(reg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
n, lab, st, _ = cv2.connectedComponentsWithStats(reg.astype(np.uint8), 8)
reg = lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
pts = np.argwhere(reg)[:, ::-1].astype(np.float32)
# extend the hull below the skirt line so there is no seam where cargo meets the grey skirt
pts = np.concatenate([pts, pts[pts[:, 1] > skirt_y - 20] + np.float32([0, 40])]).astype(np.float32)
hull = cv2.convexHull(pts)[:, 0, :]
cargo = aa_poly_mask((H, W), hull, shrink=1.0)
# only the cargo box's own outline is re-cut: the strip above the cab roof and the part behind
# the cab. The cab itself (windows, mirror, door) is left exactly as extracted.
roof_y = int(H * 0.19)
cab_rear_x = int(W * 0.60)
cargo_zone = np.zeros((H, W), bool)
cargo_zone[:roof_y, cab_x:] = True
cargo_zone[:skirt_y, cab_rear_x:] = True
# outside the hull inside the cargo zone -> transparent (removes black specks & ragged edge)
alpha = np.where(cargo_zone, np.minimum(alpha, cargo), alpha)
# inside the hull -> opaque, recolour any dark speck with the local orange
inside = (cargo > 0.5) & cargo_zone
dark = inside & (hsv[..., 2] < 90)
dark = cv2.dilate(dark.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
dark &= ~(cv2.erode(inside.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0)  # only near the rim
rgb = t[..., :3].copy()
if dark.any():
    rgb = cv2.inpaint(rgb, dark.astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA)
alpha = np.where(inside, np.maximum(alpha, cargo), alpha)

# 2) dark specks hugging the outer edge elsewhere (top-left corner remnants): any small dark
#    component that touches the transparent boundary is removed
edge = (alpha > 0.1) & (cv2.dilate((alpha < 0.1).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0)
darkpx = (hsv[..., 2] < 70) & (alpha > 0.1)
n, lab, st, _ = cv2.connectedComponentsWithStats(darkpx.astype(np.uint8), 8)
for i in range(1, n):
    comp = lab == i
    if (comp & edge).any() and (
        (st[i, cv2.CC_STAT_AREA] < 400 and st[i, cv2.CC_STAT_TOP] < skirt_y * 0.4)  # roof-line remnants
        or st[i, cv2.CC_STAT_AREA] < 150                                         # tiny specks anywhere
    ):
        alpha[comp] = 0
# remnant of the thumbs-up badge rim at the cargo box's front-top corner
band = np.zeros((H, W), bool); band[: int(H * 0.2), int(W * 0.31): int(W * 0.36)] = True
alpha[band & (hsv[..., 2] < 100)] = 0

# 3) rear wheel: complete the flat-cut right half by mirroring the intact left half
grey = (hsv[..., 1] < 60) & (hsv[..., 2] < 150) & (alpha > 0.5)
zone = np.zeros_like(grey); zone[skirt_y:, int(W * 0.7):] = True
wheel = grey & zone
n, lab, st, cen = cv2.connectedComponentsWithStats(wheel.astype(np.uint8), 8)
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
x0, y0, ww, hh = st[k, :4]
# hub = brightest grey blob inside the wheel -> true centre
hub = (hsv[..., 2] > 110) & (hsv[..., 1] < 40) & (lab == k)
cx = int(np.median(np.argwhere(hub)[:, 1])) if hub.sum() > 30 else x0 + ww // 2
half = cx - x0
ys0 = int(H * 0.80)            # only below the skirt
L = slice(cx - half, cx)
Rr = slice(cx, cx + half)
if cx + half <= W:
    src_rgb = rgb[ys0:, L][:, ::-1]
    src_a = alpha[ys0:, L][:, ::-1]
    take = src_a > alpha[ys0:, Rr]
    rgb[ys0:, Rr][take] = src_rgb[take]
    alpha[ys0:, Rr] = np.maximum(alpha[ys0:, Rr], src_a)
print("rear wheel centre x", cx, "half", half)

t = np.dstack([rgb, (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
Image.fromarray(trim(t)).save(os.path.join(OUT, "delivery-truck.png"), optimize=True)
print("truck", trim(t).shape)
