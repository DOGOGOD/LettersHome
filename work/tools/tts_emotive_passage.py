"""One continuous take per letter (one voice, no drift between sentences), with the per-sentence emotional
directions of tts_emotive.py written into a single arc and the pause-marked text read as a whole; then cut
into sentences at the pauses.

python tts_emotive_passage.py voice [voice...]   -> work/vo/<voice>_<nn>.wav
"""
import os, re, sys
import numpy as np
import soundfile as sf
import torch
from tts_emotive import DIR, VO, feats, trim, units
from tts_passage import split

TAKES = os.path.join(VO, "emotive_passage")
os.makedirs(TAKES, exist_ok=True)
ORD = "一二三四五六七八"
SEEDS = [(s, 0.95) for s in (3, 11, 23, 37, 5, 17, 29, 43)]

if __name__ == "__main__":
    from qwen_tts import Qwen3TTSModel

    m = Qwen3TTSModel.from_pretrained(os.path.join(ROOT := os.path.dirname(VO), "models", "Qwen3-TTS-12Hz-1.7B-VoiceDesign"), device_map="cuda:0", dtype=torch.bfloat16)
    for voice in sys.argv[1:]:
        D = DIR[voice]
        says = [say for say, _ in D["lines"]]
        arc = "".join(f"第{ORD[i]}句，{emo}" for i, (_, emo) in enumerate(D["lines"]))
        instruct = D["voice"] + "整段一口气读完，是同一个人从头到尾，情绪随内容起伏变化，句与句之间自然停顿换气。" + arc
        best = None
        for seed, temp in SEEDS:
            torch.manual_seed(seed)
            wavs, sr = m.generate_voice_design(text="\n".join(says), language="Chinese", instruct=instruct, temperature=temp)
            y = trim(np.asarray(wavs[0], dtype=np.float32), sr)
            sf.write(os.path.join(TAKES, f"{voice}_s{seed}.wav"), y / (np.abs(y).max() or 1) * 0.89, sr)
            med, expr, dyn, _ = feats(y, sr)
            rate = sum(units(s) for s in says) / (len(y) / sr)
            ok = 75 < med < D["f0max"] and D["rate"][0] <= rate <= D["rate"][1]
            score = expr + 0.08 * min(dyn, 25) + (0 if ok else -100)
            print(f"{voice} seed {seed} {len(y) / sr:.1f}s f0 {med:.0f} expr {expr:.2f} dyn {dyn:.1f} rate {rate:.2f} score {score:.2f}", flush=True)
            if best is None or score > best[0]:
                best = (score, seed, y, sr)
        score, seed, y, sr = best
        for i, p in enumerate(split(y, sr, says)):
            p = trim(p, sr)
            sf.write(os.path.join(VO, f"{voice}_{i:02d}.wav"), p / (np.abs(p).max() or 1) * 0.89, sr)
            print(f"  {voice}_{i:02d} {len(p) / sr:.2f}s", flush=True)
        print(voice, "chose seed", seed, flush=True)
