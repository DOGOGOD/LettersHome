"""Procedural sound effects for 家书 + preparation of the downloaded ones → film/assets/audio/sfx/*.wav

Synthesised: match strike, candle room tone, city fire, wind (warm/cold/mountain), cannon, rifle volley,
distant gunshot, explosion, aircraft drone, crickets, harbour water, steam whistle, paper burning.
"""
import os
import numpy as np
import soundfile as sf
import librosa
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "sfx_src")
OUT = os.path.join(ROOT, "..", "film", "assets", "audio", "sfx")
os.makedirs(OUT, exist_ok=True)
R = np.random.default_rng(1914)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def noise(sec):
    return R.standard_normal(int(sec * SR))


def env(n, a, d, shape=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-shape * np.maximum(0, t - a) / max(d, 1e-4))
    return e


def reverb(x, sec, wet, lpf=4000, seed=0):
    rng = np.random.default_rng(seed)
    n = int(sec * SR)
    t = np.arange(n) / SR
    irr = lp(rng.standard_normal(n), lpf) * np.exp(-6.9 * t / sec)
    irr /= np.sqrt(np.sum(irr**2))
    y = fftconvolve(x, irr)
    y[: len(x)] += x * (1 - wet) / max(wet, 1e-3)
    return y * wet


def slow_mod(sec, rate, depth, seed):
    rng = np.random.default_rng(seed)
    k = max(4, int(sec * rate) + 4)
    pts = rng.uniform(1 - depth, 1 + depth, k)
    return np.interp(np.arange(int(sec * SR)) / SR, np.linspace(0, sec, k), pts)


def crackles(sec, rate, lo=1500, hi=9000, amp=0.6, seed=3):
    rng = np.random.default_rng(seed)
    y = np.zeros(int(sec * SR))
    n = int(sec * rate)
    for _ in range(n):
        i = rng.integers(0, len(y) - 2000)
        L = rng.integers(60, 900)
        y[i : i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 5)) * rng.uniform(0.2, 1) * amp
    return bp(y, lo, hi)


def loopable(y, fade=1.0):
    f = int(fade * SR)
    head, body = y[:f], y[f:]
    body[-f:] = body[-f:] * np.linspace(1, 0, f) + head * np.linspace(0, 1, f)
    return body


def save(name, y, peak=0.8):
    y = np.asarray(y, dtype=np.float32)
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    m = np.abs(y).max() or 1
    sf.write(os.path.join(OUT, name + ".wav"), y / m * peak, SR, subtype="PCM_16")
    print(name, f"{len(y) / SR:.1f}s")


def stereo(a, b):
    n = min(len(a), len(b))
    return np.stack([a[:n], b[:n]], 1)


# --- match strike: scratch, flare, settle
s = bp(noise(0.12), 2000, 8000) * env(int(0.12 * SR), 0.005, 0.08, 3)
fl = lp(noise(1.2), 2500) * env(int(1.2 * SR), 0.03, 0.9, 3) * 0.7
y = np.zeros(int(1.6 * SR))
y[: len(s)] += s
y[int(0.08 * SR) : int(0.08 * SR) + len(fl)] += fl
save("match_strike", reverb(y, 0.5, 0.25, seed=1))

# --- candle room: low room tone + rare soft crackles of the wick
sec = 40
room = lp(noise(sec), 300) * 0.25 + hp(lp(noise(sec), 2000), 200) * 0.02
room += crackles(sec, 0.4, 800, 4000, 0.25, seed=5)
save("candle_room", loopable(room), peak=0.5)

# --- burning city: roar + crackle + gusts, stereo
sec = 45
roarL = lp(noise(sec), 400) * slow_mod(sec, 0.6, 0.45, 2) + lp(noise(sec), 1200) * 0.3 * slow_mod(sec, 1.1, 0.5, 3)
roarR = lp(noise(sec), 400) * slow_mod(sec, 0.6, 0.45, 4) + lp(noise(sec), 1200) * 0.3 * slow_mod(sec, 1.1, 0.5, 5)
cr = crackles(sec, 9, 1200, 9000, 0.9, seed=7)
save("fire_city", stereo(loopable(roarL + cr * 0.6), loopable(roarR + np.roll(cr, 9000) * 0.6)))

# --- wind variants
for name, sec, lo, hi, gust, seed in [("wind_warm", 40, 150, 900, 0.55, 11), ("wind_cold", 40, 300, 2400, 0.7, 12), ("wind_mountain", 40, 120, 1500, 0.6, 13)]:
    ch = []
    for k in range(2):
        n = noise(sec)
        m = slow_mod(sec, 0.25, gust, seed + k)
        y = bp(n, lo, hi) * m + bp(noise(sec), hi, hi * 2.5) * 0.15 * m**2
        ch.append(loopable(y))
    save(name, stereo(*ch), peak=0.6)

# --- cannon (distant): sub thump + noise burst + long tail
def boom(sec=5, f0=55, seed=21, dist=1.0):
    n = int(sec * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (f0 * t - 18 * t**2)) * np.exp(-t * 4)
    burst = lp(noise(sec), 900 / dist) * np.exp(-t * 6)
    y = thump * 0.9 + burst * 0.8
    return reverb(y, 3.5, 0.45, lpf=1500, seed=seed)


