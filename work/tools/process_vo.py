"""Trim, pace, place and level the narration lines → film/assets/audio/vo/<voice>_<nn>.wav + vo_durations.json

Per voice: tempo (pitch-preserving stretch), a small synthetic room (tent, room, dugout, boxcar, cave, open ruin),
then loudness matched to -20 LUFS so the mix stage only sets relative levels.
"""
import glob, json, os, re
import numpy as np
import soundfile as sf
import librosa
import pyloudnorm as pyln
from scipy.signal import fftconvolve

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "vo")
DST = os.path.join(ROOT, "..", "film", "assets", "audio", "vo")
os.makedirs(DST, exist_ok=True)
SR = 48000

ROOMS = {  # tempo (1.0 = untouched: stretching made the voices metallic), reverb seconds, wet, low-pass of the tail
    "dufu": (1.0, 1.2, 0.12, 4000),
    "ballou": (1.0, 0.4, 0.06, 4500),
    "lin": (1.0, 0.5, 0.07, 4500),
    "floch": (1.0, 0.35, 0.06, 4500),
    "zhao": (1.0, 0.35, 0.05, 4500),
    "zuo": (1.0, 0.55, 0.07, 4500),
}


def ir(seconds, lp, seed):
    rng = np.random.default_rng(seed)
    n = int(SR * seconds)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n) * np.exp(-6.9 * t / seconds)
    # crude one-pole low-pass for a darker tail
    a = np.exp(-2 * np.pi * lp / SR)
    out = np.empty_like(noise)
    acc = 0.0
    for i in range(n):
        acc = (1 - a) * noise[i] + a * acc
        out[i] = acc
    out[: int(SR * 0.012)] *= np.linspace(0, 1, int(SR * 0.012))  # pre-delay softening
    return out / np.sqrt(np.sum(out**2))


def trim(y, thr_db=-42, pad=0.06):
    rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=256)[0]
    db = 20 * np.log10(rms + 1e-9)
    idx = np.where(db > db.max() + thr_db)[0]
    if not len(idx):
        return y
    a = max(0, idx[0] * 256 - int(pad * SR))
    b = min(len(y), (idx[-1] + 1) * 256 + 1024 + int(pad * 2 * SR))
    y = y[a:b]
    f = int(0.01 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


meter = pyln.Meter(SR)
durs = {}
irs = {}
for f in sorted(glob.glob(os.path.join(SRC, "*_[0-9][0-9].wav"))):
    name = os.path.basename(f)
    voice = re.match(r"(\w+?)_\d\d\.wav", name).group(1)
    if voice not in ROOMS:
        continue
    tempo, rs, wet, lp = ROOMS[voice]
    y, sr = sf.read(f)
    y = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=SR)
    y = trim(y)
    # soften the codec's brittle top end a little
    from scipy.signal import butter, sosfiltfilt
    y = sosfiltfilt(butter(2, 9500, btype='low', fs=SR, output='sos'), y).astype(np.float32)
    if tempo != 1.0:
        y = librosa.effects.time_stretch(y, rate=tempo)
    if voice not in irs:
        irs[voice] = ir(rs, lp, hash(voice) % 1000)
    tail = fftconvolve(y, irs[voice])[: len(y) + int(rs * SR * 0.6)]
    dry = np.concatenate([y, np.zeros(len(tail) - len(y))])
    out = dry * (1 - wet * 0.5) + tail * wet
    loud = meter.integrated_loudness(out)
    out = pyln.normalize.loudness(out, loud, -20.0)
    peak = np.abs(out).max()
    if peak > 0.89:
        out *= 0.89 / peak
    sf.write(os.path.join(DST, name), out.astype(np.float32), SR, subtype="PCM_16")
    durs[name[:-4]] = round(len(y) / SR, 3)  # speech length (tail excluded) for timing
    print(f"{name} {durs[name[:-4]]:.2f}s")
json.dump(durs, open(os.path.join(ROOT, "vo_durations.json"), "w"), indent=1)
