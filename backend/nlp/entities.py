from functools import lru_cache
from typing import List
import os

from backend.nlp.common import dedupe_text_items, logger


@lru_cache(maxsize=1)
def get_hf_ner_pipeline():
    from transformers import pipeline

    return pipeline(
        "token-classification",
        model="Davlan/bert-base-multilingual-cased-ner-hrl",
        aggregation_strategy="simple",
    )


@lru_cache(maxsize=1)
def get_spacy_ner_model():
    import spacy

    return spacy.load("xx_ent_wiki_sm")


def get_ner_score_threshold() -> float:
    value = os.getenv("NER_MIN_SCORE", "0.35")
    try:
        parsed = float(value)
        return max(0.0, min(parsed, 1.0))
    except ValueError:
        return 0.35


def extract_entities(text: str) -> List[str]:
    if not text or not text.strip():
        return []

    min_score = get_ner_score_threshold()

    try:
        ner_pipeline = get_hf_ner_pipeline()
        raw_entities = ner_pipeline(text)
        entities = []

        for item in raw_entities:
            if not isinstance(item, dict):
                continue
            entity_text = str(item.get("word", "")).strip()
            score = item.get("score", 0.0)
            try:
                score_value = float(score)
            except (TypeError, ValueError):
                score_value = 0.0

            if entity_text and score_value >= min_score:
                entities.append(entity_text)

        entities = dedupe_text_items(entities)
        if entities:
            return entities
    except ImportError as e:
        logger.warning("Transformers dependency missing for NER (%s).", str(e))
    except Exception as e:
        logger.error("Hugging Face NER failed: %s", str(e))

    try:
        nlp = get_spacy_ner_model()
        doc = nlp(text)
        entities = dedupe_text_items([ent.text for ent in doc.ents])
        if entities:
            return entities
    except ImportError as e:
        logger.warning("spaCy dependency missing for NER fallback (%s).", str(e))
    except Exception as e:
        logger.error("spaCy NER fallback failed: %s", str(e))

    return []
