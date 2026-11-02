"""MiniMax H3 image-to-video batch runner against the local ComfyUI API.

Usage: python comfy_vid.py jobs.json img_dir out_dir [--only id1,id2] [--force]
jobs.json: [{"id": "s03_trench", "image": "s03_trench.png", "prompt": "...", "seconds": 5,
             "w": 1344, "h": 768, "seed": 1, "steps": 8}]
Outputs <out_dir>/<id>.mp4 (video with H3's native audio).
"""
import json, sys, time, os, uuid, urllib.request, urllib.parse, mimetypes

sys.path.insert(0, os.path.dirname(__file__))
from comfy_gen import HOST, post, get  # noqa: E402


def upload(path):
    boundary = uuid.uuid4().hex
    name = os.path.basename(path)
    data = open(path, "rb").read()
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{name}\"\r\n"
            f"Content-Type: {mimetypes.guess_type(name)[0] or 'image/png'}\r\n\r\n").encode() + data + \
           f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(HOST + "/upload/image", data=body,
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return json.loads(urllib.request.urlopen(req).read())["name"]


def frames_for(seconds):
    n = max(5, round(seconds * 24))
    return n + (5 - n % 17) % 17


def h3_graph(img_name, prompt, w, h, seconds, seed, steps=8, prefix="h3", last_img=None, lora=True):
    g = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_h3_fl2va_pruned_w6a8.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "minimax_h3_fl2v_turbo_8step_v1.1_768p_comfyui_bf16.safetensors", "strength_model": 1.0}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", "type": "minimax", "device": "default"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_video_vae_int8_convrot.safetensors"}},
        "5": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_audio_vae_fp32.safetensors"}},
        "6": {"class_type": "LoadImage", "inputs": {"image": img_name}},
        "7": {"class_type": "MiniMaxH3ImageToVideo", "inputs": {"clip": ["3", 0], "vae": ["4", 0], "prompt": prompt, "width": w, "height": h,
                                                                "length": frames_for(seconds), "first_frame": ["6", 0]}},
        "8": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "9": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "res_multistep"}},
        "10": {"class_type": "BasicScheduler", "inputs": {"model": ["2", 0] if lora else ["1", 0], "scheduler": "simple", "steps": steps if lora else 20, "denoise": 1.0}},
        "11": {"class_type": "BasicGuider", "inputs": {"model": ["2", 0] if lora else ["1", 0], "conditioning": ["7", 0]}},
        "12": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["8", 0], "guider": ["11", 0], "sampler": ["9", 0], "sigmas": ["10", 0], "latent_image": ["7", 1]}},
        "13": {"class_type": "VAEDecode", "inputs": {"samples": ["12", 0], "vae": ["4", 0]}},
        "14": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["12", 0], "vae": ["5", 0]}},
        "15": {"class_type": "CreateVideo", "inputs": {"images": ["13", 0], "audio": ["14", 0], "fps": 24.0}},
        "16": {"class_type": "SaveVideo", "inputs": {"video": ["15", 0], "filename_prefix": "video/" + prefix, "format": "mp4", "format.codec": "h264",
                                                      "format.codec.encoding": "re-encode", "format.codec.encoding.crf": 14.0}},
    }
    if last_img:
        g["17"] = {"class_type": "LoadImage", "inputs": {"image": last_img}}
        g["7"]["inputs"]["last_frame"] = ["17", 0]
    return g


def run(graph, timeout=3600):
    r = post("/prompt", {"prompt": graph, "client_id": str(uuid.uuid4())})
    if r.get("node_errors"):
        raise RuntimeError(json.dumps(r["node_errors"])[:2000])
    pid = r["prompt_id"]
    t0 = time.time()
    while time.time() - t0 < timeout:
        time.sleep(3)
        h = get(f"/history/{pid}")
        if pid in h:
            st = h[pid].get("status", {})
            if st.get("status_str") == "error":
                raise RuntimeError(json.dumps(st)[:3000])
            if st.get("completed"):
                return h[pid]["outputs"]
    raise TimeoutError(pid)


def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    img_dir, out = sys.argv[2], sys.argv[3]
    os.makedirs(out, exist_ok=True)
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    force = "--force" in sys.argv
    for j in jobs:
        if only and j["id"] not in only:
            continue
        dest = os.path.join(out, j["id"] + ".mp4")
        if os.path.exists(dest) and not force:
            continue
        t = time.time()
        name = upload(os.path.join(img_dir, j["image"]))
        last = upload(os.path.join(img_dir, j["last"])) if j.get("last") else None
        g = h3_graph(name, j["prompt"], j.get("w", 1344), j.get("h", 768), j.get("seconds", 5), j.get("seed", 7),
                     j.get("steps", 8), prefix="jiashu_" + j["id"], last_img=last, lora=j.get("lora", True))
        outs = run(g)
        files = [f for o in outs.values() for k in ("images", "videos", "gifs") for f in o.get(k, [])]
        f = files[0]
        q = urllib.parse.urlencode({"filename": f["filename"], "subfolder": f.get("subfolder", ""), "type": f.get("type", "output")})
        with urllib.request.urlopen(f"{HOST}/view?{q}") as r, open(dest, "wb") as fh:
            fh.write(r.read())
        print(f"{j['id']}\t{time.time()-t:.1f}s", flush=True)


if __name__ == "__main__":
    main()
