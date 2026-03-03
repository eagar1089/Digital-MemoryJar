from fastapi import APIRouter, Depends

from backend import crud, schemas
from backend.auth_deps import verify_firebase_token_optional

router = APIRouter()


@router.get("/stats", response_model=schemas.StatsResponse)
async def stats(user: dict | None = Depends(verify_firebase_token_optional)):
	return crud.get_stats()
