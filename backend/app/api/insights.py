from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.models import User
from app.services.analytics_service import get_dataset_analytics


router = APIRouter(prefix="/api/insights", tags=["dataset insights"])


@router.get("/dataset")
def dataset_insights(
    job: str | None = None,
    month: str | None = None,
    contact: str | None = None,
    education: str | None = None,
    age_min: int | None = Query(default=None, ge=18, le=100),
    age_max: int | None = Query(default=None, ge=18, le=100),
    _current_user: User = Depends(get_current_user),
):
    return get_dataset_analytics(job, month, contact, education, age_min, age_max)
