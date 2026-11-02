import json, os, sys, torch, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from qwen_tts import Qwen3TTSModel
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = json.load(open(os.path.join(ROOT, "voices.json"), encoding="utf-8"))
m = Qwen3TTSModel.from_pretrained(os.path.join(ROOT, "models", "Qwen3-TTS-12Hz-1.7B-Base"), device_map="cuda:0", dtype=torch.bfloat16)
v = V["zhao"]
prompt = m.create_voice_clone_prompt(ref_audio=os.path.join(ROOT, "vo", v["ref_file"]), ref_text=v["ref_text"])
for s in range(6):
    torch.manual_seed(500 + s)
    w, sr = m.generate_voice_clone(text="宁儿：", language="Chinese", voice_clone_prompt=prompt)
    w = np.asarray(w[0], dtype=np.float32); w = w / (np.abs(w).max() or 1) * 0.89
    sf.write(os.path.join(ROOT, "vo", f"zhaofix_{s}.wav"), w, sr); print("zhaofix", s, len(w) / sr, flush=True)
