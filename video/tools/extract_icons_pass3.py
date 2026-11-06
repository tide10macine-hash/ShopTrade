"""Third pass: robust masks for pale/flat objects on crumpled paper.
mask = rembg OR saturation-key, hole-filled, largest component.
Usage: python3 -I extract_icons_pass3.py <frames_dir_A> <calendar_frame.png> <out_assets_dir>"""
import sys, os
import numpy as np, cv2
from PIL import Image
from rembg import remove, new_session

sess = new_session("isnet-general-use")


def fill_holes(m):
    m = m.astype(np.uint8)
    h, w = m.shape
    ff = np.pad(m, 1).copy()
    cv2.floodFill(ff, None, (0, 0), 2)
    return (ff[1:-1, 1:-1] != 2)


def largest(m):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    return lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])


def robust(rgb, sat_min=40, use_rembg=True, close=7, extra=None):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    m = (hsv[..., 1] > sat_min) & (hsv[..., 2] > 40)
    if use_rembg:
        m |= np.array(remove(Image.fromarray(rgb), session=sess, only_mask=True)) > 128
    if extra is not None:
        m |= extra
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((close, close), np.uint8)) > 0
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    m = fill_holes(largest(m))
    a = cv2.GaussianBlur(m.astype(np.float32), (3, 3), 0)
    return np.dstack([rgb, (a * 255).astype(np.uint8)])


def save(rgba, name, icons_dir=None, pad=6):
    ys, xs = np.where(rgba[..., 3] > 8)
    rgba = rgba[max(ys.min()-pad, 0):ys.max()+pad, max(xs.min()-pad, 0):xs.max()+pad]
    Image.fromarray(np.ascontiguousarray(rgba)).save(os.path.join(icons_dir or ICONS, name), optimize=True)
    print(name, rgba.shape[1], "x", rgba.shape[0])



if __name__ == "__main__":
    A, CAL, OUT = sys.argv[1:4]
    ICONS = os.path.join(OUT, "reference-icons")
    fr = lambda i: np.array(Image.open(os.path.join(A, f"{i:03d}.png")).convert("RGB"))
    # Calendar: drop everything above the binder rings except the pencil
    cal = np.array(Image.open(CAL).convert("RGB"))[560:1400, 60:1030].copy()
    rg = robust(cal, sat_min=255, use_rembg=True)  # rembg + hole fill only (calendar is white)
    hsv = cv2.cvtColor(cal, cv2.COLOR_RGB2HSV)
    redtxt = ((hsv[..., 0] < 10) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 120)
    redtxt[60:, :] = False  # only the "11.11!" text remnants at the very top
    blk = (hsv[..., 2] < 70); blk[60:, :] = False
    rg[..., 3][cv2.dilate((redtxt | blk).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0] = 0
    a = rg[..., 3] > 128
    rg[..., 3] = np.where(largest(a), rg[..., 3], 0)
    save(rg, "calendar.png")

    # Parcel box (tan cardboard): saturation key works far better than rembg here
    save(robust(fr(16)[1290:1920, 80:980], sat_min=45, use_rembg=False, close=9), "parcel-box.png")

    # Truck: front half from t=3.0s, rear from t=3.5s, aligned by affine
    f13, f15 = fr(13), fr(15)
    t13 = robust(f13[700:1240, 470:1080], sat_min=45)
    full13 = np.zeros((1920, 1080, 4), np.uint8); full13[700:1240, 470:1080] = t13
    orb = cv2.ORB_create(4000)
    k1, d1 = orb.detectAndCompute(cv2.cvtColor(f13, cv2.COLOR_RGB2GRAY), (full13[..., 3] > 128).astype(np.uint8) * 255)
    k2, d2 = orb.detectAndCompute(cv2.cvtColor(f15, cv2.COLOR_RGB2GRAY), None)
    mt = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda x: x.distance)[:400]
    M, _ = cv2.estimateAffinePartial2D(np.float32([k1[x.queryIdx].pt for x in mt]), np.float32([k2[x.trainIdx].pt for x in mt]), ransacReprojThreshold=3)
    w13 = cv2.warpAffine(full13, M, (1080, 1920), flags=cv2.INTER_LANCZOS4)
    cutx = int((M @ np.array([1079, 1000, 1]))[0])
    ys, xs = np.where(w13[..., 3] > 128)
    top, bot = ys.min(), ys.max()
    # rear: saturation key of f15 to the right of the cut (only paper behind it there)
    reg = f15[top - 4: bot + 4, cutx - 60: 1080]
    rr = robust(reg, sat_min=45, use_rembg=True)
    rear = np.zeros_like(w13); rear[top - 4: bot + 4, cutx - 60: 1080] = rr
    comp = w13.copy()
    take = (np.arange(1080)[None, :] >= cutx - 30) & (rear[..., 3] > 0)
    comp[take] = rear[take]
    comp[..., 3] = np.maximum(np.where(np.arange(1080)[None, :] < cutx - 30, w13[..., 3], 0), rear[..., 3])
    m = fill_holes(largest(comp[..., 3] > 100))
    comp[..., 3] = np.where(m, np.maximum(comp[..., 3], 255 * (cv2.erode(m.astype(np.uint8), np.ones((5, 5))) > 0)), 0)
    save(comp, "delivery-truck.png")

    # Thumbs-up: rebuild badge background (overlapping SALE tag removed), keep the white thumb
    im = fr(15)[420:820, 330:740].copy()
    hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)
    g = (hsv[..., 0] > 45) & (hsv[..., 0] < 85) & (hsv[..., 1] > 60)
    g8 = cv2.morphologyEx(g.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    cnts, _ = cv2.findContours(g8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    (cx, cy), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea)); r -= 3
    yy, xx = np.mgrid[:im.shape[0], :im.shape[1]]
    d = np.hypot(xx - cx, yy - cy)
    base = np.median(im[g & (d < r * 0.8)], axis=0).astype(np.float32)
    shade = (1.0 - 0.18 * np.clip((d / r) ** 3, 0, 1))[..., None]
    bg = base[None, None, :] * shade
    thumb = (hsv[..., 1] < 60) & (hsv[..., 2] > 150) & (d < r * 0.82)
    thumb = cv2.morphologyEx(thumb.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    tm = cv2.GaussianBlur(thumb.astype(np.float32), (3, 3), 0)[..., None]
    out = (im.astype(np.float32) * tm + bg * (1 - tm)).clip(0, 255).astype(np.uint8)
    alpha = (np.clip(r - d + 0.5, 0, 1) * 255).astype(np.uint8)
    save(np.dstack([out, alpha]), "thumbs-up.png")

    # Calendar: clear leftover headline fragments left of the first binder ring
    c = np.array(Image.open(os.path.join(ICONS, "calendar.png")))
    c[:70, :300, 3] = 0
    save(c, "calendar.png", pad=0)
    c = np.array(Image.open(os.path.join(ICONS, "calendar.png")))
    c[:50, :770, 3] = 0
    save(c, "calendar.png", pad=0)
