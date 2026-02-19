"""
MongoDB Memory Document Schema
==============================

This document outlines the structure of memory documents stored in MongoDB.
Memories are stored in two phases:

1. RAW PHASE: User inputs content, mood, tags → stored as-is
2. PROCESSED PHASE: NLP pipeline processes the memory, extracts insights, generates embeddings

COMPLETE DOCUMENT STRUCTURE:
===========================

{
  "_id": ObjectId,
  
  # ===== RAW USER INPUT =====
  "content": "Today was a mix of productivity and much-needed relaxation. Started the morning by procrastinating on that project, then got a sudden work email that jolted me into action. Managed to complete two key deliverables before lunch. The afternoon was lighter - took a 10-minute walk to clear my head, which really helped. Overall, feeling grateful for the balance.",
  
  # ===== USER METADATA =====
  "uid": "firebase-user-id",
  "recorded_by": "text",  # or "voice"
  "tags": ["productivity", "relaxation", "stress", "walk", "gratitude"],
  
  # ===== AI-DETECTED FIELDS (1st pass) =====
  "mood": "grateful",  # Top emotion from emotion_scores
  "ai_summary": "Today balanced productivity with self-care. Started with procrastination but recovered after a work email. Completed key tasks and took a restorative walk.",
  
  # ===== TIMESTAMPS =====
  "created_at": ISODate("2026-02-09T14:30:00Z"),
  "updated_at": ISODate("2026-02-09T14:35:00Z"),
  
  # ===== PROCESSING STATUS =====
  "is_processed": true,  # false = raw, true = has NLP insights + embedding
  
  # ===== PHASE 2: NLP EXTRACTION & PROCESSING =====
  # (populated by AI extraction pipeline)
  
  "content_clean": "today mix productivity relaxation procrastinating project sudden work email completed deliverables afternoon lighter walk clear head grateful balance",
  
  "embedding_id": 4271,  # Reference to FAISS vector index position
  
  "nlp_insights": {
    "emotion_scores": {
      "joy": 0.65,
      "gratitude": 0.55,
      "sadness": 0.1,
      "anger": 0.05,
      "neutral": 0.25
    },
    
    "keywords": [
      "procrastinating project",
      "sudden work email",
      "10-minute walk",
      "clear my head"
    ],
    
    "topics": [
      "Work & Productivity",
      "Stress Management",
      "Self-Care"
    ],
    
    "entities": [
      # Named entities extracted
      # e.g., person names, locations (if mentioned)
    ]
  }
}


FIELD DESCRIPTIONS:
===================

RAW INPUT (Phase 1 - From User):
---------
- content (string, required): Unmodified user input text
- uid (string): Firebase user ID (added by router)
- recorded_by (string): Input method - "text" or "voice"
- tags (array): User-selected or AI-suggested tags
- mood (string, optional): User-provided or AI-detected mood
- ai_summary (string, optional): Initial AI summary

TIMESTAMPS:
-----------
- created_at (ISO datetime): When the memory was created
- updated_at (ISO datetime): Last modification time
- is_processed (boolean): 
  * false = Raw memory, not yet processed by NLP pipeline
  * true = NLP extraction, embedding, and insights have been generated

PHASE 2 - NLP PROCESSING (Added by AI Pipeline):
-----------
- content_clean (string): Lowercased, tokenized, stopwords removed
  Example: "today mix productivity relaxation..."
  Used for: Text search, keyword extraction
  
- embedding_id (integer): Index position in FAISS vector database
  Used for: Fast semantic/similarity search
  
- nlp_insights (object): Detailed NLP analysis
  
  nlp_insights.emotion_scores (object):
  - Scores for: joy, gratitude, sadness, anger, neutral
  - Range: 0.0 - 1.0
  - Used for: Mood trends, emotional analysis, dashboard insights
  
  nlp_insights.keywords (array):
  - Important phrases extracted from content
  - Example: ["procrastinating project", "sudden work email"]
  - Used for: Quick insights, trending topics
  
  nlp_insights.topics (array):
  - Categorized life areas
  - Example: ["Work & Productivity", "Stress Management", "Self-Care"]
  - Used for: Organization, filtering, analytics
  
  nlp_insights.entities (array):
  - Named entity recognition (people, places, organizations)
  - Used for: Social graph, relationship tracking


INDEXING STRATEGY:
==================

Create these MongoDB indexes for performance:

db.memories.createIndex({ "uid": 1, "created_at": -1 })
db.memories.createIndex({ "uid": 1, "is_processed": 1 })
db.memories.createIndex({ "nlp_insights.topics": 1 })
db.memories.createIndex({ "nlp_insights.emotion_scores.gratitude": 1 })
db.memories.createIndex({ "mood": 1 })
db.memories.createIndex({ "tags": 1 })


USAGE IN APPLICATION:
=====================

1. User writes memory → POST /memories/
   Creates document with: content, uid, recorded_by, tags, mood (optional), ai_summary (optional)
   is_processed = false
   
2. Background job (AI pipeline) processes unprocessed memories:
   - Clean text → content_clean
   - Extract emotions → nlp_insights.emotion_scores
   - Extract keywords → nlp_insights.keywords
   - Categorize topics → nlp_insights.topics
   - Extract entities → nlp_insights.entities
   - Generate embedding → embedding_id (stored in FAISS separately)
   - Update document: is_processed = true, updated_at = now
   
3. Frontend queries:
   - GET /memories/ → Lists raw memories (quick)
   - GET /memories/{id} → Full memory with insights
   - GET /dashboard/stats → Aggregates top emotions, topics, moods
   - Search: Use FAISS vector index with embedding_id for semantic search


MIGRATION PATH:
===============

If migrating existing memories:
1. All existing documents have is_processed = false
2. Run batch NLP processing job on all memories
3. Backfill nlp_insights, content_clean, embedding_id
4. Set is_processed = true
5. Build FAISS index from all embeddings


FAISS INTEGRATION:
==================

Separate from MongoDB. Structure:
- FAISS index: Stores all memory embeddings as vectors
- Mapping: embedding_id → MongoDB ObjectId

When searching by similarity:
1. User query → Generate embedding
2. FAISS: Find top K nearest vectors → Get embedding_ids
3. MongoDB: Look up memories by embedding_id
4. Return ranked results
"""
