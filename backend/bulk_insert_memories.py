#!/usr/bin/env python3
"""
Fast bulk insert of test memories for the past 5 days into MongoDB Atlas.

Usage:
    python bulk_insert_memories.py --uid <firebase_user_id> [--count-per-day <n>]

Example:
    python bulk_insert_memories.py --uid user-123 --count-per-day 3
"""

import sys
import argparse
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from pymongo.errors import BulkWriteError
import os
import time

SAMPLE_MEMORIES = [
    "Today felt lighter than usual. I managed to get through my tasks without overthinking too much. Even small wins felt meaningful. Ending the day on a positive note.",

    "Woke up feeling a bit off and couldn’t really shake it. Nothing major happened but everything felt heavier. Tried to stay productive anyway. Hoping tomorrow feels better.",

    "Spent some quiet time alone today and it actually felt peaceful. No pressure, no rush, just going with the flow. It helped clear my mind. I should do this more often.",

    "There was this constant tension in my thoughts today. I kept worrying about things that haven’t even happened. It made focusing difficult. Need to slow things down.",

    "Something exciting is coming up and I can’t stop thinking about it. I feel energized and motivated. It’s been a while since I felt this kind of spark. Looking forward to what’s next.",

    "Today was pretty normal, nothing too special. I followed my routine and got things done. It felt stable and manageable. Not every day needs to be extraordinary.",

    "I found myself thinking deeply about my future today. Some things are starting to make more sense. It’s still unclear, but I feel like I’m moving in the right direction.",

    "There were small moments today that made me smile. Nothing big, just simple things. It reminded me that happiness can be quiet. I appreciated that.",

    "A strange heaviness stayed with me throughout the day. I couldn’t really explain it. It wasn’t overwhelming, just present. Maybe I need to reflect more on it.",

    "Had a really productive day and it felt satisfying. Finished tasks I had been delaying. Rewarded myself with some downtime. Felt like I earned it.",

    "Took things slow today and didn’t rush anything. It made a big difference in how I felt. My thoughts were clearer. I felt more in control.",

    "Deadlines are getting closer and I can feel the pressure building. I keep thinking I’m falling behind. It’s exhausting to stay in this state. Need to reset.",

    "Tried something new today without overthinking it. It turned out better than expected. That felt refreshing. Maybe I should take more chances.",

    "Just another routine day, nothing stood out much. Still, I stayed consistent with my work. That matters in the long run. Small steps count.",

    "Realized how much I’ve changed over time. Things that once bothered me don’t anymore. Growth feels slow but real. That’s comforting.",

    "Spent time doing something I genuinely enjoy. Lost track of time completely. It felt nice to be fully present. I should prioritize this more.",

    "Something small triggered deeper thoughts today. It stayed on my mind longer than expected. I think there’s more to unpack there. I’ll revisit it later.",

    "The day felt balanced and manageable. Nothing too stressful, nothing too exciting. Just steady progress. That’s enough sometimes.",

    "Connected with someone after a long time today. The conversation felt natural and easy. It lifted my mood instantly. People really matter.",

    "Spent time reflecting on what truly matters to me. Some priorities are starting to shift. It’s a bit confusing but necessary. I’m figuring things out slowly."
]
MOODS = ["happy", "sad", "calm", "anxious", "excited", "neutral", "reflective", "sadness", "joy"]


def bulk_insert_memories(
    uid,
    mongo_uri,
    db_name,
    collection_name,
    count_per_day=1,
    connect_timeout_ms=20000,
    retries=3,
):
    """Bulk insert memories for the past 5 days."""

    # Connect to MongoDB with retry for transient Atlas replica set elections.
    client = None
    for attempt in range(1, retries + 1):
        try:
            client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=connect_timeout_ms,
                connectTimeoutMS=connect_timeout_ms,
                socketTimeoutMS=connect_timeout_ms,
                retryWrites=True,
            )
            client.admin.command("ping")
            print(f"✓ Connected to MongoDB (attempt {attempt}/{retries})")
            break
        except Exception as e:
            if attempt == retries:
                print(f"✗ Failed to connect to MongoDB after {retries} attempts: {e}")
                return False
            wait_seconds = min(2 ** attempt, 8)
            print(f"⚠ Connection attempt {attempt}/{retries} failed: {e}")
            print(f"  Retrying in {wait_seconds}s...")
            time.sleep(wait_seconds)
    
    # Use explicit DB/collection so inserts match backend reads.
    db = client[db_name]
    collection = db[collection_name]
    
    # Generate memories for the past 5 days
    memories = []
    now = datetime.now(timezone.utc)
    
    for day_offset in range(5, 0, -1):  # 5 days ago to yesterday
        day_start = now - timedelta(days=day_offset)
        day_start = day_start.replace(hour=9, minute=0, second=0, microsecond=0)
        
        for i in range(count_per_day):
            timestamp = day_start + timedelta(hours=i * (12 // count_per_day))
            content = SAMPLE_MEMORIES[(day_offset * count_per_day + i) % len(SAMPLE_MEMORIES)]
            mood = MOODS[(day_offset + i) % len(MOODS)]
            
            memory = {
                "uid": uid,
                "content": content,
                "content_clean": content.lower(),
                "mood": mood,
                "ai_summary": content[:50] + "..." if len(content) > 50 else content,
                "tags": ["test", mood],
                "recorded_by": "script",
                "created_at": timestamp,
                "updated_at": timestamp,
                "is_processed": True,
                "nlp_insights": {
                    "emotion_scores": {
                        "joy": 0.2,
                        "sadness": 0.1,
                        "anger": 0.0,
                        "fear": 0.0,
                        "surprise": 0.0,
                        "disgust": 0.0,
                    },
                    "keywords": ["test", mood],
                    "topics": ["general"],
                    "entities": [],
                },
            }
            memories.append(memory)
    
    # Bulk insert
    try:
        if memories:
            result = collection.insert_many(memories, ordered=False)
            print(f"✓ Inserted {len(result.inserted_ids)} memories")
            print(f"  UIDs: {result.inserted_ids[:3]}..." if len(result.inserted_ids) > 3 else f"  UIDs: {result.inserted_ids}")
            return True
    except BulkWriteError as e:
        print(f"⚠ Partial insert: {e.details['nInserted']} inserted, {len(e.details.get('writeErrors', []))} errors")
        return True
    except Exception as e:
        print(f"✗ Bulk insert failed: {e}")
        return False
    finally:
        client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk insert test memories into MongoDB")
    parser.add_argument("--uid", required=True, help="Firebase user ID")
    parser.add_argument("--count-per-day", type=int, default=1, help="Number of memories per day (default: 1)")
    parser.add_argument("--db", default=os.getenv("MONGO_DB", "dmj"), help="MongoDB database name (default: dmj)")
    parser.add_argument("--collection", default="memories", help="MongoDB collection name (default: memories)")
    parser.add_argument("--mongo-uri", default=os.getenv("MONGO_URI", "mongodb+srv://dbadmin:dbadmin@cluster0.gfkc1ci.mongodb.net"), help="MongoDB URI")
    parser.add_argument("--connect-timeout-ms", type=int, default=20000, help="MongoDB connect timeout in ms (default: 20000)")
    parser.add_argument("--retries", type=int, default=3, help="MongoDB connection retries (default: 3)")
    
    args = parser.parse_args()
    
    success = bulk_insert_memories(
        args.uid,
        args.mongo_uri,
        args.db,
        args.collection,
        args.count_per_day,
        args.connect_timeout_ms,
        args.retries,
    )
    sys.exit(0 if success else 1)
