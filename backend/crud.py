from typing import List, Optional
from datetime import datetime
from bson.objectid import ObjectId

from backend.connection import get_collection


def create_memory(data: dict) -> str:
    col = get_collection("memories")
    
    # Add timestamps and metadata
    now = datetime.utcnow()
    data["created_at"] = now
    data["updated_at"] = now
    
    data["is_processed"] = "embedding_id" in data and "nlp_insights" in data
    
    res = col.insert_one(data)
    return str(res.inserted_id)


def list_memories(limit: int = 50, processed_only: bool = False) -> List[dict]:
    col = get_collection("memories")
    
    query = {}
    if processed_only:
        query = {"is_processed": True}
    
    docs = col.find(query).sort("created_at", -1).limit(limit)
    result = []
    for d in docs:
        d["id"] = str(d["_id"])
        # Serialize datetime objects to ISO format
        if "created_at" in d and isinstance(d["created_at"], datetime):
            d["created_at"] = d["created_at"].isoformat()
        if "updated_at" in d and isinstance(d["updated_at"], datetime):
            d["updated_at"] = d["updated_at"].isoformat()
        result.append(d)
    return result


def get_memory_by_id(memory_id: str) -> Optional[dict]:
    """Get a single memory by ID."""
    col = get_collection("memories")
    try:
        doc = col.find_one({"_id": ObjectId(memory_id)})
        if doc:
            doc["id"] = str(doc["_id"])
            if "created_at" in doc and isinstance(doc["created_at"], datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            if "updated_at" in doc and isinstance(doc["updated_at"], datetime):
                doc["updated_at"] = doc["updated_at"].isoformat()
        return doc
    except Exception:
        return None


def update_memory_with_nlp(memory_id: str, nlp_data: dict) -> bool:
    """Update a memory with NLP extraction results.
    
    Args:
        memory_id: MongoDB ObjectId as string
        nlp_data: Dict with content_clean, nlp_insights, embedding_id, etc.
    """
    col = get_collection("memories")
    try:
        nlp_data["updated_at"] = datetime.utcnow()
        nlp_data["is_processed"] = True
        
        result = col.update_one(
            {"_id": ObjectId(memory_id)},
            {"$set": nlp_data}
        )
        return result.modified_count > 0
    except Exception:
        return False


def get_stats() -> dict:
    """Get aggregated stats from memories including emotion analysis."""
    col = get_collection("memories")
    total = col.count_documents({})
    
    # Get most common mood
    mood_pipeline = [
        {"$match": {"mood": {"$exists": True}}},
        {"$group": {"_id": "$mood", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    mood_agg = list(col.aggregate(mood_pipeline))
    most_common_mood = mood_agg[0]["_id"] if mood_agg else None
    
    # Get top emotions across all memories
    emotion_pipeline = [
        {"$match": {"nlp_insights.emotion_scores": {"$exists": True}}},
        {"$group": {
            "_id": None,
            "joy_avg": {"$avg": "$nlp_insights.emotion_scores.joy"},
            "sadness_avg": {"$avg": "$nlp_insights.emotion_scores.sadness"},
            "anger_avg": {"$avg": "$nlp_insights.emotion_scores.anger"},
            "fear_avg": {"$avg": "$nlp_insights.emotion_scores.fear"},
            "surprise_avg": {"$avg": "$nlp_insights.emotion_scores.surprise"},
            "disgust_avg": {"$avg": "$nlp_insights.emotion_scores.disgust"},
        }},
    ]
    emotion_agg = list(col.aggregate(emotion_pipeline))
    top_emotions = {}
    if emotion_agg:
        e = emotion_agg[0]
        top_emotions = {
            "joy": round(e.get("joy_avg", 0), 3),
            "sadness": round(e.get("sadness_avg", 0), 3),
            "anger": round(e.get("anger_avg", 0), 3),
            "fear": round(e.get("fear_avg", 0), 3),
            "surprise": round(e.get("surprise_avg", 0), 3),
            "disgust": round(e.get("disgust_avg", 0), 3),
        }
    
    # Get top topics
    topic_pipeline = [
        {"$match": {"nlp_insights.topics": {"$exists": True}}},
        {"$unwind": "$nlp_insights.topics"},
        {"$group": {"_id": "$nlp_insights.topics", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    topic_agg = list(col.aggregate(topic_pipeline))
    top_topics = [t["_id"] for t in topic_agg]
    
    return {
        "total_memories": total,
        "most_common_mood": most_common_mood,
        "top_emotions": top_emotions if top_emotions else None,
        "top_topics": top_topics if top_topics else None,
    }
