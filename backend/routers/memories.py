from typing import List

from fastapi import APIRouter, Depends, Request

from backend import crud, schemas
from backend.auth_deps import verify_firebase_token
import logging

router = APIRouter()


@router.get("/", response_model=List[schemas.MemoryDB])
async def list_memories(user: dict = Depends(verify_firebase_token)):
	"""List all memories for the authenticated user (raw data, not extracted yet)."""
	docs = crud.list_memories()
	return docs


@router.post("/", status_code=201)
async def create_memory(request: Request, payload: schemas.MemoryCreate, user: dict = Depends(verify_firebase_token)):
	"""Create a new memory with raw data.
	
	Parameters:
	- content: Raw text content (required)
	- mood: Detected mood (optional)
	- ai_summary: AI-generated summary (optional)
	- tags: List of associated tags (optional)
	- recorded_by: Input method - 'text' or 'voice' (optional)
	
	Returns the created memory ID and will be processed by AI later.
	"""
	logger = logging.getLogger(__name__)
	auth_header = request.headers.get("authorization")
	# logger.info("Incoming create_memory request, Authorization header present: %s", bool(auth_header))
	data = payload.dict(exclude_none=True)
	data["uid"] = user.get("uid")  # Associate memory with user
	inserted_id = crud.create_memory(data)
	return {"id": inserted_id, "status": "created", "message": "Memory stored. Will be processed by AI."}


@router.get("/{memory_id}", response_model=schemas.MemoryDB)
async def get_memory(memory_id: str, user: dict = Depends(verify_firebase_token)):
	"""Get a specific memory by ID."""
	memory = crud.get_memory_by_id(memory_id)
	if not memory:
		from fastapi import HTTPException
		raise HTTPException(status_code=404, detail="Memory not found")
	return memory


@router.post("/dev", status_code=201)
async def create_memory_dev(payload: schemas.MemoryCreate):
    """Development-only endpoint: create memory without authentication.
    Use this only in local/dev to verify frontend -> backend -> NLP pipeline end-to-end.
    """
    logger = logging.getLogger(__name__)
    logger.warning("Creating memory via /memories/dev (no auth) - development only")
    data = payload.dict(exclude_none=True)
    data["uid"] = "dev-user"
    inserted_id = crud.create_memory(data)
    return {"id": inserted_id, "status": "created", "message": "Memory stored (dev). Will be processed by AI."}
