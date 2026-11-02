"""Sentence-by-sentence emotional reading: one fixed voice description per speaker, plus a direction for each
sentence (what he feels at that moment), and punctuation in the spoken text for breaths and pauses. Several
takes per sentence; the pick is the most expressive take that reads the text correctly, stays male, and keeps
the timbre of the approved reading.

python tts_emotive.py voice [voice...]   -> work/vo/<voice>_<nn>.wav (old takes kept in work/vo/bak_emotive)
"""
import os, re, sys, json, shutil, difflib, glob
import numpy as np
import soundfile as sf
import librosa
import torch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "vo")
TAKES = os.path.join(VO, "emotive")
BAK = os.path.join(VO, "bak_emotive")
os.makedirs(TAKES, exist_ok=True)
os.makedirs(BAK, exist_ok=True)
V = json.load(open(os.path.join(ROOT, "voices.json"), encoding="utf-8"))

DIR = {
    "lin": {
        "voice": "男声，二十四岁的福建青年读书人，嗓音清朗温润、音色偏低、略带沙哑，是一个真实的人在深夜低声朗读自己写给妻子的绝笔信，不是播音腔，气息真实，语速慢。",
        "f0max": 165,
        "rate": (1.6, 3.8),
        "lines": [
            ("意映……卿卿如晤：吾今以此书，与汝……永别矣！",
             "他轻声呼唤妻子的名字，温柔得像怕吵醒她；说到“永别矣”时喉头发紧，声音发颤，几乎说不出口，停顿处能听到吸气。"),
            ("吾作此书时，尚是世中一人；汝看此书时……吾已成为阴间一鬼。",
             "前半句克制、平静，像在陈述一件早已想清楚的事；后半句越说越轻，声音压低、发涩，透出无法挽回的悲凉。"),
            ("吾至爱汝！即此爱汝一念，使吾勇于就死也。",
             "情绪涌上来，“吾至爱汝”深情而用力，带着泪；随后稳住气息，“使吾勇于就死也”一字一字坚定清楚，是含泪的决心。"),
            ("窗外疏梅筛月影，依稀掩映；吾与汝并肩携手，低低切切……何事不语？何情不诉？",
             "回忆起和妻子在一起的夜晚，语气忽然变得轻柔、温暖，带着一点笑意；说到“何事不语，何情不诉”时，笑意里透出心碎，声音渐渐哽住。"),
            ("纸短情长，所未尽者，尚有万千。吾今……不能见汝矣！",
             "强忍了一整封信的眼泪，到这里再也忍不住：前半句低声、疲惫、舍不得停笔；最后一句带着哭腔，声音破碎，尾音颤抖着落下去。"),
        ],
    },
    "dufu": {
        "voice": "男声，四十五岁却已显苍老的诗人，声音低沉、沙哑、浑厚，是真人吟诵自己的诗，古风，抑扬顿挫，节奏有快有慢，不是播音腔。",
        "f0max": 145,
        "rate": (1.2, 3.4),
        "lines": [
            ("国破——山河在，城春——草木深。",
             "站在烧毁的城外望着春天的荒城：“国破”沉重地顿住，“山河在”放缓，带着苦涩；下句语气放空、苍凉，像一声长叹，句尾拖长。"),
            ("感时，花溅泪；恨别，鸟惊心。",
             "情绪起伏变大：“感时花溅泪”声音哽咽发颤，越说越低；“恨别鸟惊心”突然收紧，带着压抑的痛楚和惊惶，节奏比上句快。"),
            ("烽火连三月……家书，抵万金。",
             "“烽火连三月”激愤、急切，节奏紧，音量稍高；停顿一下，“家书抵万金”转为低沉，一字一字慢慢吐出，最后一字拖长成叹息。"),
        ],
    },
}
SEEDS = [(s, 0.9) for s in (3, 11, 23, 37)] + [(s, 1.05) for s in (5, 17, 29, 43)]


def units(s):
    return len(re.sub(r"[\s\W_]+", "", s))


def norm(s):
    return re.sub(r"[\s\W_]+", "", s)


def feats(y, sr):
    y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
    f0, vf, _ = librosa.pyin(y16, fmin=60, fmax=420, sr=16000)
    f0 = f0[vf] if np.any(vf) else np.array([0.0])
    med = float(np.median(f0))
    expr = float(np.std(12 * np.log2(f0 / med))) if med > 0 else 0.0
    rms = 20 * np.log10(librosa.feature.rms(y=y16)[0] + 1e-9)
    dyn = float(np.percentile(rms, 95) - np.percentile(rms, 40))
    mf = librosa.feature.mfcc(y=y16, sr=16000, n_mfcc=20)
    loud = rms > np.percentile(rms, 40)
    timbre = mf[1:, loud[: mf.shape[1]]].mean(axis=1) if loud.any() else mf[1:].mean(axis=1)
    return med, expr, dyn, timbre


