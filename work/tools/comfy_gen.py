"""Batch image generation against the local ComfyUI HTTP API.

Usage: python comfy_gen.py jobs.json out_dir [--only id1,id2] [--force]
jobs.json: [{"id": "s01_city", "prompt": "...", "w": 1920, "h": 1088, "seed": 1,
             "model": "zimage"|"qwen", "steps": 8}]
"""
import json, sys, time, uuid, urllib.request, urllib.parse, os, random

HOST = os.environ.get("COMFY_HOST", "http://127.0.0.1:8189")


def zimage_graph(p, w, h, seed, steps=8, shift=3.0, prefix="zi"):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "z_image_turbo_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": p}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "7": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": shift}},
        "8": {"class_type": "KSampler", "inputs": {"model": ["7", 0], "positive": ["4", 0], "negative": ["5", 0],
                                                    "latent_image": ["6", 0], "seed": seed, "steps": steps, "cfg": 1.0,
                                                    "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1.0}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": prefix}},
    }


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


def run(graph):
    cid = str(uuid.uuid4())
    r = post("/prompt", {"prompt": graph, "client_id": cid})
    pid = r["prompt_id"]
    while True:
        time.sleep(1.5)
        h = get(f"/history/{pid}")
        if pid in h:
            st = h[pid].get("status", {})
            if st.get("status_str") == "error":
                raise RuntimeError(json.dumps(st)[:2000])
            if st.get("completed") or h[pid].get("outputs"):
                return h[pid]["outputs"]


def fetch_image(info, dest):
    q = urllib.parse.urlencode({"filename": info["filename"], "subfolder": info.get("subfolder", ""), "type": info.get("type", "output")})
    with urllib.request.urlopen(f"{HOST}/view?{q}") as r, open(dest, "wb") as f:
        f.write(r.read())


def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    only = None
    force = "--force" in sys.argv
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    for j in jobs:
        if only and j["id"] not in only:
            continue
        variants = j.get("n", 1)
        for v in range(variants):
            name = j["id"] + (f"_v{v}" if variants > 1 else "")
            dest = os.path.join(out, name + ".png")
            if os.path.exists(dest) and not force:
                continue
            seed = j.get("seed", random.randint(1, 2**31)) + v * 7919
            t = time.time()
            g = zimage_graph(j["prompt"], j.get("w", 1920), j.get("h", 1088), seed, j.get("steps", 8), j.get("shift", 3.0), prefix="jiashu_" + name)
            outs = run(g)
            imgs = [i for o in outs.values() for i in o.get("images", [])]
            fetch_image(imgs[0], dest)
            print(f"{name}\t{time.time()-t:.1f}s\tseed={seed}", flush=True)


if __name__ == "__main__":
    main()
