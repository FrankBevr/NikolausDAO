import torch
from flask import Flask, request, jsonify, send_from_directory

from shap_e.diffusion.sample import sample_latents
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
from shap_e.models.download import load_model, load_config
from shap_e.util.notebooks import decode_latent_mesh

from transformers import pipeline, set_seed

import datetime
import os

batch_size = 1
guidance_scale = 15.0
inference_steps = 64
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

set_seed(datetime.datetime.now().microsecond)
text_generator = pipeline("text-generation", model="facebook/opt-1.3b", do_sample=True)
print("Loaded text generator")

if not os.path.exists("output"):
    os.makedirs("output")


api_app = Flask(__name__)

text_generator_context = """Below are ideas, and heart warming, nice, festive messages generates for the ideas.

Idea: a cow
Message: I sincerely hope you like this cow, happy Nikolaus!

Idea: a dog with a hat
Message: Come Nikolaus day, and this dog will make your day!

Idea: """


@api_app.get("/message")
def message():
    prompt = ""
    prompt_query = request.args.get("prompt")
    if prompt_query and len(prompt_query) > 0:
        prompt = prompt_query

    if len(prompt) == 0:
        return jsonify({"error": "Prompt must not be empty"})

    text_generator_input = text_generator_context + prompt + "\nMessage:"

    text_generator_output = text_generator(
        text_generator_input,
        max_new_tokens=32,
        temperature=0.9,
    )
    generated_text = text_generator_output[0]["generated_text"]
    generated_text = generated_text.replace(text_generator_context, "").strip()

    generated_lines = generated_text.split("\n")
    final_text = generated_lines[1].replace("Message:", "").strip()

    json_response = {
        "prompt": prompt,
        "message": final_text,
    }

    return jsonify(json_response)


@api_app.get("/generate")
def generate():
    prompt = ""
    prompt_query = request.args.get("prompt")
    if prompt_query and len(prompt_query) > 0:
        prompt = prompt_query

    if len(prompt) == 0:
        return jsonify({"error": "Prompt must not be empty"})

    request_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")

    print(
        f"[/generate] [{request_id}] Generating {batch_size} samples for prompt [{prompt}] ..."
    )

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
        karras_steps=inference_steps,
        sigma_min=1e-3,
        sigma_max=160,
        s_churn=0,
    )

    for i, latent in enumerate(latents):
        print(f"[/generate] [{request_id}] Writing sample {i} ...")
        t = decode_latent_mesh(xm, latent).tri_mesh()
        with open(f"output/{request_id}_{i}.obj", "w") as f:
            t.write_obj(f)

    json_response = {
        "request_id": request_id,
        "prompt": prompt,
        "num_samples": batch_size,
        "files": [
            f"http://127.0.0.1:{api_port}/download/{request_id}_{i}.obj"
            for i in range(batch_size)
        ],
    }

    return jsonify(json_response)


@api_app.get("/download/<path:path>")
def send_ply(path):
    abs_path = os.path.abspath(f"output")
    print(f"[/download] Sending {path}")
    return send_from_directory(abs_path, path)
