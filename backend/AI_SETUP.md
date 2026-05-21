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

## Deploy (single backend folder)

1. Upload `backend/` including `models/best.pt`
2. Install Python 3.10+ and `pip install -r requirements.txt` on the server
3. `npm install && npm start`
4. Set `DATABASE_URL` and CORS origins in production

Optional HTTP mode: run `npm run inference` alongside Node and set `INFERENCE_MODE=http`.

## Flow

`POST /reports` → multer saves photo → `classifyImage()` → YOLO + priority → `issue_type` + `severity` → DB + `ai_notes` + `repair_priority` in JSON response.
