DMJ backend (FastAPI)
======================
```
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
setx MONGO_URI "mongouri"
uvicorn backend.main:app --reload --port 8000
```
- Replace the `auth` router with proper Firebase/JWT verification

**NLP Processing**
emotion scoring
----------------------------------
uses Hugging Face Inference API for emotion scoring.
Set environment vars:
- `HF_API_TOKEN` = Hugging Face token

keyword extraction
--------------------------------
uses KeyBERT with a multilingual sentence-transformer.
- `KEYBERT_MODEL` =sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
supports  mar/eng/hindi


topic categorization
------------------------------------
- `TOPIC_LABELS` (comma-separated candidate labels required)
supports  mar/eng/hindi


entity recognition (NER)
----------------------------
multilingual Hugging Face NER with spaCy fallback.
- `NER_MODEL` = xx_ent_wiki_sm
supports  mar/eng/hindi


embedding generation
----------------------------
- `EMBEDDING_MODEL` =entence-transformers/paraphrase-multilingual-MiniLM-L12-v2
supports  mar/eng/hindi