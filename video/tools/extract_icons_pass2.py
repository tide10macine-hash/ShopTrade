"""Second pass: icons that need compositing / special cleanup.
Usage: python3 -I extract_icons_pass2.py <frames_dir_A> <calendar_frame.png> <out_assets_dir>"""
import sys, os
import numpy as np, cv2
from PIL import Image
from rembg import remove, new_session

A, CAL, OUT = sys.argv[1:4]
ICONS = os.path.join(OUT, "reference-icons")
sess = new_session("isnet-general-use")
fr = lambda i: Image.open(os.path.join(A, f"{i:03d}.png")).convert("RGB")
seg = lambda im: np.array(remove(im, session=sess, post_process_mask=True))


def largest(rgba):
    a = (rgba[..., 3] > 40).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(a, 8)
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    m = cv2.dilate((lab == k).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    out = rgba.copy(); out[..., 3] = np.where(m, out[..., 3], 0); return out


def save(rgba, name, pad=6):
    ys, xs = np.where(rgba[..., 3] > 8)
    rgba = rgba[max(ys.min()-pad, 0):ys.max()+pad, max(xs.min()-pad, 0):xs.max()+pad]
    Image.fromarray(rgba).save(os.path.join(ICONS, name), optimize=True)
    print(name, rgba.shape[1], "x", rgba.shape[0])


# --- Calendar with pencil (clean frame at t=11.983s)
cal = Image.open(CAL).convert("RGB").crop((60, 560, 1030, 1400))
save(largest(seg(cal)), "calendar.png")

# --- Parcel box alone (t=3.75s)
save(largest(seg(fr(16).crop((80, 1290, 980, 1920)))), "parcel-box.png")

# --- 11.11 Singles' Day bag, include handle
save(largest(seg(fr(11).crop((620, 20, 1030, 430)))), "singles-day-bag.png")

# --- Thumbs-up badge: paint over the overlapping red SALE tag with the badge green
im = np.array(fr(15).crop((330, 420, 740, 820)))
h = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)
g = (h[..., 0] > 45) & (h[..., 0] < 85) & (h[..., 1] > 60)
g8 = cv2.morphologyEx(g.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
cnts, _ = cv2.findContours(g8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
(cx, cy), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
r -= 2
yy, xx = np.mgrid[:im.shape[0], :im.shape[1]]
d = np.hypot(xx - cx, yy - cy)
green = np.median(im[g & (d < r - 6)], axis=0)
red = ((h[..., 0] < 12) | (h[..., 0] > 165)) & (h[..., 1] > 90)
red = cv2.dilate(red.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
dark = (h[..., 2] < 60) & (d > r - 14)  # foreign dark edge pixels near rim
im[(red | dark) & (d < r)] = green
alpha = (np.clip(r - d + 0.5, 0, 1) * 255).astype(np.uint8)
save(np.dstack([im, alpha]), "thumbs-up.png")

# --- Delivery truck: front from t=3.0s (clean cab), rear from t=3.5s (complete box)
f13, f15 = np.array(fr(13)), np.array(fr(15))
t13 = seg(Image.fromarray(f13).crop((380, 700, 1080, 1240)))
full13 = np.zeros((1920, 1080, 4), np.uint8); full13[700:1240, 380:1080] = largest(t13)
orb = cv2.ORB_create(4000)
m13 = (full13[..., 3] > 128).astype(np.uint8) * 255
k1, d1 = orb.detectAndCompute(cv2.cvtColor(f13, cv2.COLOR_RGB2GRAY), m13)
k2, d2 = orb.detectAndCompute(cv2.cvtColor(f15, cv2.COLOR_RGB2GRAY), None)
mt = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda x: x.distance)[:400]
src = np.float32([k1[x.queryIdx].pt for x in mt]); dst = np.float32([k2[x.trainIdx].pt for x in mt])
M, inl = cv2.estimateAffinePartial2D(src, dst, ransacReprojThreshold=3)
print("truck affine inliers", int(inl.sum()), M.round(3).tolist())
w13 = cv2.warpAffine(full13, M, (1080, 1920), flags=cv2.INTER_LANCZOS4)
# where is the cut edge (frame x=1079) in f15 coords
cutx = int((M @ np.array([1079, 1000, 1]))[0])
s15 = np.zeros((1920, 1080, 4), np.uint8)
s15[350:1080, 0:1080] = seg(Image.fromarray(f15).crop((0, 350, 1080, 1080)))
rear = s15.copy(); rear[:, :cutx - 40, 3] = 0
ys, xs = np.where(w13[..., 3] > 128)
rear[:ys.min() - 5, :, 3] = 0  # nothing above the truck roof (SALE tags)
ramp = np.clip((np.arange(1080) - (cutx - 40)) / 30.0, 0, 1)[None, :]
a13 = w13[..., 3:4].astype(np.float32) / 255 * (1 - ramp[..., None] * (np.arange(1080)[None, :, None] > cutx - 40))
out = w13.astype(np.float32) * a13 + rear.astype(np.float32) * (1 - a13)
alpha = np.maximum(w13[..., 3] * (1 - ramp * 0), rear[..., 3])
out[..., 3] = np.maximum(w13[..., 3] * (np.arange(1080)[None, :] < cutx - 5), rear[..., 3])
save(largest(out.clip(0, 255).astype(np.uint8)), "delivery-truck.png")
