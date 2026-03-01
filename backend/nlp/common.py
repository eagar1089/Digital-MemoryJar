from typing import Dict, List
import logging
import os


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_hf_timeout_seconds() -> int:
    value = os.getenv("HF_INFERENCE_TIMEOUT_SECONDS", "20")
    try:
        return int(value)
    except ValueError:
        return 20


def hf_inference_endpoints(model_id: str) -> List[str]:
    explicit_base = os.getenv("HF_INFERENCE_BASE_URL", "").strip().rstrip("/")
    endpoints: List[str] = []
    if explicit_base:
        endpoints.append(f"{explicit_base}/{model_id}")

    endpoints.extend([
        f"https://router.huggingface.co/hf-inference/models/{model_id}",
        f"https://api-inference.huggingface.co/models/{model_id}",
    ])

    deduped: List[str] = []
    seen = set()
    for endpoint in endpoints:
        if endpoint not in seen:
            deduped.append(endpoint)
            seen.add(endpoint)
    return deduped


def flatten_hf_labels(payload: object) -> List[Dict[str, float]]:
    if not isinstance(payload, list):
        return []

    if payload and isinstance(payload[0], list):
        candidates = payload[0]
    else:
        candidates = payload

    parsed: List[Dict[str, float]] = []
    for item in candidates:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label", "")).strip().lower()
        score = item.get("score", 0.0)
        try:
            parsed.append({"label": label, "score": float(score)})
        except (TypeError, ValueError):
            continue
    return parsed


def dedupe_text_items(items: List[str]) -> List[str]:
    cleaned: List[str] = []
    seen = set()
    for item in items:
        value = item.strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(value)
    return cleaned
