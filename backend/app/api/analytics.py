from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import PredictionHistory, User


router = APIRouter(prefix="/api/analytics", tags=["prediction analytics"])


@router.get("/predictions")
def prediction_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = db.scalars(
        select(PredictionHistory)
        .where(PredictionHistory.user_id == current_user.id)
        .order_by(PredictionHistory.created_at.asc())
    ).all()
    total = len(records)
    likely = sum(1 for item in records if item.prediction == "yes")
    average = sum(item.probability for item in records) / total if total else 0.0

    by_date = defaultdict(list)
    by_job = defaultdict(list)
    by_age = defaultdict(list)
    by_confidence = defaultdict(int)

    def age_group(age: int) -> str:
        if age <= 25: return "18-25"
        if age <= 35: return "26-35"
        if age <= 45: return "36-45"
        if age <= 55: return "46-55"
        if age <= 65: return "56-65"
        return "66+"

    for item in records:
        by_date[item.created_at.date().isoformat()].append(item)
        by_job[item.job].append(item)
        by_age[age_group(item.age)].append(item)
        by_confidence[item.confidence] += 1

    def group_records(groups) -> list[dict]:
        result = []
        for name, items in groups.items():
            count = len(items)
            group_likely = sum(1 for item in items if item.prediction == "yes")
            result.append({
                "name": name,
                "total": count,
                "likely": group_likely,
                "likely_rate": round(group_likely / count * 100, 2),
                "average_probability": round(sum(item.probability for item in items) / count * 100, 2),
            })
        return result

    trend = [
        {
            "date": date_key,
            "predictions": len(items),
            "likely": sum(1 for item in items if item.prediction == "yes"),
            "average_probability": round(sum(item.probability for item in items) / len(items) * 100, 2),
        }
        for date_key, items in sorted(by_date.items())
    ]
    age_order = {name: index for index, name in enumerate(
        ["18-25", "26-35", "36-45", "46-55", "56-65", "66+"]
    )}
    age_records = group_records(by_age)
    age_records.sort(key=lambda item: age_order[item["name"]])

    return {
        "summary": {
            "total_predictions": total,
            "likely": likely,
            "unlikely": total - likely,
            "average_probability": round(average, 4),
        },
        "trend": trend,
        "outcomes": [
            {"name": "Likely", "value": likely},
            {"name": "Unlikely", "value": total - likely},
        ],
        "by_job": sorted(group_records(by_job), key=lambda item: item["name"]),
        "by_age": age_records,
        "confidence": [
            {"name": level, "value": by_confidence.get(level, 0)}
            for level in ["High", "Medium", "Low"]
        ],
    }
