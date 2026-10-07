import csv
import io
import math
from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import String, case, cast, func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import PredictionHistory, User
from app.schemas import HistoryItem, HistoryPage


router = APIRouter(prefix="/api/history", tags=["prediction history"])


def serialize_history(item: PredictionHistory) -> dict:
    return {
        "id": item.id,
        "age": item.age,
        "job": item.job,
        "marital": item.marital,
        "education": item.education,
        "default": item.credit_default,
        "balance": item.balance,
        "housing": item.housing,
        "loan": item.loan,
        "contact": item.contact,
        "day": item.day,
        "month": item.month,
        "campaign": item.campaign,
        "previously_contacted": item.previously_contacted,
        "pdays": item.pdays,
        "previous": item.previous,
        "poutcome": item.poutcome,
        "prediction": item.prediction,
        "probability": item.probability,
        "confidence": item.confidence,
        "model_name": item.model_name,
        "created_at": item.created_at,
    }


def build_conditions(
    user_id: int,
    from_date: date | None,
    to_date: date | None,
    prediction: str | None,
    confidence: str | None,
    occupation: str | None,
    search: str | None,
) -> list:
    conditions = [PredictionHistory.user_id == user_id]
    if from_date:
        conditions.append(
            PredictionHistory.created_at >= datetime.combine(from_date, time.min, tzinfo=timezone.utc)
        )
    if to_date:
        conditions.append(
            PredictionHistory.created_at <= datetime.combine(to_date, time.max, tzinfo=timezone.utc)
        )
    if prediction in {"yes", "no"}:
        conditions.append(PredictionHistory.prediction == prediction)
    if confidence in {"High", "Medium", "Low"}:
        conditions.append(PredictionHistory.confidence == confidence)
    if occupation:
        conditions.append(PredictionHistory.job == occupation)
    if search:
        term = f"%{search.strip()}%"
        conditions.append(
            or_(
                cast(PredictionHistory.id, String).ilike(term),
                PredictionHistory.job.ilike(term),
                PredictionHistory.marital.ilike(term),
                PredictionHistory.education.ilike(term),
                PredictionHistory.contact.ilike(term),
            )
        )
    return conditions


@router.get("", response_model=HistoryPage)
def list_history(
    from_date: date | None = None,
    to_date: date | None = None,
    prediction: str | None = None,
    confidence: str | None = None,
    occupation: str | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conditions = build_conditions(
        current_user.id, from_date, to_date, prediction, confidence, occupation, search
    )
    total = int(db.scalar(select(func.count(PredictionHistory.id)).where(*conditions)) or 0)
    aggregate = db.execute(
        select(
            func.sum(case((PredictionHistory.prediction == "yes", 1), else_=0)),
            func.avg(PredictionHistory.probability),
        ).where(*conditions)
    ).one()
    likely = int(aggregate[0] or 0)

    allowed_sort = {
        "id": PredictionHistory.id,
        "created_at": PredictionHistory.created_at,
        "age": PredictionHistory.age,
        "job": PredictionHistory.job,
        "balance": PredictionHistory.balance,
        "probability": PredictionHistory.probability,
    }
    sort_column = allowed_sort.get(sort_by, PredictionHistory.created_at)
    order_expression = sort_column.asc() if sort_order == "asc" else sort_column.desc()
    records = db.scalars(
        select(PredictionHistory)
        .where(*conditions)
        .order_by(order_expression)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return {
        "items": [serialize_history(item) for item in records],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": math.ceil(total / page_size) if total else 0,
        "summary": {
            "total_predictions": total,
            "likely": likely,
            "unlikely": total - likely,
            "average_probability": round(float(aggregate[1] or 0), 4),
        },
    }


@router.get("/export")
def export_history(
    from_date: date | None = None,
    to_date: date | None = None,
    prediction: str | None = None,
    confidence: str | None = None,
    occupation: str | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conditions = build_conditions(
        current_user.id, from_date, to_date, prediction, confidence, occupation, search
    )
    records = db.scalars(
        select(PredictionHistory)
        .where(*conditions)
        .order_by(PredictionHistory.created_at.desc())
    ).all()
    output = io.StringIO()
    fieldnames = [
        "id", "age", "job", "marital", "education", "default", "balance",
        "housing", "loan", "contact", "day", "month", "campaign",
        "previously_contacted", "pdays", "previous", "poutcome", "prediction",
        "probability", "confidence", "model_name", "created_at",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for record in records:
        writer.writerow(serialize_history(record))
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prediction-history.csv"},
    )


@router.get("/{history_id}", response_model=HistoryItem)
def history_detail(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.scalar(
        select(PredictionHistory).where(
            PredictionHistory.id == history_id,
            PredictionHistory.user_id == current_user.id,
        )
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    return serialize_history(record)
