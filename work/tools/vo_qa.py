"""QA for generated voice clips: Whisper transcript vs. intended text, median pitch, speaking rate, loudness.

python vo_qa.py pattern [pattern...]   (globs inside work/vo)
"""
import glob, json, os, sys, re, difflib
import numpy as np
import soundfile as sf
import librosa
import torch
from transformers import pipeline

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "vo")
VOICES = json.load(open(os.path.join(ROOT, "voices.json"), encoding="utf-8"))
LANG = {"Chinese": "zh", "English": "en", "French": "fr"}

asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo", torch_dtype=torch.float16, device="cuda:0")


def norm(s):
    return re.sub(r"[\s\W_]+", "", s.lower())


def intended(name):
    m = re.match(r"(ref|test)_(\w+?)(?:_\d+)?\.wav$", name)
    if m:
        v = VOICES[m.group(2)]
        return m.group(2), (v["ref_text"] if m.group(1) == "ref" else v["lines"][0])
    m = re.match(r"(\w+?)_(\d\d)\.wav$", name)
    v = VOICES[m.group(1)]
    return m.group(1), v["lines"][int(m.group(2))]


rows = []
for pat in sys.argv[1:]:
    for f in sorted(glob.glob(os.path.join(VO, pat))):
        name = os.path.basename(f)
        voice, text = intended(name)
        lang = LANG[VOICES[voice]["lang"]]
        y, sr = sf.read(f)
        if y.ndim > 1:
            y = y.mean(1)
        dur = len(y) / sr
        y16 = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000)
        out = asr({"raw": y16, "sampling_rate": 16000}, generate_kwargs={"language": lang, "task": "transcribe"})
        hyp = out["text"].strip()
        sim = difflib.SequenceMatcher(None, norm(text), norm(hyp)).ratio()
        f0, vf, _ = librosa.pyin(y16, fmin=60, fmax=400, sr=16000)
        f0m = float(np.nanmedian(f0)) if np.any(vf) else 0
        units = len(norm(text)) if lang == "zh" else len(text.split())
        rate = units / dur
        # leading/trailing silence and longest internal pause
        rms = librosa.feature.rms(y=y16, frame_length=800, hop_length=160)[0]
        act = rms > (rms.max() * 0.05)
        idx = np.where(act)[0]
        lead = idx[0] * 0.01 if len(idx) else 0
        tail = (len(act) - idx[-1]) * 0.01 if len(idx) else 0
        gaps, run = [], 0
        for a in act[idx[0]:idx[-1]] if len(idx) else []:
            run = run + 1 if not a else 0
            gaps.append(run)
        maxgap = max(gaps) * 0.01 if gaps else 0
        rows.append((name, dur, sim, f0m, rate, maxgap, hyp))
        print(f"{name:22s} {dur:5.2f}s sim={sim:.2f} f0={f0m:5.0f}Hz rate={rate:4.1f}/s gap={maxgap:.2f}s lead={lead:.2f} tail={tail:.2f} | {hyp}", flush=True)
