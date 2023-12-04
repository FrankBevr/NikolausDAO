import torch
from flask import Flask, request, jsonify

from shap_e.diffusion.sample import sample_latents
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
from shap_e.models.download import load_model, load_config
from shap_e.util.notebooks import decode_latent_mesh

import datetime
import os

batch_size = 4
guidance_scale = 15.0
api_port = 5000

if torch.cuda.is_available():
    print("Using CUDA")
else:
    print("WARNING: Using CPU")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Loading models ...")

xm = load_model("transmitter", device=device)
print("Loaded transmitter")

model = load_model("text300M", device=device)
print("Loaded text300M")

diffusion = diffusion_from_config(load_config("diffusion"))
print("Loaded diffusion")


if not os.path.exists("output"):
    os.makedirs("output")


api_app = Flask(__name__)


@api_app.get("/generate")
def generate():
    prompt = "a shark"
    prompt_query = request.args.get("prompt")
    if prompt_query and len(prompt_query) > 0:
        prompt = prompt_query

    request_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")

    latents = sample_latents(
        batch_size=batch_size,
        model=model,
        diffusion=diffusion,
        guidance_scale=guidance_scale,
        model_kwargs=dict(texts=[prompt] * batch_size),
        progress=True,
        clip_denoised=True,
        use_fp16=True,
        use_karras=True,
        karras_steps=64,
        sigma_min=1e-3,
        sigma_max=160,
        s_churn=0,
    )

    for i, latent in enumerate(latents):
        t = decode_latent_mesh(xm, latent).tri_mesh()
        with open(f"output/{request_id}_{i}.obj", "w") as f:
            t.write_obj(f)

    json_response = {
        "request_id": request_id,
        "prompt": prompt,
        "num_samples": batch_size,
        "ply_files": [
            f"http://localhost:{api_port}/download/{request_id}_{i}.obj"
            for i in range(batch_size)
        ],
    }

    return jsonify(json_response)


@api_app.get("/download/<path:path>")
def send_ply(path):
    return api_app.send_static_file(path)
