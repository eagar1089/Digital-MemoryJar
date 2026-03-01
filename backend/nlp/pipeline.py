from typing import Dict

from backend.connection import get_collection
from backend.crud import update_memory_with_nlp
from backend.text_preprocessor import preprocess_unprocessed_memories
from backend.nlp.common import logger
from backend.nlp.emotion import extract_emotion_scores
from backend.nlp.keywords import extract_keywords
from backend.nlp.topics import categorize_topics
from backend.nlp.entities import extract_entities
from backend.nlp.embeddings import generate_embedding
from backend.nlp.storage import store_embedding_in_faiss


def process_unprocessed_memories(batch_size: int = 50) -> Dict:
    col = get_collection("memories")

    preprocessing_result = preprocess_unprocessed_memories(batch_size)

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

            emotion_scores = extract_emotion_scores(cleaned_text)
            keywords = extract_keywords(cleaned_text) or preprocessing_keywords
            topics = categorize_topics(cleaned_text, keywords)
            entities = extract_entities(cleaned_text)
            embedding_data = generate_embedding(cleaned_text)
            embedding_id = store_embedding_in_faiss(
                embedding_data["vector"],
                memory_id,
                faiss_index=None,
            )

            mood = max(emotion_scores, key=emotion_scores.get) if emotion_scores else "neutral"

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
