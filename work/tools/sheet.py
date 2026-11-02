"""Contact sheet: python sheet.py out.jpg cols w img1 img2 ... (crops the 2.35 picture area)"""
import sys
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
fs = sys.argv[4:]
h = int(w * 816 / 1920)
rows = (len(fs) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * (h + 18)), (30, 30, 30))
d = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    im = Image.open(f).crop((0, 132, 1920, 948)).resize((w, h))
    x, y = (i % cols) * w, (i // cols) * (h + 18)
    S.paste(im, (x, y + 18))
    d.text((x + 4, y + 3), f.split("/")[-1].split("\\")[-1], fill=(140, 255, 140))
S.save(out, quality=88)
