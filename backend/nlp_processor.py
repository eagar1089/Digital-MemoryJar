"""
AI NLP Processing Pipeline Template
1. Text Preprocessing & Cleaning (text_preprocessor.py)
2. Emotion Analysis
3. Keyword & Topic Extraction
4. Entity Recognition
5. Embedding Generation
6. Store in MongoDB + FAISS
"""

from typing import Dict, List, Optional
import logging
import json
import os
from urllib import error, request
from datetime import datetime
from functools import lru_cache

from backend.connection import get_collection
from backend.crud import update_memory_with_nlp
from backend.text_preprocessor import TextPreprocessor, preprocess_unprocessed_memories

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# ----------------------------------------------------------------------
# Helper functions for Hugging Face API calls
# ----------------------------------------------------------------------
def _get_hf_timeout_seconds() -> int:
    """Get timeout for HF inference requests from env, default 20 seconds."""
    value = os.getenv("HF_INFERENCE_TIMEOUT_SECONDS", "20")
    try:
        return int(value)
    except ValueError:
        return 20
def _hf_inference_endpoints(model_id: str) -> List[str]:
    """Return ordered Hugging Face inference endpoints to try."""
    explicit_base = os.getenv("HF_INFERENCE_BASE_URL", "").strip().rstrip("/")
    endpoints: List[str] = []
    if explicit_base:
        endpoints.append(f"{explicit_base}/{model_id}")

    endpoints.extend([
        f"https://router.huggingface.co/hf-inference/models/{model_id}",
        f"https://api-inference.huggingface.co/models/{model_id}",
    ])
    # Remove duplicates
    deduped: List[str] = []
    seen = set()
    for endpoint in endpoints:
        if endpoint not in seen:
            deduped.append(endpoint)
            seen.add(endpoint)
    return deduped













# ----------------------------------------------------------------------
# Keyword extraction with KeyBERT (cached model)
# ----------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_keybert_extractor():
    """Initialize KeyBERT with a multilingual sentence-transformer once."""
    from keybert import KeyBERT
    from sentence_transformers import SentenceTransformer
    embedding_model = SentenceTransformer(
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )
    return KeyBERT(model=embedding_model)
def _get_keybert_top_n() -> int:
    """Get number of keywords to extract from env, default 8."""
    value = os.getenv("KEYBERT_TOP_N", "8")
    try:
        parsed = int(value)
        return max(1, min(parsed, 20))
    except ValueError:
        return 8












# ----------------------------------------------------------------------
# Zero-shot topic classification
# ----------------------------------------------------------------------
@lru_cache(maxsize=1)
def _get_zero_shot_classifier():
    from transformers import pipeline
    return pipeline("zero-shot-classification", model="joeddav/xlm-roberta-large-xnli")

def _get_topic_candidate_labels() -> List[str]:
    # configured = os.getenv("TOPIC_LABELS", "").strip()
    # if configured:
    #     return [label.strip() for label in configured.split(",") if label.strip()]
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


def _get_topic_score_threshold() -> float:
    """Minimum confidence score for topic assignment."""
    value = os.getenv("TOPIC_MIN_SCORE", "0.2")
    try:
        parsed = float(value)
        return max(0.0, min(parsed, 1.0))
    except ValueError:
        return 0.2


def _get_topic_max_labels() -> int:
    """Maximum number of topics to assign per memory."""
    value = os.getenv("TOPIC_MAX_LABELS", "2")
    try:
        parsed = int(value)
        return max(1, min(parsed, 5))
    except ValueError:
        return 2







# ----------------------------------------------------------------------
# Named Entity Recognition
# ----------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_hf_ner_pipeline():
    """Load Hugging Face multilingual NER pipeline."""
    from transformers import pipeline
    return pipeline(
        "token-classification",
        model="Davlan/bert-base-multilingual-cased-ner-hrl",
        aggregation_strategy="simple",
    )


@lru_cache(maxsize=1)
def _get_spacy_ner_model():
    """Load spaCy multilingual NER model (fallback)."""
    import spacy
    return spacy.load("xx_ent_wiki_sm")


def _get_ner_score_threshold() -> float:
    """Minimum confidence for NER entities (optional env)."""
    value = os.getenv("NER_MIN_SCORE", "0.35")
    try:
        parsed = float(value)
        return max(0.0, min(parsed, 1.0))
    except ValueError:
        return 0.35













# ----------------------------------------------------------------------
# Embedding generation
# ----------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_embedding_model_instance():
    """Load SentenceTransformer model for multilingual embeddings."""
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")


# ----------------------------------------------------------------------
# General helpers

