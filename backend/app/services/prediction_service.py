from typing import Any

import joblib
import pandas as pd

from app.core.config import ARTIFACTS_DIR


scaler = joblib.load(ARTIFACTS_DIR / "scaler.joblib")
encoder = joblib.load(ARTIFACTS_DIR / "encoder.joblib")
model = joblib.load(ARTIFACTS_DIR / "final_model.joblib")
metadata = joblib.load(ARTIFACTS_DIR / "pipeline_metadata.joblib")

NUMERICAL_FEATURES = metadata["numerical_features"]
CATEGORICAL_FEATURES = metadata["categorical_features"]
DROPPED_FEATURE = metadata["dropped_feature"]
MODEL_NAME = metadata["model_name"]
MODEL_FEATURE_ORDER = list(model.feature_names_in_)

CATEGORY_OPTIONS = {
    column: [str(value) for value in categories]
    for column, categories in zip(CATEGORICAL_FEATURES, encoder.categories_)
}

_importance_series = pd.Series(model.feature_importances_, index=MODEL_FEATURE_ORDER)
GLOBAL_FEATURE_IMPORTANCE = [
    {"feature": feature, "importance": round(float(importance), 6)}
    for feature, importance in _importance_series.sort_values(ascending=False).items()
]
TOP_GLOBAL_FACTORS = GLOBAL_FEATURE_IMPORTANCE[:5]


def predict_customer(payload: dict[str, Any]) -> dict[str, Any]:
    """Run the original, unchanged feature engineering and fitted pipeline."""
    if payload["previously_contacted"]:
        pdays_value = payload["pdays"]
        previous_value = payload["previous"]
        poutcome_value = payload["poutcome"]
    else:
        pdays_value = -1
        previous_value = 0
        poutcome_value = "unknown"

    raw = {
        "age": payload["age"],
        "job": payload["job"],
        "marital": payload["marital"],
        "education": payload["education"],
        "default": payload["default"],
        "balance": payload["balance"],
        "housing": payload["housing"],
        "loan": payload["loan"],
        "contact": payload["contact"],
        "day": payload["day"],
        "month": payload["month"],
        "campaign": payload["campaign"],
        "pdays": pdays_value,
        "previous": previous_value,
        "poutcome": poutcome_value,
    }
    frame = pd.DataFrame([raw])

    frame["previously_contacted"] = (frame["pdays"] != -1).astype(int)
    frame["pdays"] = frame["pdays"].replace(-1, 0)

    numerical = pd.DataFrame(
        scaler.transform(frame[NUMERICAL_FEATURES]),
        columns=NUMERICAL_FEATURES,
    )
    categorical = pd.DataFrame(
        encoder.transform(frame[CATEGORICAL_FEATURES]),
        columns=encoder.get_feature_names_out(CATEGORICAL_FEATURES),
    )

    features = pd.concat(
        [numerical, frame[["previously_contacted"]], categorical], axis=1
    )
    if DROPPED_FEATURE and DROPPED_FEATURE in features.columns:
        features = features.drop(columns=[DROPPED_FEATURE])
    features = features[MODEL_FEATURE_ORDER]

    probability = float(model.predict_proba(features)[0][1])
    prediction = "yes" if probability >= 0.5 else "no"
    distance_from_midpoint = abs(probability - 0.5)
    if distance_from_midpoint >= 0.30:
        confidence = "High"
    elif distance_from_midpoint >= 0.12:
        confidence = "Medium"
    else:
        confidence = "Low"

    if prediction == "yes":
        message = (
            "This customer profile is predicted to SUBSCRIBE to a term deposit "
            f"({probability:.0%} estimated likelihood)."
        )
    else:
        message = (
            "This customer profile is predicted to NOT subscribe to a term deposit "
            f"({probability:.0%} estimated likelihood of subscribing)."
        )

    return {
        "prediction": prediction,
        "probability": round(probability, 4),
        "confidence": confidence,
        "model_name": MODEL_NAME,
        "top_factors": TOP_GLOBAL_FACTORS,
        "message": message,
    }
