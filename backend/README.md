DMJ Backend (FastAPI)
=====================

This is the Python/FastAPI backend for Digital MemoryJar. It handles authentication, memory storage, NLP processing, and analytics.

---

## Quick Start (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
setx MONGO_URI "mongodb+srv://dbadmin:dbadmin@cluster0.gfkc1ci.mongodb.net/?appName=Cluster0"
uvicorn backend.main:app --reload --port 8000
# open http://127.0.0.1:8000/docs for interactive API docs
```

---

## File-by-File Explanation

### `main.py` — Application Entry Point

This is the root of the FastAPI application. It is responsible for:

- **Creating the FastAPI app** (`app = FastAPI(title="DMJ Backend")`).
- **CORS middleware** — Allows the Next.js frontend (running on `localhost:3000` or `localhost:3001`) to call the API during local development. In production this list must be tightened.
- **Registering routers** — Mounts `auth`, `memories`, and `dashboard` routers under their respective URL prefixes (`/auth`, `/memories`, `/dashboard`).
- **Health check endpoint** — `GET /healthz` returns `{"status": "ok"}` so load balancers / monitoring tools can verify the service is alive.
- **Background scheduler** — Uses `APScheduler` (`BackgroundScheduler`) to call `process_unprocessed_memories()` every 10 seconds. This keeps the NLP pipeline running without a separate worker process. The scheduler is started on app boot and shut down cleanly on app shutdown via FastAPI lifecycle events (`startup` / `shutdown`).

---

### `connection.py` — MongoDB Connection

Manages the connection to MongoDB Atlas (or any MongoDB instance).

- **`MONGO_URI`** — Read from the `MONGO_URI` environment variable; falls back to a hard-coded Atlas URI for convenience in development.
- **Singleton `_client`** — The `MongoClient` is instantiated once and reused across all requests (thread-safe for PyMongo).
- **`get_client()`** — Returns the singleton `MongoClient`.
- **`get_db(db_name)`** — Returns a handle to the named database (default: `"dmj"`).
- **`get_collection(name, db_name)`** — Returns a handle to a named collection inside the database. All CRUD operations call this helper so the connection logic is centralised.
- **`__main__` block** — A quick smoke-test you can run directly (`python connection.py`) to verify connectivity and print the document count for the `customers` collection.

---

### `crud.py` — Database CRUD Operations

All direct MongoDB read/write operations live here. The routers never touch the database directly; they always call a function from this module.

| Function | Description |
|---|---|
| `create_memory(data)` | Inserts a new memory document. Adds `created_at`, `updated_at` timestamps and sets `is_processed = False` (unless `embedding_id` and `nlp_insights` are already present). Returns the new MongoDB `ObjectId` as a string. |
| `list_memories(limit, processed_only)` | Returns up to `limit` memories sorted newest-first. Serialises `datetime` fields to ISO-8601 strings and adds a string `id` field alongside the native `_id`. |
| `get_memory_by_id(memory_id)` | Fetches a single memory by its string `ObjectId`. Returns `None` when the ID is invalid or not found. |
| `update_memory_with_nlp(memory_id, nlp_data)` | Merges `nlp_data` into an existing memory document and sets `is_processed = True`. Used by the NLP pipeline to write back extracted insights. Returns `True` if the document was actually modified. |
| `get_stats()` | Runs three MongoDB aggregation pipelines to compute: total memory count, the most common mood, average emotion scores across all memories, and the top-5 topics. Returns a dict consumed by the `/dashboard/stats` endpoint. |

---

### `schemas.py` — Pydantic Data Models

Defines the request/response shapes that FastAPI uses for automatic validation, serialisation, and OpenAPI documentation.

| Model | Purpose |
|---|---|
| `EmotionScores` | Holds float scores (0–1) for five emotions: `joy`, `gratitude`, `sadness`, `anger`, `neutral`. |
| `NLPInsights` | Wraps `EmotionScores` plus lists of `keywords`, `topics`, and `entities`. |
| `MemoryCreate` | The body accepted by `POST /memories/`. Only `content` (raw text) is required; all NLP fields are optional so they can be populated later by the background pipeline. |
| `MemoryDB` | Extends `MemoryCreate` with database-level fields: `id` (string ObjectId), `uid` (Firebase user ID), `created_at`, `updated_at`, and `is_processed`. Used as the response model for memory endpoints. |
| `StatsResponse` | The shape returned by `GET /dashboard/stats`: total count, optional mood/emotion/topic aggregates. |

---

### `auth_deps.py` — Firebase Authentication Dependency

Provides a single reusable FastAPI dependency (`verify_firebase_token`) that protects any route requiring a logged-in user.

- **Firebase Admin SDK initialisation** — Calls `firebase_admin.initialize_app()` on module load, guarding against double-initialisation with a `try/except ValueError`. It uses `GOOGLE_APPLICATION_CREDENTIALS` from the environment for service-account credentials.
- **`HTTPBearer` security scheme** — Extracts the JWT from the `Authorization: Bearer <token>` request header automatically.
- **`verify_firebase_token(credentials)`** — Async dependency function. Calls Firebase's `auth.verify_id_token()` to validate and decode the token. On success returns the decoded token dict (contains `uid`, `email`, etc.). On failure raises `HTTP 401 Unauthorized`.

Any route that adds `user: dict = Depends(verify_firebase_token)` to its signature is automatically protected.

---

### `nlp_processor.py` — NLP Processing Pipeline

Implements (or stubs) the full AI pipeline that converts raw memory text into enriched insights. It is called every 10 seconds by the scheduler in `main.py`.

**Helper functions (template/placeholder implementations):**

| Function | Description |
|---|---|
| `clean_text(text)` | *Deprecated.* Delegates to `TextPreprocessor.preprocess()` and returns the `cleaned` string. Kept for backward compatibility. |
| `extract_emotion_scores(text)` | Returns placeholder emotion scores. Replace with a real model (e.g. HuggingFace `distilbert`, TextBlob, VADER). |
| `extract_keywords(text)` | Returns placeholder keywords. Replace with RAKE, YAKE, spaCy noun chunks, or TF-IDF. |
| `categorize_topics(text, keywords)` | Simple rule-based topic bucketing (Work, Health, Emotions). Replace with a zero-shot classifier or custom model. |
| `extract_entities(text)` | Returns an empty list placeholder. Replace with spaCy NER or a HuggingFace NER model. |
| `generate_embedding(text)` | Returns a dummy 384-dimension vector. Replace with `sentence-transformers` (`all-MiniLM-L6-v2`) or OpenAI embeddings. |
| `store_embedding_in_faiss(vector, memory_id, faiss_index)` | Returns a dummy FAISS index ID. Replace with actual FAISS `index.add()` logic. |

**Main orchestration function:**

`process_unprocessed_memories(batch_size)` — Runs the two-phase pipeline:
1. **Phase 1 – Text preprocessing:** Calls `preprocess_unprocessed_memories()` from `text_preprocessor.py` to clean and tokenise memories that have not been preprocessed yet.
2. **Phase 2 – NLP analysis:** Finds memories that were preprocessed (have a `preprocessing` field) but not yet fully analysed (no `nlp_insights`). For each, runs emotion scoring, topic categorisation, entity extraction, and embedding generation, then writes the results back to MongoDB via `update_memory_with_nlp()`.

Returns a summary dict with counts of processed/failed memories for both phases.

---

### `text_preprocessor.py` — Text Preprocessing Module

Implements the first stage of the NLP pipeline: cleaning and structuring raw text using **spaCy** (`en_core_web_sm`). The module gracefully handles the case where spaCy is not installed by logging warnings and deferring errors to runtime.

**`load_nlp_pipeline()`** — Loads the spaCy model once and caches it in a module-level variable (`_nlp_model`). If the model is not downloaded yet, it runs `python -m spacy download en_core_web_sm` automatically.

**`TextPreprocessor` class** — Bundles all preprocessing steps:

| Method | What it does |
|---|---|
| `normalize_text(text)` | Removes URLs, email addresses, `@mentions`, `#hashtags`, and special characters; converts to lowercase; collapses extra whitespace. |
| `tokenize_and_analyze(text)` | Runs spaCy on the normalised text and returns a flat list of token strings plus a list of `(token, POS_tag)` tuples. |
| `lemmatize_and_clean(text, ...)` | Reduces words to their base form (lemmas), removes stopwords and punctuation. Returns the cleaned text string and a metadata dict (token counts, compression ratio, POS distribution). |
| `extract_keywords(text, top_n)` | Combines spaCy noun chunks and high-value POS tokens (NOUN, VERB, ADJ, ADV), deduplicates, ranks by frequency, and returns the top N. |
| `preprocess(text)` | **Master method.** Runs all four steps above in sequence and returns a single dict with `original`, `normalized`, `tokens`, `pos_tags`, `cleaned`, `keywords`, and `metadata`. |

