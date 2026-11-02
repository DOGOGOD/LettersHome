import sys, glob, os, librosa, torch
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo", torch_dtype=torch.float16, device="cuda:0")
for f in sorted(glob.glob(sys.argv[1])):
    y, _ = librosa.load(f, sr=16000)
    print(os.path.basename(f), asr({"raw": y, "sampling_rate": 16000}, generate_kwargs={"language": sys.argv[2]})["text"], flush=True)
