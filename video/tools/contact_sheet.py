"""Preview transparent PNGs on a magenta/checker background: contact_sheet.py <dir> <out.png>"""
import sys, glob, os
from PIL import Image, ImageDraw
fs = sorted(glob.glob(os.path.join(sys.argv[1], "*.png")))
cell = 300
cols = 5
rows = (len(fs) + cols - 1) // cols
W = Image.new("RGB", (cols * cell, rows * (cell + 20)), (255, 0, 255))
d = ImageDraw.Draw(W)
for k, f in enumerate(fs):
    im = Image.open(f).convert("RGBA")
    im.thumbnail((cell - 10, cell - 10))
    x, y = (k % cols) * cell, (k // cols) * (cell + 20)
    for i in range(0, cell, 20):
        for j in range(0, cell, 20):
            if (i // 20 + j // 20) % 2:
                d.rectangle([x + i, y + j, x + i + 19, y + j + 19], fill=(0, 200, 255))
    W.paste(im, (x + 5, y + 5), im)
    d.text((x + 5, y + cell + 3), os.path.basename(f), fill=(0, 0, 0))
W.save(sys.argv[2])
