# CivicPulse backend — YOLO integration

## What was added

- `ai/infer.py` — runs YOLO on uploaded photo + P1–P4 priority
- `ai/score.py` — priority rules from `config/priority_rules.yaml`
- `classifier.js` — calls Python (default) or HTTP inference API
- `models/best.pt` — your trained weights (not in git; copy manually)
- `inference/app.py` — optional FastAPI server (`INFERENCE_MODE=http`)

## Local setup

```powershell
cd backend
pip install -r requirements.txt
npm install

# Ensure weights exist
dir models\best.pt

# Start API
npm start
```

Check: `GET http://localhost:4000/health` → `model_exists: true`

## Environment

See `.env.example`. Default mode:

```env
INFERENCE_MODE=subprocess
AI_ENABLED=true
AI_MODEL_PATH=./models/best.pt
```

## Test inference CLI

```powershell
python ai/infer.py path\to\photo.jpg
```

## Deploy (Render / single backend folder)

**Root directory:** `backend`

**Build command** (if not using `postinstall`):

```bash
npm install && pip install -r requirements.txt
```

(`npm install` alone also runs `postinstall` → installs Python deps including `pyyaml`.)

**Start command:** `npm start`

**Python on Render:** use a Node service with Python available (default on Render), or Docker. Set `AI_PYTHON=python3`.

1. `models/best.pt` is in the repo (or copy manually)
2. Env vars: see `.env.example` (`AI_ENABLED`, `AI_MODEL_PATH`, etc.)
3. `DATABASE_URL` and CORS origins in production

**Error `No module named 'yaml'`:** Python deps were not installed — fix build command above and redeploy.

Optional HTTP mode: run `npm run inference` alongside Node and set `INFERENCE_MODE=http`.

## Flow

`POST /reports` → multer saves photo → `classifyImage()` → YOLO + priority → `issue_type` + `severity` → DB + `ai_notes` + `repair_priority` in JSON response.
