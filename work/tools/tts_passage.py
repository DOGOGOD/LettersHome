"""Read each Chinese letter as ONE continuous passage (natural breath and intonation across sentences),
then cut it into lines at the pauses nearest the expected sentence boundaries.

python tts_passage.py voice [voice...]   -> work/vo/<voice>_<nn>.wav (replaces the per-line takes)
"""
import json, os, sys, re
import numpy as np
import soundfile as sf
import torch
import librosa
from qwen_tts import Qwen3TTSModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "vo")
V = json.load(open(os.path.join(ROOT, "voices.json"), encoding="utf-8"))
SLOW = "整段一口气读下来，句与句之间自然停顿换气，情绪随内容起伏，像真人含着感情朗读自己的亲笔信，语速比平常慢。"


def units(s):
    return len(re.sub(r"[\s，。！？；：、…“”—]", "", s)) + 0.0


def split(y, sr, lines):
    hop = int(sr * 0.01)
    rms = librosa.feature.rms(y=y, frame_length=hop * 4, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-9)
    quiet = db < db.max() - 38
    runs, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if j - i >= 18:
                runs.append((i, j))
            i = j
        else:
            i += 1
    act = np.where(~quiet)[0]
    a0, a1 = act[0], act[-1]
    w = np.array([units(l) for l in lines])
    expect = a0 + (a1 - a0) * np.cumsum(w)[:-1] / w.sum()
    cuts, used = [], set()
    for e in expect:
        best, bs = None, 1e9
        for k, (s, t) in enumerate(runs):
            if k in used or s <= a0 or t >= a1:
                continue
            mid = (s + t) / 2
            score = abs(mid - e) / (a1 - a0) * 10 - (t - s) / 100
            if score < bs:
                best, bs = k, score
        used.add(best)
        s, t = runs[best]
        cuts.append(int((s + t) / 2))
    cuts = sorted(cuts)
    bounds = [a0] + cuts + [a1 + 20]
    return [y[max(0, bounds[i] * hop - int(0.05 * sr)) : bounds[i + 1] * hop] for i in range(len(lines))]


if __name__ == "__main__":
    m = Qwen3TTSModel.from_pretrained(os.path.join(ROOT, "models", "Qwen3-TTS-12Hz-1.7B-VoiceDesign"), device_map="cuda:0", dtype=torch.bfloat16)
    for voice in sys.argv[1:]:
        v = V[voice]
        text = "\n".join(v["lines"])
        best = None
        for seed in v.get("passage_seeds", [7, 19, 41]):
            torch.manual_seed(seed)
            wavs, sr = m.generate_voice_design(text=text, language=v["lang"], instruct=v["instruct"] + SLOW)
            y = np.asarray(wavs[0], dtype=np.float32)
            dur = len(y) / sr
            rate = sum(units(l) for l in v["lines"]) / dur
            sf.write(os.path.join(VO, f"passage_{voice}_{seed}.wav"), y / (np.abs(y).max() or 1) * 0.89, sr)
            y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
            f0, vf, _ = librosa.pyin(y16, fmin=60, fmax=420, sr=16000)
            f0 = f0[vf] if np.any(vf) else np.array([0.0])
            med = float(np.median(f0))
            semis = 12 * np.log2(f0 / med) if med > 0 else np.zeros(1)
            expr = float(np.std(semis))
            rms = librosa.feature.rms(y=y16)[0]
            dyn = float(np.percentile(20 * np.log10(rms + 1e-9), 95) - np.percentile(20 * np.log10(rms + 1e-9), 40))
            ok = (med < 150) if v.get("gender") == "m" else (med > 170)
            score = expr + 0.15 * dyn - 2.0 * max(0, rate - 3.2) + (0 if ok else -100)
            print(voice, seed, f"{dur:.1f}s rate {rate:.2f}/s f0 {med:.0f}Hz expr {expr:.2f} dyn {dyn:.1f} ok {ok} score {score:.2f}", flush=True)
            if best is None or score > best[0]:
                best = (score, seed, y, sr)
        rate, seed, y, sr = best
        parts = split(y, sr, v["lines"])
        for i, p in enumerate(parts):
            p = p / (np.abs(p).max() or 1) * 0.89
            sf.write(os.path.join(VO, f"{voice}_{i:02d}.wav"), p, sr)
            print(f"  {voice}_{i:02d} {len(p) / sr:.2f}s", flush=True)
        print(voice, "chose seed", seed, flush=True)
