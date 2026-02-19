import os
from typing import Tuple

import pymongo
from pymongo import MongoClient

# Use environment variable MONGO_URI if present, otherwise fallback to the local/embedded string.
MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://dbadmin:dbadmin@cluster0.gfkc1ci.mongodb.net/?appName=Cluster0"

_client = None


def get_client() -> MongoClient:
    """Return a singleton MongoClient instance."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client


def get_db(db_name: str = "dmj"):
    """Return a database handle."""
    client = get_client()
    return client[db_name]


def get_collection(name: str, db_name: str = "dmj"):
    db = get_db(db_name)
    return db[name]


if __name__ == "__main__":
    # Quick manual test when running this file directly
    try:
        col = get_collection("customers")
        print("Connected to collection:", col.name)
        print("Documents count:", col.count_documents({}))
    except Exception as e:
        print("Connection test failed:", e)
