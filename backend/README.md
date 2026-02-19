DMJ backend (FastAPI)
======================

Quick start (Windows PowerShell):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
setx MONGO_URI "mongodb+srv://dbadmin:dbadmin@cluster0.gfkc1ci.mongodb.net/?appName=Cluster0"
uvicorn backend.main:app --reload --port 8000
# open http://127.0.0.1:8000/docs for interactive API docs
```

Notes:
- `backend/connection.py` exposes `get_collection(name)` to access MongoDB collections.
- Replace the `auth` router with proper Firebase/JWT verification.
- This is a minimal scaffold to get you started; expand `crud.py` and `schemas.py` as needed.
