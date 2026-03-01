"""Backward-compatible NLP exports.

This module is kept for existing imports while implementation lives in backend.nlp.
"""

from backend.nlp import (
    clean_text,
    extract_emotion_scores,
    extract_keywords,
    categorize_topics,
    extract_entities,
    generate_embedding,
    store_embedding_in_faiss,
    process_unprocessed_memories,
)


__all__ = [
    "clean_text",
    "extract_emotion_scores",
    "extract_keywords",
    "categorize_topics",
    "extract_entities",
    "generate_embedding",
    "store_embedding_in_faiss",
    "process_unprocessed_memories",
]
