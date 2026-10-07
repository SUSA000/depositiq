from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import PredictionHistory, User
from app.schemas import SummaryResponse


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=SummaryResponse)
def dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.execute(
        select(
            func.count(PredictionHistory.id),
            func.sum(case((PredictionHistory.prediction == "yes", 1), else_=0)),
            func.avg(PredictionHistory.probability),
        ).where(PredictionHistory.user_id == current_user.id)
    ).one()
    total = int(row[0] or 0)
    likely = int(row[1] or 0)
    return {
        "total_predictions": total,
        "likely": likely,
        "unlikely": total - likely,
        "average_probability": round(float(row[2] or 0), 4),
    }