**`store_preprocessing_results(memory_id, results)`** — Writes the preprocessing dict to the `preprocessing` subdocument of a memory in MongoDB.

**`preprocess_unprocessed_memories(batch_size)`** — Fetches up to `batch_size` memories that have no `preprocessing` field yet, runs `TextPreprocessor.preprocess()` on each, stores the results, and returns a summary dict.

---

### `requirements.txt` — Python Dependencies

Lists all third-party packages needed to run the backend:

| Package | Role |
|---|---|
| `fastapi` | Web framework — defines routes, request/response models, dependency injection. |
| `uvicorn[standard]` | ASGI server — runs the FastAPI app. |
| `pymongo` | MongoDB driver — used by `connection.py` and `crud.py`. |
| `python-dotenv` | Loads `.env` files into environment variables at startup. |
| `firebase-admin` | Verifies Firebase ID tokens in `auth_deps.py`. |
| `spacy` | NLP library used by `text_preprocessor.py` for tokenisation, POS tagging, lemmatisation, and keyword extraction. |
| `nltk` | Natural Language Toolkit — available for additional NLP utilities (not yet wired in). |
| `apscheduler` | Runs the background memory-processing job every 10 seconds. |
| `transformers` | HuggingFace Transformers — available for advanced NLP models (not yet wired in). |
| `torch` | PyTorch — required by `transformers`. |

