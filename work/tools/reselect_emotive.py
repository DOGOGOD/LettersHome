"""Re-pick emotive takes from the scores in tts_emotive.log: Whisper hears classical words as homophones
(卿卿→轻轻, 汝→辱), so the transcript only has to match in length; the pick is expressiveness within the voice."""
import os, re, sys
import numpy as np
import soundfile as sf
from tts_emotive import DIR, TAKES, VO, trim

LOG = os.path.join(os.path.dirname(VO), "tts_emotive.log")
rows = {}
for line in open(LOG, encoding="utf-8", errors="ignore"):
    m = re.match(r"(\w+)_(\d\d)\s+\S*?_s(\d+)\.wav f0 (\d+) expr ([\d.]+) dyn ([\d.]+) timbre ([\d.]+) cer ([\d.]+) rate ([\d.]+) score \S+\s+(.*)", line.strip())
    if m:
        v, i, seed, f0, expr, dyn, tim, cer, rate, txt = m.groups()
        rows.setdefault((v, int(i)), []).append(dict(seed=int(seed), f0=float(f0), expr=float(expr), dyn=float(dyn), tim=float(tim), txt=txt))
for (v, i), cs in sorted(rows.items()):
    D = DIR[v]
    want = len(re.sub(r"[\s\W_]+", "", D["lines"][i][0]))
    for c in cs:
        n = len(re.sub(r"[\s\W_]+", "", c["txt"]))
        ok = 75 < c["f0"] < D["f0max"] and c["tim"] <= 1.35 and abs(n - want) <= max(1, want * 0.12)
        c["score"] = c["expr"] + 0.08 * min(c["dyn"], 25) - 1.5 * c["tim"] + (0 if ok else -100)
    best = max(cs, key=lambda c: c["score"])
    y, sr = sf.read(os.path.join(TAKES, f"{v}_{i:02d}_s{best['seed']}.wav"), dtype="float32")
    y = trim(y, sr)
    sf.write(os.path.join(VO, f"{v}_{i:02d}.wav"), y / (np.abs(y).max() or 1) * 0.89, sr)
    print(f"{v}_{i:02d} seed {best['seed']} f0 {best['f0']:.0f} expr {best['expr']:.2f} timbre {best['tim']:.2f} score {best['score']:.2f} {len(y) / sr:.1f}s  {best['txt']}")
