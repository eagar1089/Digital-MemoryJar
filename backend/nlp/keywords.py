from functools import lru_cache
from typing import List
import os

from backend.text_preprocessor import TextPreprocessor
from backend.nlp.common import logger


@lru_cache(maxsize=1)
def get_keybert_extractor():
    from keybert import KeyBERT
    from sentence_transformers import SentenceTransformer

    embedding_model = SentenceTransformer(
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )
    return KeyBERT(model=embedding_model)


def get_keybert_top_n() -> int:
    value = os.getenv("KEYBERT_TOP_N", "8")
    try:
        parsed = int(value)
        return max(1, min(parsed, 20))
    except ValueError:
        return 8


def extract_keywords(text: str) -> List[str]:
    if not text or not text.strip():
        return []

    top_n = get_keybert_top_n()

    try:
        keybert_extractor = get_keybert_extractor()
        scored_keywords = keybert_extractor.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words=None,
            top_n=top_n,
            use_mmr=True,
            diversity=0.5,
        )

        keywords = [phrase.strip() for phrase, _score in scored_keywords if phrase and phrase.strip()]
        if keywords:
            return keywords
    except ImportError as e:
        logger.warning("KeyBERT dependencies missing (%s). Falling back to TextPreprocessor keywords.", str(e))
    except Exception as e:
        logger.error("KeyBERT extraction failed: %s. Falling back to TextPreprocessor keywords.", str(e))

    try:
        preprocessor = TextPreprocessor()
        return preprocessor.extract_keywords(text, top_n=top_n)
    except Exception as e:
        logger.error("Fallback keyword extraction failed: %s", str(e))
        return []
