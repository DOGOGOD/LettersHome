"""Qwen3-TTS narration for 家书.

python tts.py test            -> one line per voice with VoiceDesign (work/vo/test_*.wav)
python tts.py ref             -> VoiceDesign reference clip per voice (work/vo/ref_<voice>.wav)
python tts.py lines [voice..] -> every line, cloned from the reference with the Base model (work/vo/<voice>_<nn>.wav)
"""
import json, os, sys
import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "vo")
os.makedirs(OUT, exist_ok=True)
VD = os.path.join(ROOT, "models", "Qwen3-TTS-12Hz-1.7B-VoiceDesign")
BASE = os.path.join(ROOT, "models", "Qwen3-TTS-12Hz-1.7B-Base")

VOICES = json.load(open(os.path.join(ROOT, "voices.json"), encoding="utf-8"))


def load(path):
    return Qwen3TTSModel.from_pretrained(path, device_map="cuda:0", dtype=torch.bfloat16)


def save(name, wav, sr):
    wav = np.asarray(wav, dtype=np.float32)
    peak = np.abs(wav).max() or 1.0
    wav = wav / peak * 0.89  # -1 dBFS
    sf.write(os.path.join(OUT, name), wav, sr)
    print(name, f"{len(wav)/sr:.2f}s", flush=True)


def design(model, v, text, seed=7):
    torch.manual_seed(seed)
    wavs, sr = model.generate_voice_design(text=text, language=v["lang"], instruct=v["instruct"])
    return wavs[0], sr


if __name__ == "__main__":
    mode = sys.argv[1]
    pick = sys.argv[2:] or list(VOICES)
    if mode in ("test", "ref"):
        m = load(VD)
        print("languages:", m.get_supported_languages())
        for k in pick:
            v = VOICES[k]
            text = v["ref_text"] if mode == "ref" else v["lines"][0]
            for s in v.get("seeds", [7]) if mode == "ref" else [7]:
                w, sr = design(m, v, text, seed=s)
                save(f"{mode}_{k}_{s}.wav" if mode == "ref" else f"test_{k}.wav", w, sr)
    elif mode == "lines":
        m = load(BASE)
        for k in pick:
            v = VOICES[k]
            ref = os.path.join(OUT, v["ref_file"])
            prompt = m.create_voice_clone_prompt(ref_audio=ref, ref_text=v["ref_text"])
            for i, line in enumerate(v["lines"]):
                torch.manual_seed(100 + i)
                wavs, sr = m.generate_voice_clone(text=line, language=v["lang"], voice_clone_prompt=prompt)
                save(f"{k}_{i:02d}.wav", wavs[0], sr)
