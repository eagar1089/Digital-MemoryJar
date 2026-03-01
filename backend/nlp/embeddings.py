from functools import lru_cache
from typing import Dict

from backend.nlp.common import logger


@lru_cache(maxsize=1)
def get_embedding_model_instance():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")


def generate_embedding(text: str) -> Dict:
    model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    if not text or not text.strip():
        return {
            "vector": [],
            "model": model_name,
        }

    try:
        embedding_model = get_embedding_model_instance()
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