def _flatten_hf_labels(payload: object) -> List[Dict[str, float]]:
    """Convert Hugging Face API output to list of {label, score} dicts."""
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


def _dedupe_text_items(items: List[str]) -> List[str]:
    """Remove duplicate strings (case‑insensitive)."""
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













# ----------------------------------------------------------------------
# Text cleaning
def clean_text(text: str) -> str:
    """
    Normalize, tokenize, lemmatize, remove stopwords
    """
    preprocessor = TextPreprocessor()
    result = preprocessor.preprocess(text)
    return result["cleaned"]


# ----------------------------------------------------------------------
# Emotion scoring (using Hugging Face API)
# ----------------------------------------------------------------------

EMOTION_BUCKET_LABELS = {
    "joy": {"joy", "amusement", "excitement", "optimism", "contentment", "happy", "excited", "content"},
    "sadness": {"sadness", "disappointment", "grief", "remorse", "hurt", "lonely", "disappointed"},
    "anger": {"anger", "annoyance", "rage", "frustration", "frustrated", "annoyed", "furious"},
    "fear": {"fear", "nervousness", "anxiety", "worry", "anxious", "nervous", "worried"},
    "surprise": {"surprise", "realization", "amazed", "amaze", "shocked"},
    "disgust": {"disgust", "disapproval", "embarrassment", "dislike", "uncomfortable"},
}


def _neutral_emotion_scores() -> Dict[str, float]:
    """Return zero‑initialized emotion score dict."""
    return {
        "joy": 0.0,
        "sadness": 0.0,
        "anger": 0.0,
        "fear": 0.0,
        "surprise": 0.0,
        "disgust": 0.0,
    }


def _bucketize_emotions(label_scores: List[Dict[str, float]]) -> Dict[str, float]:
    bucket_scores = _neutral_emotion_scores()
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
        return _neutral_emotion_scores()

    hf_api_token = os.getenv("HF_API_TOKEN")
    hf_timeout_seconds = _get_hf_timeout_seconds()

    if not hf_api_token:
        logger.warning("HF_API_TOKEN missing. Returning default emotion scores.")
        return _neutral_emotion_scores()

    body = json.dumps({"inputs": text, "options": {"wait_for_model": True}}).encode("utf-8")
    last_error: Optional[str] = None

    for endpoint in _hf_inference_endpoints("AnasAlokla/multilingual_go_emotions"):
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

            label_scores = _flatten_hf_labels(payload)
            if not label_scores:
                last_error = "No valid label scores from Hugging Face response."
                logger.warning("%s Endpoint: %s", last_error, endpoint)
                continue

            return _bucketize_emotions(label_scores)

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

    return _neutral_emotion_scores()



















# ----------------------------------------------------------------------
# Keyword extraction (KeyBERT with fallback)
# ----------------------------------------------------------------------

def extract_keywords(text: str) -> List[str]:
    """Extract keywords using KeyBERT (multilingual) or fallback."""
    if not text or not text.strip():
        return []

    top_n = _get_keybert_top_n()

    try:
        keybert_extractor = _get_keybert_extractor()
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




















# ----------------------------------------------------------------------
# Topic categorization
# ----------------------------------------------------------------------

def categorize_topics(text: str, keywords: List[str]) -> List[str]:
    if not text or not text.strip():
        return ["Daily Life"]

    candidate_labels = _get_topic_candidate_labels()
    min_score = _get_topic_score_threshold()
    max_labels = _get_topic_max_labels()
    text_for_classification = text
    if keywords:
        text_for_classification = f"{text}\nKeywords: {', '.join(keywords[:10])}"

    try:
        classifier = _get_zero_shot_classifier()
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



























# ----------------------------------------------------------------------
# Named Entity Recognition (HF + spaCy fallback)
# ----------------------------------------------------------------------

def extract_entities(text: str) -> List[str]:
    """Extract named entities using multilingual HF NER with spaCy fallback."""
    if not text or not text.strip():
        return []

    min_score = _get_ner_score_threshold()

    try:
        ner_pipeline = _get_hf_ner_pipeline()
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

        entities = _dedupe_text_items(entities)
        if entities:
            return entities
    except ImportError as e:
        logger.warning("Transformers dependency missing for NER (%s).", str(e))
    except Exception as e:
        logger.error("Hugging Face NER failed: %s", str(e))

    try:
        nlp = _get_spacy_ner_model()
        doc = nlp(text)
        entities = _dedupe_text_items([ent.text for ent in doc.ents])
        if entities:
            return entities
    except ImportError as e:
        logger.warning("spaCy dependency missing for NER fallback (%s).", str(e))
    except Exception as e:
        logger.error("spaCy NER fallback failed: %s", str(e))

    return []