save("cannon", boom())
save("explosion", boom(sec=6, f0=45, seed=22) + np.pad(crackles(3, 20, 800, 6000, 0.5, seed=23), (int(0.2 * SR), int(3.5 * SR) + int(6 * SR) - int(3.2 * SR)))[: len(boom(sec=6, f0=45, seed=22))])


# --- rifle shots / volley in fog
def shot(seed):
    rng = np.random.default_rng(seed)
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    crack = hp(rng.standard_normal(n), 900) * np.exp(-t * 60)
    body = lp(rng.standard_normal(n), 600) * np.exp(-t * 18) * 0.8
    return crack + body


y = np.zeros(int(5 * SR))
for i in range(7):
    o = int((0.15 + R.uniform(0, 0.035)) * SR)
    s = shot(30 + i)
    y[o : o + len(s)] += s * R.uniform(0.7, 1.0)
save("volley", reverb(y, 4.0, 0.5, lpf=2500, seed=31))
g = np.zeros(int(3.5 * SR))
s = shot(40)
g[int(0.05 * SR) : int(0.05 * SR) + len(s)] += lp(s, 3000)
save("gunshot_far", reverb(g, 2.5, 0.6, lpf=2000, seed=41))

# --- aircraft drone with doppler (12 s pass)
sec = 12
t = np.arange(int(sec * SR)) / SR
pos = (t - sec / 2) / (sec / 2)
f = 92 * (1 + 0.06 * -np.tanh(pos * 2))
ph = 2 * np.pi * np.cumsum(f) / SR
saw = sum(np.sin(k * ph) / k for k in range(1, 14))
amp = np.exp(-(pos**2) * 2.2)
y = lp(saw, 1400) * amp + lp(noise(sec), 700) * 0.4 * amp
save("aircraft", stereo(y * (0.6 + 0.4 * (1 - pos) / 2), y * (0.6 + 0.4 * (1 + pos) / 2)), peak=0.6)

# --- crickets: chirp trains at ~4.6 kHz
sec = 30
y = np.zeros(int(sec * SR))
for c in range(5):
    f0 = 4300 + c * 180
    period = R.uniform(0.6, 0.9)
    tt = R.uniform(0, 1)
    while tt < sec - 0.3:
        for k in range(3):
            o = int((tt + k * 0.045) * SR)
            n = int(0.03 * SR)
            u = np.arange(n) / SR
            y[o : o + n] += np.sin(2 * np.pi * f0 * u) * np.sin(np.pi * u / 0.03) * R.uniform(0.2, 0.5)
        tt += period * R.uniform(0.9, 1.1)
save("crickets", loopable(reverb(y, 1.0, 0.35, seed=51)), peak=0.35)

# --- harbour water lapping
sec = 35
y = lp(noise(sec), 700) * (0.5 + 0.5 * np.sin(2 * np.pi * np.arange(int(sec * SR)) / SR * 0.35) ** 2) * slow_mod(sec, 0.5, 0.4, 61)
y += bp(noise(sec), 1500, 5000) * 0.05 * slow_mod(sec, 2, 0.8, 62)
save("waves", stereo(loopable(y), loopable(np.roll(y, SR))), peak=0.5)

# --- steam whistle (three pipes)
sec = 3.2
t = np.arange(int(sec * SR)) / SR
e = np.minimum(1, t / 0.15) * np.minimum(1, (sec - t) / 0.6)
y = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 5 * t) * 0.3) for f in (440, 554, 659)) * e + bp(noise(sec), 400, 3000) * 0.3 * e
save("whistle", reverb(y, 3.0, 0.5, lpf=3000, seed=71), peak=0.5)

# --- paper burning: hiss + fine crackle
sec = 8
y = bp(noise(sec), 1500, 7000) * slow_mod(sec, 1.5, 0.6, 81) * 0.3 + crackles(sec, 18, 2000, 9000, 0.6, seed=82)
save("paper_burn", y * np.minimum(1, np.arange(len(y)) / SR / 1.0))

# --- downloaded: rain loop, rain+thunder, pen scratching, train
def load(f, sr=SR):
    y, _ = librosa.load(os.path.join(SRC, f), sr=sr, mono=False)
    return y.T if y.ndim > 1 else np.stack([y, y], 1)


save("rain", load("rain1.wav"), peak=0.7)
save("rain_thunder", load("rain_thunder.wav"), peak=0.8)
pen = load("inkpen.wav")
save("pen", pen, peak=0.6)
save("pen2", load("pen_paper.wav"), peak=0.6)
media = os.path.join(ROOT, "..", "film", ".media", "audio", "sfx")
for f, name in (("sfx_001.mp3", "train_loco"), ("sfx_002.mp3", "train_rattle")):
    y, _ = librosa.load(os.path.join(media, f), sr=SR, mono=False)
    save(name, y.T if y.ndim > 1 else y, peak=0.7)