def trim(y, sr):
    yt, idx = librosa.effects.trim(y, top_db=40)
    a = max(0, idx[0] - int(0.08 * sr))
    b = min(len(y), idx[1] + int(0.25 * sr))
    return y[a:b]


if __name__ == "__main__":
    voices = sys.argv[1:]
    from qwen_tts import Qwen3TTSModel

    m = Qwen3TTSModel.from_pretrained(os.path.join(ROOT, "models", "Qwen3-TTS-12Hz-1.7B-VoiceDesign"), device_map="cuda:0", dtype=torch.bfloat16)
    for voice in voices:
        D = DIR[voice]
        texts = [say for say, _ in D["lines"]]
        instr = [D["voice"] + emo for _, emo in D["lines"]]
        for seed, temp in SEEDS:
            torch.manual_seed(seed)
            wavs, sr = m.generate_voice_design(text=texts, language=["Chinese"] * len(texts), instruct=instr, temperature=temp)
            for i, w in enumerate(wavs):
                y = np.asarray(w, dtype=np.float32)
                sf.write(os.path.join(TAKES, f"{voice}_{i:02d}_s{seed}.wav"), y / (np.abs(y).max() or 1) * 0.89, sr)
            print(voice, "seed", seed, "done", flush=True)
    del m
    torch.cuda.empty_cache()

    from transformers import pipeline

    asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo", torch_dtype=torch.float16, device="cuda:0")
    for voice in voices:
        D = DIR[voice]
        orig = V[voice]["lines"]
        # the approved reading's timbre (the voice itself was fine; only the delivery was flat)
        refs = [librosa.load(f, sr=None) for f in sorted(glob.glob(os.path.join(VO, f"{voice}_[0-9][0-9].wav")))]
        ref_t = np.mean([feats(y, sr)[3] for y, sr in refs], axis=0)
        report = []
        for i, line in enumerate(orig):
            cands = []
            for f in sorted(glob.glob(os.path.join(TAKES, f"{voice}_{i:02d}_s*.wav"))):
                y, sr = sf.read(f, dtype="float32")
                y = trim(y, sr)
                med, expr, dyn, tim = feats(y, sr)
                txt = asr({"raw": y if sr == 16000 else librosa.resample(y, orig_sr=sr, target_sr=16000), "sampling_rate": 16000}, generate_kwargs={"language": "zh"})["text"]
                cer = 1 - difflib.SequenceMatcher(None, norm(txt), norm(line)).ratio()
                rate = units(line) / (len(y) / sr)
                dist = float(np.linalg.norm(tim - ref_t))
                cands.append(dict(f=f, y=y, sr=sr, med=med, expr=expr, dyn=dyn, dist=dist, cer=cer, rate=rate, txt=txt))
            dmed = float(np.median([c["dist"] for c in cands])) or 1.0
            for c in cands:
                ok = c["med"] < D["f0max"] and c["cer"] < 0.2 and D["rate"][0] <= c["rate"] <= D["rate"][1]
                c["score"] = c["expr"] + 0.12 * c["dyn"] - 1.2 * c["dist"] / dmed - 8 * c["cer"] + (0 if ok else -100)
                print(f"{voice}_{i:02d} {os.path.basename(c['f'])[-8:]:>8} f0 {c['med']:.0f} expr {c['expr']:.2f} dyn {c['dyn']:.1f} timbre {c['dist'] / dmed:.2f} cer {c['cer']:.2f} rate {c['rate']:.2f} score {c['score']:.2f}  {c['txt']}", flush=True)
            best = max(cands, key=lambda c: c["score"])
            dst = os.path.join(VO, f"{voice}_{i:02d}.wav")
            if os.path.exists(dst) and not os.path.exists(os.path.join(BAK, os.path.basename(dst))):
                shutil.copy(dst, os.path.join(BAK, os.path.basename(dst)))
            sf.write(dst, best["y"] / (np.abs(best["y"]).max() or 1) * 0.89, best["sr"])
            report.append((os.path.basename(dst), os.path.basename(best["f"]), round(best["score"], 2)))
            print("  ->", report[-1], flush=True)
        print(voice, report, flush=True)
