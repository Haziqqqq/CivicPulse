"""
Optional FastAPI inference server (same deploy host as Node).
Start: uvicorn inference.app:app --host 127.0.0.1 --port 8000

Node classifier.js calls INFERENCE_URL when set.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse

BACKEND_ROOT = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(BACKEND_ROOT))

from ai.infer import classify_image_path, DEFAULT_WEIGHTS  # noqa: E402

app = FastAPI(title="CivicPulse Inference", version="1.0")


@app.get("/health")
def health():
    weights = Path(os.getenv("AI_MODEL_PATH", str(DEFAULT_WEIGHTS)))
    return {
        "status": "ok",
        "weights_exist": weights.is_file(),
        "weights_path": str(weights),
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    road_class: str = Form("unknown"),
    conf: float = Form(0.25),
):
    suffix = Path(file.filename or "img.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        weights = Path(os.getenv("AI_MODEL_PATH", str(DEFAULT_WEIGHTS)))
        result = classify_image_path(
            tmp_path,
            weights=weights,
            conf=float(conf),
            road_class=road_class,
        )
        return JSONResponse(result)
    finally:
        Path(tmp_path).unlink(missing_ok=True)
