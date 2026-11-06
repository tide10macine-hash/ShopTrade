import sys, numpy as np, cv2, os
FULL, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
def load(n): return cv2.imread(f'{FULL}/f_{n+1:03d}.png')
def tight(img, a, pad=6):
    ys, xs = np.where(a > 8)
    y0, y1, x0, x1 = max(ys.min()-pad,0), ys.max()+pad, max(xs.min()-pad,0), xs.max()+pad
    return np.dstack([img, a])[y0:y1, x0:x1]
def largest(m, k=1, minfrac=0.02):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    if n <= 1: return m
    order = np.argsort(-st[1:, 4])[:k] + 1
    keep = [i for i in order if st[i, 4] > minfrac*st[order[0], 4]]
    return np.isin(lab, keep)
def fill_holes(m):
    m = m.astype(np.uint8)*255
    h, w = m.shape; ff = m.copy(); msk = np.zeros((h+2, w+2), np.uint8)
    cv2.floodFill(ff, msk, (0, 0), 255)
    return (m | cv2.bitwise_not(ff)) > 0
def grabcut(img, r, k=1, close=0):
    x0, y0, x1, y1 = r
    H, W = img.shape[:2]
    mask = np.full((H, W), cv2.GC_BGD, np.uint8)
    mask[y0:y1, x0:x1] = cv2.GC_PR_BGD
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    strong = ((hsv[..., 1] > 70) | (hsv[..., 2] < 110))
    sub = np.zeros_like(strong); sub[y0+8:y1-8, x0+8:x1-8] = True
    mask[strong & sub] = cv2.GC_PR_FGD
    bg, fg = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(img, mask, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    m = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    m = largest(m, k)
    if close:
        row = np.where(m[y0+2])[0]
        if len(row): m[y0+2, row.min():row.max()+1] = True   # seal the edge cut by the crop
        m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close))) > 0
    return fill_holes(m)
def disc(img, r):
    x0, y0, x1, y1 = r
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    g = (hsv[..., 0] > 40) & (hsv[..., 0] < 90) & (hsv[..., 1] > 90)
    roi = np.zeros_like(g); roi[y0:y1, x0:x1] = True
    g = largest(g & roi)
    cnt = cv2.findContours(g.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]
    (cx, cy), rad = cv2.minEnclosingCircle(max(cnt, key=cv2.contourArea))
    m = np.zeros(g.shape, np.uint8); cv2.circle(m, (int(cx), int(cy)), int(rad*0.985), 1, -1)
    return m > 0
def stamp(img, r):
    x0, y0, x1, y1 = r
    f = img.astype(float); b, g, rr = f[..., 0], f[..., 1], f[..., 2]
    red = np.clip((rr - (g+b)/2 - 40) / 60, 0, 1)
    dark = np.clip((90 - f.mean(2)) / 50, 0, 1)
    a = np.maximum(red, dark)
    roi = np.zeros(a.shape); roi[y0:y1, x0:x1] = 1
    red = red*roi
    hull = cv2.convexHull(np.argwhere(red > 0.5)[:, ::-1].astype(np.int32))
    hm = np.zeros(a.shape, np.uint8); cv2.fillConvexPoly(hm, hull, 1)
    return np.clip(a*hm, 0, 1)
def calendar(img, r):
    x0, y0, x1, y1 = r
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    roi = np.zeros(hsv.shape[:2], bool); roi[y0:y1, x0:x1] = True
    col = (hsv[..., 1] > 60) & roi
    pencil = col & (hsv[..., 0] > 8) & (hsv[..., 0] < 35)
    body = col & ~pencil
    def hull(m):
        h = cv2.convexHull(np.argwhere(m)[:, ::-1].astype(np.int32)); o = np.zeros(m.shape, np.uint8)
        cv2.fillConvexPoly(o, h, 1); return o
    ys, xs = np.where(body & (hsv[..., 0] > 90))  # blue day cells + red header bounding box
    yr, xr = np.where(body & ((hsv[..., 0] < 8) | (hsv[..., 0] > 165)))
    b = np.zeros(body.shape, np.uint8)
    b[y0:y1, x0:x1] = 1
    pm = largest(pencil | (col & (hsv[..., 2] < 90)), 1)
    pm = cv2.dilate(pm.astype(np.uint8), np.ones((5, 5), np.uint8))
    return (b | pm) > 0
def outline(img, m, px):
    """white sticker border + soft edge, like the reference's cut-out stickers"""
    m8 = m.astype(np.uint8)
    if px:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*px+1, 2*px+1))
        big = cv2.dilate(m8, k)
        img = img.copy(); img[(big > 0) & (m8 == 0)] = (255, 255, 255); m8 = big
    a = cv2.GaussianBlur(m8.astype(np.float32)*255, (0, 0), 1.1)
    return img, a.astype(np.uint8)
JOBS = [
  ('sale-sign', 31, (40, 0, 1040, 620), 'gc:4', 0),
  ('airplane', 24, (330, 1330, 1010, 1850), 'gc', 0),
  ('truck-yellow', 8, (0, 470, 715, 905), 'gc', 0),
  ('box-price-drop', 46, (250, 1440, 850, 1900), 'gc', 0),
  ('bag-1111', 24, (630, 20, 1010, 450), 'gc', 0),
  ('coupon-ticket', 95, (40, 1270, 980, 1920), 'gc', 0),
  ('coins-cash', 113, (10, 1310, 1060, 1920), 'gc', 0),
  ('calendar-pencil', 118, (72, 545, 1003, 1368), 'cal', 0),
  ('thumbs-up', 38, (340, 400, 750, 790), 'disc', 10),
  ('stamp-redeemed', 149, (110, 200, 980, 650), 'stamp', 0),
]
only = sys.argv[3:] 
for name, n, r, mode, px in JOBS:
    if only and name not in only: continue
    img = load(n)
    if mode.startswith('gc'):
        k = int(mode.split(':')[1]) if ':' in mode else 1
        m = grabcut(img, r, k, 61 if name == 'airplane' else 0); img2, a = outline(img, m, px)
    elif mode == 'cal': m = calendar(img, r); img2, a = outline(img, m, px)
    elif mode == 'disc':
        m = disc(img, r); img = img.copy()
        f = img.astype(int); redm = (f[..., 2] - (f[..., 0] + f[..., 1]) // 2 > 60) & m
        if redm.any():
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV); g = m & (hsv[..., 0] > 40) & (hsv[..., 0] < 90) & (hsv[..., 1] > 90)
            img[cv2.dilate(redm.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0] = np.median(img[g], axis=0)
        img2, a = outline(img, m, px)
    else:
        a = (stamp(img, r)*255).astype(np.uint8)
        img2 = img.copy(); img2[...] = (40, 30, 215)  # flat stamp red under grunge alpha
        img2[img.mean(2) < 90] = img[img.mean(2) < 90]
    cv2.imwrite(f'{OUT}/{name}.png', tight(img2, a))
    print(name, 'ok')
