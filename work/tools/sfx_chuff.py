"""A steam locomotive pulling away (synthesized, so no licence attaches): exhaust chuffs that start slow and
quicken, the hiss between them, a low iron rumble, and the rails' clack — replaces the CC BY field recording.
→ film/assets/audio/sfx/train_chuff.wav"""
import numpy as np
import os

# only the helpers of sfx_synth (importing it would re-run every sound it makes)
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx_synth.py"), encoding="utf-8").read()
exec(_src[: _src.index(chr(10) + "def stereo(")])

sec = 9.0
n = int(sec * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(7)
out = np.zeros(n)
# chuffs: rate rises from ~1.3/s to ~4/s
rate = 1.3 + 2.7 * np.clip(t / 7.0, 0, 1) ** 1.3
phase = np.cumsum(rate) / SR
k_prev = -1
for i in np.nonzero(np.diff(np.floor(phase)) > 0)[0]:
    L = int(SR * (0.32 - 0.12 * min(t[i] / 7.0, 1)))
    if i + L >= n:
        break
    env = np.exp(-np.linspace(0, 5.5, L)) * (1 - np.exp(-np.linspace(0, 60, L)))
    burst = bp(rng.standard_normal(L), 120, 1400) * env
    out[i : i + L] += burst * (0.8 + 0.4 * rng.random()) * (1.0 if (k_prev := k_prev + 1) % 2 == 0 else 0.7)
hiss = bp(noise(sec)[:n], 2500, 7000) * 0.05 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
rumble = lp(noise(sec)[:n], 90) * 2.5 * np.clip(t / 2.0, 0, 1)
clack = np.zeros(n)
for tc in np.arange(1.5, sec, 0.9):
    j = int(tc * SR)
    for d in (0.0, 0.11):
        jj = j + int(d * SR)
        L = int(0.05 * SR)
        if jj + L < n:
            clack[jj : jj + L] += bp(rng.standard_normal(L), 600, 3000) * np.exp(-np.linspace(0, 8, L)) * 0.35
y = out + hiss + rumble + clack
y *= np.minimum(1, t / 0.6) * np.minimum(1, (sec - t) / 1.5)
save("train_chuff", reverb(y, 1.5, 0.3, lpf=4000, seed=81), peak=0.7)
