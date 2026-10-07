from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import PredictionHistory, User
from app.schemas import CustomerInput, PredictionResponse
from app.services.prediction_service import CATEGORY_OPTIONS, MODEL_FEATURE_ORDER, MODEL_NAME, predict_customer


router = APIRouter(tags=["model"])


@router.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "n_features": len(MODEL_FEATURE_ORDER)}


@router.get("/api/options")
def options():
    return {
        "categories": CATEGORY_OPTIONS,
        "numeric_ranges": {
            "age": {"min": 18, "max": 100},
            "balance": {"min": -20000, "max": 200000},
            "day": {"min": 1, "max": 31},
            "campaign": {"min": 1, "max": 100},
            "pdays": {"min": 0, "max": 900},
            "previous": {"min": 0, "max": 300},
        },
    }


@router.post("/api/predict", response_model=PredictionResponse)
def predict(
    payload: CustomerInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    values = payload.model_dump()
    try:
        result = predict_customer(values)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not generate a prediction: {exc}")

    history = PredictionHistory(
        user_id=current_user.id,
        age=values["age"], job=values["job"], marital=values["marital"],
        education=values["education"], credit_default=values["default"],
        balance=values["balance"], housing=values["housing"], loan=values["loan"],
        contact=values["contact"], day=values["day"], month=values["month"],
        campaign=values["campaign"], previously_contacted=values["previously_contacted"],
        pdays=values["pdays"], previous=values["previous"], poutcome=values["poutcome"],
        prediction=result["prediction"], probability=result["probability"],
        confidence=result["confidence"], model_name=result["model_name"],
    )
    db.add(history)
    try:
        db.commit()
        db.refresh(history)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Prediction succeeded but could not be saved.")
    return {**result, "history_id": history.id, "created_at": history.created_at}
