"""Clean crumpled-paper plate from the reference video.
Takes the reference frame with the most visible paper, then patches the areas still
covered by graphics with other clean paper regions of the same frame (Poisson blend).
Usage: python3 -I extract_paper.py <frames_dir> <out.png>"""
import sys, os, glob
import numpy as np, cv2

fs = sorted(glob.glob(os.path.join(sys.argv[1], "*.png")))
def paperness(im):
    h = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    return ((h[..., 1] < 25) & (h[..., 2] > 170)).mean()
best = max(fs, key=lambda f: paperness(cv2.imread(f)))
print("seed", os.path.basename(best))
img = cv2.imread(best)
H, W = img.shape[:2]

def patch(dst, src_box, dst_box, flip=None):
    sx, sy, sw, sh = src_box
    dx, dy = dst_box
    p = img[sy:sy + sh, sx:sx + sw].copy()
    if flip is not None:
        p = cv2.flip(p, flip)
    # feathered alpha paste (no Poisson: it would bleed the covered colours in)
    f = 28
    a = np.ones(p.shape[:2], np.float32)
    ramp = np.linspace(0, 1, f)
    if dx > 0: a[:, :f] *= ramp[None, :]
    if dx + sw < W: a[:, -f:] *= ramp[::-1][None, :]
    if dy > 0: a[:f] *= ramp[:, None]
    if dy + sh < H: a[-f:] *= ramp[::-1][:, None]
    region = dst[dy:dy + sh, dx:dx + sw].astype(np.float32)
    dst = dst.copy()
    dst[dy:dy + sh, dx:dx + sw] = (p * a[..., None] + region * (1 - a[..., None])).astype(np.uint8)
    return dst

out = img.copy()
# app-tile ghost on the left (x 0-440, y 370-1130): fill from clean top-right paper
out = patch(out, (560, 0, 520, 840), (0, 320), flip=1)
# caption ghost (y 1110-1400): fill from clean bottom paper
out = patch(out, (0, 1540, 1080, 360), (0, 1080), flip=0)
cv2.imwrite(sys.argv[2], out)