---

## `routers/` — API Route Handlers

Each file under `routers/` defines a FastAPI `APIRouter` that is mounted in `main.py`. All authenticated routes use `Depends(verify_firebase_token)` to require a valid Firebase JWT.

### `routers/auth.py`

Prefix: `/auth`

| Endpoint | Description |
|---|---|
| `GET /auth/me` | Returns the current user's `uid`, `email`, and `email_verified` fields extracted from the verified Firebase token. Useful for the frontend to confirm who is logged in. |

### `routers/memories.py`

Prefix: `/memories`

| Endpoint | Description |
|---|---|
| `GET /memories/` | Returns all memories for the authenticated user (unfiltered, newest-first). Response is a list of `MemoryDB` objects. |
| `POST /memories/` | Creates a new memory. Accepts a `MemoryCreate` body. Attaches the authenticated user's `uid` to the document before storing. Returns the new memory's `id`. |
| `GET /memories/{memory_id}` | Fetches a single memory by its MongoDB `ObjectId` string. Returns `404` if not found. |
| `POST /memories/dev` | **Development-only** unauthenticated endpoint for testing the full pipeline locally without a Firebase token. Tags the memory with `uid = "dev-user"`. |

### `routers/dashboard.py`

Prefix: `/dashboard`

| Endpoint | Description |
|---|---|
| `GET /dashboard/stats` | Returns aggregated statistics across all memories: total count, most common mood, average emotion scores, and top-5 topics. Response is a `StatsResponse` object. |

### `routers/emotion_analyzer.py`

Currently an empty file. Reserved as a placeholder for a future dedicated emotion-analysis router (e.g., `POST /emotion/analyze` to run on-demand NLP on a given text snippet).

---

## `MONGODB_SCHEMA.md` — Database Schema Reference

A Markdown document (not executable code) that describes the full structure of a memory document as stored in MongoDB. It explains:

- **Phase 1 (raw)** fields written when the user first saves a memory: `content`, `uid`, `recorded_by`, `tags`, `mood`, `ai_summary`, `created_at`, `updated_at`, `is_processed = false`.
- **Phase 2 (processed)** fields written by the NLP pipeline: `content_clean`, `embedding_id`, `nlp_insights` (emotion scores, keywords, topics, entities).
- **Recommended MongoDB indexes** for efficient querying by user, processing status, topics, emotions, and tags.
- **Application flow** walkthrough: how a memory moves from user input → background NLP processing → frontend queries.
- **FAISS integration** notes: how the vector index relates to MongoDB documents via `embedding_id`.

---

## Architecture Overview

```
Frontend (Next.js)
      │
      │  HTTP + Firebase JWT
      ▼
main.py  (FastAPI app, CORS, scheduler)
  ├── /auth      → routers/auth.py       → auth_deps.py (Firebase verify)
  ├── /memories  → routers/memories.py   → crud.py → connection.py → MongoDB
  └── /dashboard → routers/dashboard.py  → crud.py → connection.py → MongoDB

Background (every 10 s):
  main.py scheduler
      └── nlp_processor.process_unprocessed_memories()
              ├── text_preprocessor.preprocess_unprocessed_memories()
              │       └── TextPreprocessor (spaCy pipeline)
              └── extract_emotion_scores / categorize_topics / generate_embedding
                      └── crud.update_memory_with_nlp() → MongoDB
```
