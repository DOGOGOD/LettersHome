"""Cut a continuous passage into its script lines using Whisper character timestamps aligned to the text.

python split_align.py voice:seed [voice:seed ...]
"""
import json, os, re, sys, difflib
import numpy as np
import soundfile as sf
import librosa
import torch
from transformers import pipeline

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "vo")
V = json.load(open(os.path.join(ROOT, "voices.json"), encoding="utf-8"))
asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo", torch_dtype=torch.float16, device="cuda:0")
norm = lambda s: re.sub(r"[\s\W_]+", "", s)

for arg in sys.argv[1:]:
    voice, seed = arg.split(":")
    y, sr = sf.read(os.path.join(VO, f"passage_{voice}_{seed}.wav"))
    y16 = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000)
    out = asr({"raw": y16, "sampling_rate": 16000}, return_timestamps="word", generate_kwargs={"language": "zh"})
    hyp, times = "", []
    for ch in out["chunks"]:
        t0, t1 = ch["timestamp"]
        txt = norm(ch["text"])
        if not txt:
            continue
        t1 = t1 if t1 is not None else t0 + 0.3
        for k, c in enumerate(txt):
            hyp += c
            times.append((t0 + (t1 - t0) * k / len(txt), t0 + (t1 - t0) * (k + 1) / len(txt)))
    lines = V[voice]["lines"]
    ref = "".join(norm(l) for l in lines)
    # ref index -> hyp index
    m = {}
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ref, hyp, autojunk=False).get_opcodes():
        for k in range(i2 - i1):
            m[i1 + k] = min(j1 + (k * max(j2 - j1, 1)) // max(i2 - i1, 1), len(hyp) - 1)
    print(voice, "transcript:", out["text"][:120])
    bounds, acc = [], 0
    for l in lines[:-1]:
        acc += len(norm(l))
        end_t = times[m[acc - 1]][1]
        start_t = times[m[acc]][0]
        bounds.append((end_t + start_t) / 2 if start_t > end_t else end_t + 0.05)
    # snap every cut to the nearest real pause (Whisper timestamps run a little early)
    hop = int(sr * 0.01)
    rms = librosa.feature.rms(y=y, frame_length=hop * 4, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-9)
    quiet = db < db.max() - 34
    runs, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if j - i >= 8:
                runs.append(((i + j) / 2 * 0.01, (j - i) * 0.01))
            i = j
        else:
            i += 1
    snapped = []
    for b in bounds:
        cand = [(abs(c - b) - 0.3 * min(L, 1.0), c) for c, L in runs if abs(c - b) < 1.6 and c > (snapped[-1] if snapped else 0) + 0.3]
        snapped.append(min(cand)[1] if cand else b)
    bounds = snapped
    edges = [0.0] + bounds + [len(y) / sr]
    for i in range(len(lines)):
        a, b = int(edges[i] * sr), int(edges[i + 1] * sr)
        seg = y[a:b]
        f = int(0.02 * sr)
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        sf.write(os.path.join(VO, f"{voice}_{i:02d}.wav"), seg / (np.abs(seg).max() or 1) * 0.89, sr)
        print(f"  {voice}_{i:02d} {edges[i]:.2f}-{edges[i + 1]:.2f}")
