from fastapi import APIRouter

from app.api.deps import require_store
from app.models.schemas import MetricsResponse
from app.services.metrics import compute_metrics

router = APIRouter()


@router.get("/metrics", response_model=MetricsResponse)
def metrics():
    return compute_metrics(require_store().joined)