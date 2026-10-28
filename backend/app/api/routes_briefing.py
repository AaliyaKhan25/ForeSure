from fastapi import APIRouter

from app.api.deps import require_day
from app.models.schemas import BriefingResponse
from app.services.briefing import build_briefing

router = APIRouter()


@router.get("/briefing", response_model=BriefingResponse)
def briefing(date: str):
    return build_briefing(require_day(date), date)