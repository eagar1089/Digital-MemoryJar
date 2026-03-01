from functools import lru_cache
from typing import List
import os

from backend.nlp.common import logger


@lru_cache(maxsize=1)
def get_zero_shot_classifier():
    from transformers import pipeline

    return pipeline("zero-shot-classification", model="joeddav/xlm-roberta-large-xnli")


def get_topic_candidate_labels() -> List[str]:
    return [
        "Work & Productivity",
        "Health & Wellness",
        "Emotions & Mental Health",
        "Relationships & Family",
        "Learning & Growth",
        "Finance",
        "Travel & Leisure",
        "Daily Life",
    ]


def get_topic_score_threshold() -> float:
    value = os.getenv("TOPIC_MIN_SCORE", "0.2")
    try:
        parsed = float(value)
        return max(0.0, min(parsed, 1.0))
    except ValueError:
        return 0.2


def get_topic_max_labels() -> int:
    value = os.getenv("TOPIC_MAX_LABELS", "2")
    try:
        parsed = int(value)
        return max(1, min(parsed, 5))
    except ValueError:
        return 2


def categorize_topics(text: str, keywords: List[str]) -> List[str]:
    if not text or not text.strip():
        return ["Daily Life"]

    candidate_labels = get_topic_candidate_labels()
    min_score = get_topic_score_threshold()
    max_labels = get_topic_max_labels()
    text_for_classification = text
    if keywords:
        text_for_classification = f"{text}\nKeywords: {', '.join(keywords[:10])}"

    try:
        classifier = get_zero_shot_classifier()
        result = classifier(
            text_for_classification,
            candidate_labels=candidate_labels,
            multi_label=True,
        )

        labels = result.get("labels", []) if isinstance(result, dict) else []
        scores = result.get("scores", []) if isinstance(result, dict) else []

        ranked_topics: List[str] = []
        for label, score in zip(labels, scores):
            if float(score) >= min_score:
                ranked_topics.append(str(label))
            if len(ranked_topics) >= max_labels:
                break

        if ranked_topics:
            return ranked_topics

        if labels:
            return [str(labels[0])]
    except ImportError as e:
        logger.warning("Transformers dependencies missing for topic classification (%s).", str(e))
    except Exception as e:
        logger.error("Zero-shot topic classification failed: %s", str(e))

    topics = []
    work_keywords = ["work", "email", "project", "deliverable", "deadline"]
    health_keywords = ["walk", "exercise", "sleep", "health", "tired"]
    mood_keywords = ["grateful", "happy", "sad", "anxious", "stressed"]

    text_lower = text.lower()

    if any(k in text_lower for k in work_keywords):
        topics.append("Work & Productivity")
    if any(k in text_lower for k in health_keywords):
        topics.append("Health & Wellness")
    if any(k in text_lower for k in mood_keywords):
        topics.append("Emotions & Mental Health")

    return topics or ["Daily Life"]
