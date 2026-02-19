"""
AI NLP Processing Pipeline Template
====================================

This file shows how to process unprocessed memories with NLP.
Complete pipeline:
1. Text Preprocessing & Cleaning (text_preprocessor.py)
2. Emotion Analysis
3. Keyword & Topic Extraction
4. Entity Recognition
5. Embedding Generation
6. Store in MongoDB + FAISS

You can run this as:
1. Background job (Celery/APScheduler)
2. Manual endpoint (POST /admin/process-memories)
3. Serverless function (AWS Lambda, Google Cloud Functions)

Place this in backend/nlp_processor.py and call it periodically.
"""

from typing import Dict, List, Optional
import logging
from datetime import datetime

from backend.connection import get_collection
from backend.crud import update_memory_with_nlp
from backend.text_preprocessor import TextPreprocessor, preprocess_unprocessed_memories

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



def clean_text(text: str) -> str:
    """
    DEPRECATED: Use TextPreprocessor.preprocess() instead.
    
    This is kept for backward compatibility.
    TextPreprocessor provides comprehensive preprocessing with:
    - Normalization (lowercase, URLs removal, special chars)
    - Tokenization (POS tagging)
    - Lemmatization (word base forms)
    - Stopword removal
    - Keyword extraction
    """
    preprocessor = TextPreprocessor()
    result = preprocessor.preprocess(text)
    return result["cleaned"]



def extract_emotion_scores(text: str) -> Dict[str, float]:
    """
    Extract emotion scores from text.
    This is a TEMPLATE - replace with actual NLP model.
    
    Options:
    1. HuggingFace transformers (distilbert-base-uncased-finetuned-sst-2-english)
    2. TextBlob sentiment
    3. VADER sentiment analyzer
    4. Call external API (OpenAI, Hugging Face Inference)
    """
    # PLACEHOLDER: Return dummy scores
    # TODO: Implement with actual NLP model
    
    return {
        "joy": 0.65,
        "gratitude": 0.55,
        "sadness": 0.1,
        "anger": 0.05,
        "neutral": 0.25,
    }


def extract_keywords(text: str) -> List[str]:
    """
    Extract important keywords/phrases from text.
    
    Options:
    1. RAKE (Rapid Automatic Keyword Extraction)
    2. YAKE (Yet Another Keyword Extractor)
    3. spaCy + noun chunks
    4. TF-IDF
    """
    # PLACEHOLDER: Extract simple noun phrases
    # TODO: Implement with actual NLP library
    
    keywords = [
        "procrastinating project",
        "sudden work email",
        "10-minute walk",
        "clear my head",
    ]
    return keywords


def categorize_topics(text: str, keywords: List[str]) -> List[str]:
    """
    Categorize memory into life topic buckets.
    
    Options:
    1. Zero-shot classification (HuggingFace)
    2. Custom trained classifier
    3. Rule-based categorization
    """
    # PLACEHOLDER: Hardcoded topics based on keywords
    # TODO: Implement with actual classification model
    
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


def extract_entities(text: str) -> List[str]:
    """
    Extract named entities (people, places, organizations).
    
    Options:
    1. spaCy NER
    2. HuggingFace transformers (dslim/bert-base-multilingual-cased-ner)
    3. Stanford NER
    """
    # PLACEHOLDER: Return empty list
    # TODO: Implement with actual NER model
    
    return []


def generate_embedding(text: str) -> Dict:
    """
    Generate vector embedding for semantic search.
    
    Options:
    1. Sentence Transformers (all-MiniLM-L6-v2, all-mpnet-base-v2)
    2. OpenAI embeddings API
    3. Hugging Face embeddings
    
    Returns dict with:
    - vector: List[float] - the embedding
    - model: str - which model was used
    """
    # PLACEHOLDER: Return dummy vector
    # TODO: Implement with actual embedding model
    
    # Example with sentence-transformers:
    # from sentence_transformers import SentenceTransformer
    # model = SentenceTransformer('all-MiniLM-L6-v2')
    # vector = model.encode(text, convert_to_tensor=False)
    
    return {
        "vector": [0.1] * 384,  # Dummy 384-dim vector
        "model": "all-MiniLM-L6-v2",
    }


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
    # TODO: Implement FAISS integration
    # import faiss
    # index.add(np.array([vector]).astype('float32'))
    # embedding_id = index.ntotal - 1
    # Save mapping: embedding_id → memory_id
    
    embedding_id = 4271  # Dummy ID
    return embedding_id


def process_unprocessed_memories(batch_size: int = 50) -> Dict:
    """
    Main NLP Processing Pipeline.
    
    Order of operations:
    1. Text Preprocessing & Cleaning (spaCy)
    2. Emotion Analysis (from clean text)
    3. Keyword & Topic Extraction
    4. Entity Recognition
    5. Embedding Generation
    6. Store in MongoDB
    
    Call this periodically to process new memories.
    """
    col = get_collection("memories")
    
    # Step 1: Preprocess any memories without preprocessing
    # logger.info("Step 1/2: Running text preprocessing...")
    preprocessing_result = preprocess_unprocessed_memories(batch_size)
    # logger.info(f"Preprocessing complete: {preprocessing_result['processed']} processed, {preprocessing_result['failed']} failed")
    
    # Step 2: Process preprocessed memories for emotion/embedding
    # logger.info("Step 2/2: Running emotion analysis and embeddings...")
    
    # Find preprocessed memories without full NLP insights
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
            keywords = preprocessed.get("keywords", [])
            
            if not cleaned_text:
                continue
            
            logger.info(f"Processing memory {memory_id}...")
            
            # Run NLP pipeline on cleaned text
            emotion_scores = extract_emotion_scores(cleaned_text)
            topics = categorize_topics(cleaned_text, keywords)
            entities = extract_entities(cleaned_text)
            embedding_data = generate_embedding(cleaned_text)
            embedding_id = store_embedding_in_faiss(
                embedding_data["vector"],
                memory_id,
                faiss_index=None
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

