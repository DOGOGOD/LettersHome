"""Turn black-on-white silhouette renders into white-on-transparent paper cut-outs.

Usage: python cutout.py src_dir dst_dir [name=srcfile ...]
- threshold on luminance (dark = paper), small-blob cleanup, 1px anti-aliased edge
- removes a border frame touching the image edges (e.g. a picture frame drawn around the figure)
- crops to the content with a margin; output is RGBA white with alpha
"""
import os, sys, glob
import numpy as np
import cv2

THRESH = 0.42  # luminance below this is paper (grey smoke etc. is dropped)


def cut(src, dst):
    img = cv2.imread(src, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255.0
    mask = (img < THRESH).astype(np.uint8)
    # drop components that touch the border and are thin frames (picture borders)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    h, w = mask.shape
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        touches = x <= 2 or y <= 2 or x + bw >= w - 2 or y + bh >= h - 2
        fill = area / float(bw * bh)
        if touches and fill < 0.25 and bw > w * 0.6 and bh > h * 0.6:
            mask[lab == i] = 0
        elif area < 60:
            mask[lab == i] = 0
    # smooth, anti-aliased alpha from the binary mask
    m = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 1.0)
    alpha = np.clip((m - 0.5) * 3.0 + 0.5, 0, 1)
    ys, xs = np.where(alpha > 0.05)
    if len(xs) == 0:
        print("empty", src)
        return
    pad = 24
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, w)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, h)
    a = (alpha[y0:y1, x0:x1] * 255).astype(np.uint8)
    out = np.dstack([np.full_like(a, 255)] * 3 + [a])
    cv2.imwrite(dst, out)
    print(os.path.basename(dst), out.shape[1], "x", out.shape[0])


if __name__ == "__main__":
    src_dir, dst_dir = sys.argv[1], sys.argv[2]
    os.makedirs(dst_dir, exist_ok=True)
    overrides = dict(a.split("=", 1) for a in sys.argv[3:])
    for f in sorted(glob.glob(os.path.join(src_dir, "*.png"))):
        name = os.path.splitext(os.path.basename(f))[0]
        if name in overrides:
            continue
        cut(f, os.path.join(dst_dir, name + ".png"))
    for name, f in overrides.items():
        cut(f, os.path.join(dst_dir, name + ".png"))
