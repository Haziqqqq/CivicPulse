"""P1–P4 priority scoring for detections (used by infer.py)."""
from __future__ import annotations

from pathlib import Path

import yaml

BACKEND_ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = BACKEND_ROOT / "config" / "priority_rules.yaml"

PRIORITY_ORDER = {"P1": 0, "P2": 1, "P3": 2, "P4": 3, "REVIEW": 4, "NONE": 5}


def load_rules() -> dict:
    with RULES_PATH.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def size_category(area_ratio: float, rules: dict) -> str:
    th = rules["size_thresholds"]
    if area_ratio <= th["minor_max"]:
        return "minor"
    if area_ratio <= th["moderate_max"]:
        return "moderate"
    return "severe"


def composite_score(det: dict, road_class: str, rules: dict) -> float:
    class_weights = rules.get("class_weights", {})
    size_mult = rules.get("size_multipliers", {})
    road_mult = rules.get("road_class_multipliers", {})

    name = det.get("class_name", "")
    base = float(class_weights.get(name, 0.5))

    area_ratio = det.get("bbox_area_ratio", 0.0)
    base *= float(size_mult.get(size_category(area_ratio, rules), 1.0))

    conf = det.get("confidence", 0.0)
    base *= min(1.0, conf / 0.7)

    road = road_class or "unknown"
    base *= float(road_mult.get(road, 1.0))

    return min(1.0, max(0.0, base))


def score_to_priority(score: float, rules: dict) -> str:
    bands = rules.get("priority_bands", {})
    if score >= bands.get("P1", 0.75):
        return "P1"
    if score >= bands.get("P2", 0.55):
        return "P2"
    if score >= bands.get("P3", 0.35):
        return "P3"
    return "P4"


def score_detection(det: dict, road_class: str, rules: dict) -> dict:
    min_conf = rules.get("min_confidence", 0.35)
    review_conf = rules.get("review_confidence", 0.5)
    conf = det.get("confidence", 0.0)

    if conf < min_conf:
        return {
            **det,
            "priority": "REVIEW",
            "composite_score": None,
            "size_category": size_category(det.get("bbox_area_ratio", 0), rules),
            "reason": "below_min_confidence",
        }

    score = composite_score(det, road_class, rules)
    priority = score_to_priority(score, rules)
    result = {
        **det,
        "priority": priority,
        "composite_score": round(score, 4),
        "size_category": size_category(det.get("bbox_area_ratio", 0), rules),
    }
    if conf < review_conf:
        result["priority"] = "REVIEW"
        result["reason"] = "low_confidence_suggested_review"
        result["suggested_priority"] = priority
    return result


def max_priority(dets: list[dict]) -> str:
    if not dets:
        return "NONE"
    best = "P4"
    for d in dets:
        p = d.get("priority", "P4")
        if p == "REVIEW":
            return "REVIEW"
        if PRIORITY_ORDER.get(p, 9) < PRIORITY_ORDER.get(best, 9):
            best = p
    return best


def priority_to_severity(priority: str) -> str:
    mapping = {
        "P1": "critical",
        "P2": "high",
        "P3": "medium",
        "P4": "low",
        "REVIEW": "medium",
        "NONE": "medium",
    }
    return mapping.get(priority, "medium")
