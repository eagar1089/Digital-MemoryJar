from typing import Optional, List, Dict, Any
from datetime import datetime

from pydantic import BaseModel, Field


class EmotionScores(BaseModel):
    """Emotion analysis from NLP."""
    joy: Optional[float] = Field(None, description="Joy score 0-1")
    gratitude: Optional[float] = Field(None, description="Gratitude score 0-1")
    sadness: Optional[float] = Field(None, description="Sadness score 0-1")
    anger: Optional[float] = Field(None, description="Anger score 0-1")
    neutral: Optional[float] = Field(None, description="Neutral score 0-1")
    # Can add more emotions as needed


class NLPInsights(BaseModel):
    """NLP extraction and analysis results."""
    emotion_scores: Optional[EmotionScores] = Field(None, description="Emotion sentiment analysis")
    keywords: Optional[List[str]] = Field(default_factory=list, description="Extracted keywords/phrases")
    topics: Optional[List[str]] = Field(default_factory=list, description="Identified topics (e.g., Work, Health, Relationships)")
    entities: Optional[List[str]] = Field(default_factory=list, description="Named entities (people, places)")


class MemoryCreate(BaseModel):
    """Raw memory data captured from user input."""
    content: str = Field(..., description="Raw text content of the memory")
    content_clean: Optional[str] = Field(None, description="Cleaned/normalized version of content")
    mood: Optional[str] = Field(None, description="Detected mood (e.g., happy, sad, reflective)")
    ai_summary: Optional[str] = Field(None, description="AI-generated summary of the memory")
    tags: Optional[List[str]] = Field(default_factory=list, description="Associated tags")
    recorded_by: Optional[str] = Field(None, description="Input method: text, voice, etc.")
    nlp_insights: Optional[NLPInsights] = Field(None, description="NLP extraction results")
    embedding_id: Optional[int] = Field(None, description="Reference to FAISS index ID for vector search")


class MemoryDB(MemoryCreate):
    """Memory as stored in database with metadata."""
    id: str = Field(..., description="MongoDB ObjectId as string")
    uid: Optional[str] = Field(None, description="Firebase user ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    is_processed: bool = Field(False, description="Whether NLP extraction/embedding has been completed")


class StatsResponse(BaseModel):
    total_memories: int
    avg_mood_score: Optional[float] = None
    most_common_mood: Optional[str] = None
    top_emotions: Optional[Dict[str, float]] = None
    top_topics: Optional[List[str]] = None
