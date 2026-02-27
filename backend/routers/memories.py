from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from backend import crud, schemas
from backend.auth_deps import verify_firebase_token

##for hf emotion model testing
from backend.nlp_processor import extract_emotion_scores



import logging
router = APIRouter()
class DevEmotionRequest(BaseModel):
	text: str
@router.get("/", response_model=List[schemas.MemoryDB])
async def list_memories(user: dict = Depends(verify_firebase_token)):
	docs = crud.list_memories()
	return docs

@router.post("/", status_code=201)
async def create_memory(request: Request, payload: schemas.MemoryCreate, user: dict = Depends(verify_firebase_token)):
	logger = logging.getLogger(__name__)
	auth_header = request.headers.get("authorization")
	data = payload.dict(exclude_none=True)
	data["uid"] = user.get("uid")  # Associate memory with user informtn
	inserted_id = crud.create_memory(data)
	return {"id": inserted_id, "status": "created", "message": "Memory stored. Will be processed by AI."}


@router.get("/{memory_id}", response_model=schemas.MemoryDB)
async def get_memory(memory_id: str, user: dict = Depends(verify_firebase_token)):
	"""get a specific memory by uid"""
	memory = crud.get_memory_by_id(memory_id)
	if not memory:
		from fastapi import HTTPException
		raise HTTPException(status_code=404, detail="Memory not found")
	return memory









# ============================================================  dev endpoints
@router.post("/dev", status_code=201)
async def create_memory_dev(payload: schemas.MemoryCreate):
    logger = logging.getLogger(__name__)
    logger.warning("Creating memory via /memories/dev (no auth) - development only")
    data = payload.dict(exclude_none=True)
    data["uid"] = "dev-user"
    # inserted_id = crud.create_memory(data)
    return {"id": inserted_id, "status": "created", "message": "Memory stored (dev). Will be processed by AI."}


@router.post("/dev/analyze-emotion")
async def analyze_emotion_dev(payload: DevEmotionRequest):
	text = payload.text.strip()
	if not text:
		raise HTTPException(status_code=400)

	emotion_scores = extract_emotion_scores(text)
	mood = max(emotion_scores, key=emotion_scores.get) if emotion_scores else "neutral"

	return {
		"text": text,
		"mood": mood,
		"emotion_scores": emotion_scores,
	}
