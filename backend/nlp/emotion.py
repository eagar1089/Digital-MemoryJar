from typing import Dict, List, Optional
import json
import os
from urllib import error, request

from backend.nlp.common import (
    flatten_hf_labels,
    get_hf_timeout_seconds,
    hf_inference_endpoints,
    logger,
)


EMOTION_BUCKET_LABELS = {
    "joy": {"joy", "amusement", "excitement", "optimism", "contentment", "happy", "excited", "content"},
    "sadness": {"sadness", "disappointment", "grief", "remorse", "hurt", "lonely", "disappointed"},
    "anger": {"anger", "annoyance", "rage", "frustration", "frustrated", "annoyed", "furious"},
    "fear": {"fear", "nervousness", "anxiety", "worry", "anxious", "nervous", "worried"},
    "surprise": {"surprise", "realization", "amazed", "amaze", "shocked"},
    "disgust": {"disgust", "disapproval", "embarrassment", "dislike", "uncomfortable"},
}


def neutral_emotion_scores() -> Dict[str, float]:
    return {
        "joy": 0.0,
        "sadness": 0.0,
        "anger": 0.0,
        "fear": 0.0,
        "surprise": 0.0,
        "disgust": 0.0,
    }


def bucketize_emotions(label_scores: List[Dict[str, float]]) -> Dict[str, float]:
    bucket_scores = neutral_emotion_scores()
    for item in label_scores:
        label = item["label"]
        score = float(item["score"])
        for bucket, aliases in EMOTION_BUCKET_LABELS.items():
            if label in aliases:
                bucket_scores[bucket] += score
                break

    total = sum(bucket_scores.values())
    if total > 0:
        return {k: round(v / total, 4) for k, v in bucket_scores.items()}
    return bucket_scores


def extract_emotion_scores(text: str) -> Dict[str, float]:
    if not text or not text.strip():
        return neutral_emotion_scores()

    hf_api_token = os.getenv("HF_API_TOKEN")
    hf_timeout_seconds = get_hf_timeout_seconds()

    if not hf_api_token:
        logger.warning("HF_API_TOKEN missing. Returning default emotion scores.")
        return neutral_emotion_scores()

    body = json.dumps({"inputs": text, "options": {"wait_for_model": True}}).encode("utf-8")
    last_error: Optional[str] = None

    for endpoint in hf_inference_endpoints("AnasAlokla/multilingual_go_emotions"):
        req = request.Request(
            endpoint,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {hf_api_token}",
                "Content-Type": "application/json",
            },
        )

        try:
            with request.urlopen(req, timeout=hf_timeout_seconds) as res:
                raw_payload = res.read().decode("utf-8")
                payload = json.loads(raw_payload)

            if isinstance(payload, dict) and payload.get("error"):
                last_error = str(payload.get("error"))
                logger.warning("Hugging Face API error from %s: %s", endpoint, last_error)
                continue

            label_scores = flatten_hf_labels(payload)
            if not label_scores:
                last_error = "No valid label scores from Hugging Face response."
                logger.warning("%s Endpoint: %s", last_error, endpoint)
                continue

            return bucketize_emotions(label_scores)

        except error.HTTPError as e:
            try:
                error_body = e.read().decode("utf-8")
            except Exception:
                error_body = ""
            last_error = f"HTTP {e.code} {e.reason}"
            logger.warning(
                "Hugging Face HTTP error via %s: %s. Body: %s",
                endpoint,
                last_error,
                error_body,
            )
            continue
        except error.URLError as e:
            last_error = f"Network error: {e.reason}"
            logger.warning("Hugging Face network error via %s: %s", endpoint, e.reason)
            continue
        except json.JSONDecodeError:
            last_error = "Failed to decode Hugging Face response JSON."
            logger.warning("%s Endpoint: %s", last_error, endpoint)
            continue
        except Exception as e:
            last_error = f"Unexpected emotion scoring error: {str(e)}"
            logger.warning("%s Endpoint: %s", last_error, endpoint)
            continue

    if last_error:
        logger.error("Emotion scoring failed for model. Last error: %s", last_error)

    return neutral_emotion_scores()
