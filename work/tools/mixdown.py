"""Mix the film's audio from edl.json exactly as placed (start, media offset, duration, volume, linear fades), master to -16 LUFS."""
import json, os, numpy as np, soundfile as sf, librosa, pyloudnorm as pyln
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILM = os.path.join(ROOT, "..", "film")
E = json.load(open(os.path.join(ROOT, "edl.json"), encoding="utf-8"))
T = json.load(open(os.path.join(FILM, "timeline.json"), encoding="utf-8"))["total"]
SR = 48000
mix = np.zeros((int(T * SR) + SR, 2), np.float32)
cache = {}
for a in E["audio"]:
    if a["src"] not in cache:
        y, _ = librosa.load(os.path.join(FILM, a["src"]), sr=SR, mono=False)
        y = np.stack([y, y]) if y.ndim == 1 else y
        cache[a["src"]] = y.T.astype(np.float32)
    y = cache[a["src"]]
    m0 = int(a["media"] * SR)
    d = a["dur"] if a["dur"] else len(y) / SR - a["media"]
    seg = y[m0 : m0 + int(d * SR)].copy()
    n = len(seg)
    g = np.ones(n, np.float32) * a["vol"]
    if a["fin"]:
        k = min(n, int(a["fin"] * SR)); g[:k] *= np.linspace(0, 1, k)
    if a["fout"]:
        k = min(n, int(a["fout"] * SR)); g[n - k :] *= np.linspace(1, 0, k)
    s = int(a["start"] * SR)
    n = min(n, len(mix) - s)
    mix[s : s + n] += seg[:n] * g[:n, None]
mix = mix[: int(T * SR)]
meter = pyln.Meter(SR)
L = meter.integrated_loudness(mix)
mix *= 10 ** ((-16 - L) / 20)
# soft limiter at -1.5 dBFS for the few transients the gain pushes over
lim = 10 ** (-1.5 / 20)
over = np.abs(mix) > lim * 0.8
mix = np.where(over, np.sign(mix) * (lim * 0.8 + (lim * 0.2) * np.tanh((np.abs(mix) - lim * 0.8) / (lim * 0.2))), mix)
print("in", round(L, 1), "LUFS -> out", round(meter.integrated_loudness(mix), 1), "peak", round(20 * np.log10(np.abs(mix).max()), 2))
sf.write(os.path.join(ROOT, "final_mix.wav"), mix, SR, subtype="PCM_24")