# ----------------------------------------------------------------------
# Embedding generation (Sentence Transformers)
# ----------------------------------------------------------------------

def generate_embedding(text: str) -> Dict:
    """Generate multilingual sentence embedding using Sentence Transformers."""
    model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    if not text or not text.strip():
        return {
            "vector": [],
            "model": model_name,
        }

    try:
        embedding_model = _get_embedding_model_instance()
        vector = embedding_model.encode(text, convert_to_tensor=False, normalize_embeddings=True)

        if hasattr(vector, "tolist"):
            vector_list = vector.tolist()
        else:
            vector_list = list(vector)

        return {
            "vector": vector_list,
            "model": model_name,
        }
    except ImportError as e:
        logger.warning("sentence-transformers dependency missing for embeddings (%s).", str(e))
    except Exception as e:
        logger.error("Embedding generation failed: %s", str(e))

    return {
        "vector": [],
        "model": model_name,
    }






















# ----------------------------------------------------------------------
# FAISS storage (placeholder – to be implemented)
# ----------------------------------------------------------------------

def store_embedding_in_faiss(vector: List[float], memory_id: str, faiss_index) -> int:
    """
    Store vector embedding in FAISS index and return its ID.
    
    Args:
        vector: Embedding vector
        memory_id: MongoDB ObjectId
        faiss_index: FAISS IndexFlatL2 instance
    
    Returns:
        embedding_id: Position in FAISS index
    """
    # TODO: Implement actual FAISS integration
    # import faiss
    # import numpy as np
    # index.add(np.array([vector]).astype('float32'))
    # embedding_id = index.ntotal - 1
    # Save mapping: embedding_id → memory_id in a separate collection
    
    embedding_id = 4271  # Dummy ID for now
    return embedding_id









# ----------------------------------------------------------------------
# Main processing loop (called by scheduler)
# ----------------------------------------------------------------------

def process_unprocessed_memories(batch_size: int = 50) -> Dict:
    """
    Order of operations:
    1. Text Preprocessing & cleaning spaCy already done in separate step
    2. Emotion Analysis
    3. Keyword & Topic Extraction
    4. Entity Recognition
    5. Embedding Generation
    6. Store in MongoDB
    """
    col = get_collection("memories")
    
    # Step 1: Preprocess any memories without preprocessing
    preprocessing_result = preprocess_unprocessed_memories(batch_size)
    
    # Step 2: Process preprocessed memories for emotion/embedding
    unprocessed = list(col.find(
        {
            "preprocessing": {"$exists": True},
            "nlp_insights": {"$exists": False}
        }
    ).limit(batch_size))
    
    processed_count = 0
    failed_count = 0
    errors = []
    
    for memory in unprocessed:
        try:
            memory_id = str(memory["_id"])
            preprocessed = memory.get("preprocessing", {})
            cleaned_text = preprocessed.get("cleaned", "")
            preprocessing_keywords = preprocessed.get("keywords", [])
            
            if not cleaned_text:
                continue
            
            logger.info(f"Processing memory {memory_id}...")
            
            # Run NLP pipeline on cleaned text
            emotion_scores = extract_emotion_scores(cleaned_text)
            keywords = extract_keywords(cleaned_text) or preprocessing_keywords
            topics = categorize_topics(cleaned_text, keywords)
            entities = extract_entities(cleaned_text)
            embedding_data = generate_embedding(cleaned_text)
            embedding_id = store_embedding_in_faiss(
                embedding_data["vector"],
                memory_id,
                faiss_index=None   # FAISS index not yet initialized
            )
            
            # Determine mood from top emotion
            mood = max(emotion_scores, key=emotion_scores.get) if emotion_scores else "neutral"
            
            # Prepare update data
            nlp_data = {
                "content_clean": cleaned_text,
                "mood": mood,
                "embedding_id": embedding_id,
                "nlp_insights": {
                    "emotion_scores": emotion_scores,
                    "keywords": keywords,
                    "topics": topics,
                    "entities": entities,
                },
            }
            
            # Update memory in MongoDB
            if update_memory_with_nlp(memory_id, nlp_data):
                processed_count += 1
                logger.info(f"✓ Processed {memory_id}")
            else:
                failed_count += 1
                errors.append(f"Failed to update {memory_id}")
        
        except Exception as e:
            failed_count += 1
            error_msg = f"Error processing {memory.get('_id')}: {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg)
    
    return {
        "preprocessing": preprocessing_result,
        "nlp_processing": {
            "total": len(unprocessed),
            "processed": processed_count,
            "failed": failed_count,
            "errors": errors,
        }
    }