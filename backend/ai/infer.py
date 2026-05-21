"""
Run YOLO inference + priority scoring on one image.
Prints JSON to stdout for Node classifier.js.

Usage:
  python ai/infer.py /path/to/image.jpg [--conf 0.25] [--road-class unknown]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from ai.score import (  # noqa: E402
    load_rules,
    max_priority,
    priority_to_severity,
    score_detection,
)

# YOLO class name -> CivicPulse issue_type
CLASS_TO_ISSUE = {
    "Pothole": "pothole",
    "pothole": "pothole",
    "Sewage-Manhole": "other",
    "Sewage/Manhole": "other",
    "manhole_damage": "other",
}

DEFAULT_WEIGHTS = BACKEND_ROOT / "models" / "best.pt"


def map_issue_type(class_name: str) -> str:
    return CLASS_TO_ISSUE.get(class_name, "other")


def run_inference(image_path: str, weights: Path, conf: float, imgsz: int) -> list[dict]:
    from ultralytics import YOLO

    model = YOLO(str(weights))
    results = model.predict(
        source=image_path,
        conf=conf,
        imgsz=imgsz,
        verbose=False,
    )
    r = results[0]
    if r.boxes is None or len(r.boxes) == 0:
        return []

    h, w = r.orig_shape
    image_area = float(h * w)
    names = r.names or {}
    dets = []
    for i in range(len(r.boxes)):
        cls_id = int(r.boxes.cls[i].item())
        xyxy = r.boxes.xyxy[i].cpu().tolist()
        x1, y1, x2, y2 = xyxy
        bbox_area = (x2 - x1) * (y2 - y1)
        dets.append(
            {
                "class_id": cls_id,
                "class_name": names.get(cls_id, str(cls_id)),
                "confidence": round(float(r.boxes.conf[i].item()), 4),
                "bbox_xyxy": [x1, y1, x2, y2],
                "bbox_area_ratio": round(bbox_area / image_area, 6),
            }
        )
    return dets


def pick_primary_issue(detections: list[dict]) -> tuple[str, str]:
    """Choose issue_type from highest-confidence detection."""
    if not detections:
        return "other", "medium"
    best = max(detections, key=lambda d: d.get("confidence", 0))
    return map_issue_type(best.get("class_name", "")), best.get("class_name", "")


def build_notes(detections: list[dict], max_pri: str, source: str) -> str:
    if not detections:
        return "YOLO: no defects detected — using description fallback if available."
    parts = []
    for d in detections:
        parts.append(
            f"{d.get('class_name')} ({d.get('confidence', 0):.0%}, {d.get('priority', '?')})"
        )
    summary = f"YOLO ({source}): {len(detections)} detection(s). "
    summary += "Highest repair priority: " + max_pri + ". "
    summary += "Details: " + "; ".join(parts)
    return summary[:2000]


def classify_image_path(
    image_path: str,
    weights: Path | None = None,
    conf: float = 0.25,
    imgsz: int = 640,
    road_class: str = "unknown",
) -> dict:
    weights = weights or DEFAULT_WEIGHTS
    if not weights.is_file():
        return {
            "ok": False,
            "error": f"Model weights not found: {weights}",
            "issue_type": "other",
            "severity": "medium",
            "notes": "AI model missing on server. Copy best.pt to backend/models/.",
            "confidence": 0,
            "detections": [],
            "repair_priority": "NONE",
        }

    if not Path(image_path).is_file():
        return {
            "ok": False,
            "error": "Image file not found",
            "issue_type": "other",
            "severity": "medium",
            "notes": "",
            "confidence": 0,
            "detections": [],
            "repair_priority": "NONE",
        }

    raw = run_inference(image_path, weights, conf, imgsz)
    rules = load_rules()
    scored = [score_detection(d, road_class, rules) for d in raw]
    max_pri = max_priority(scored)
    issue_type, _ = pick_primary_issue(scored)
    severity = priority_to_severity(max_pri)
    top_conf = max((d.get("confidence", 0) for d in scored), default=0.0)

    return {
        "ok": True,
        "issue_type": issue_type,
        "severity": severity,
        "repair_priority": max_pri,
        "confidence": top_conf,
        "detections": scored,
        "notes": build_notes(scored, max_pri, "vision"),
        "model_path": str(weights),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", help="Path to image file")
    parser.add_argument("--weights", default=str(DEFAULT_WEIGHTS))
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--road-class", default="unknown")
    args = parser.parse_args()

    out = classify_image_path(
        args.image,
        weights=Path(args.weights),
        conf=args.conf,
        imgsz=args.imgsz,
        road_class=args.road_class,
    )
    print(json.dumps(out))


if __name__ == "__main__":
    main()
