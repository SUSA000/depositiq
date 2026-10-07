from functools import lru_cache

import numpy as np
import pandas as pd

from app.core.config import DATASET_PATH
from app.services.prediction_service import GLOBAL_FEATURE_IMPORTANCE


MONTH_ORDER = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
]


def _load_dataset() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise RuntimeError(f"Bank Marketing dataset not found at {DATASET_PATH}")
    frame = pd.read_csv(DATASET_PATH, sep=";")
    required = {
        "age", "job", "education", "balance", "contact", "month",
        "campaign", "poutcome", "y",
    }
    missing = required.difference(frame.columns)
    if missing:
        raise RuntimeError(f"Dataset is missing required columns: {sorted(missing)}")
    frame["subscribed"] = (frame["y"] == "yes").astype(int)
    return frame


DATASET = _load_dataset()


def _rate_records(frame: pd.DataFrame, column: str, order: list[str] | None = None) -> list[dict]:
    grouped = (
        frame.groupby(column, observed=True)["subscribed"]
        .agg(total="size", subscribed="sum", rate="mean")
        .reset_index()
    )
    grouped["rate"] = grouped["rate"] * 100
    records = [
        {
            "name": str(row[column]),
            "total": int(row["total"]),
            "subscribed": int(row["subscribed"]),
            "rate": round(float(row["rate"]), 2),
        }
        for _, row in grouped.iterrows()
    ]
    if order:
        positions = {value: index for index, value in enumerate(order)}
        records.sort(key=lambda item: positions.get(item["name"], len(positions)))
    return records


def dataset_filter_options() -> dict:
    return {
        "jobs": sorted(DATASET["job"].dropna().astype(str).unique().tolist()),
        "education": sorted(DATASET["education"].dropna().astype(str).unique().tolist()),
        "months": MONTH_ORDER,
        "contacts": sorted(DATASET["contact"].dropna().astype(str).unique().tolist()),
        "age": {
            "min": int(DATASET["age"].min()),
            "max": int(DATASET["age"].max()),
        },
    }


@lru_cache(maxsize=128)
def get_dataset_analytics(
    job: str | None = None,
    month: str | None = None,
    contact: str | None = None,
    education: str | None = None,
    age_min: int | None = None,
    age_max: int | None = None,
) -> dict:
    frame = DATASET
    if job:
        frame = frame[frame["job"] == job]
    if month:
        frame = frame[frame["month"] == month]
    if contact:
        frame = frame[frame["contact"] == contact]
    if education:
        frame = frame[frame["education"] == education]
    if age_min is not None:
        frame = frame[frame["age"] >= age_min]
    if age_max is not None:
        frame = frame[frame["age"] <= age_max]

    total = int(len(frame))
    subscribers = int(frame["subscribed"].sum()) if total else 0
    summary = {
        "total_customers": total,
        "subscribers": subscribers,
        "subscription_rate": round((subscribers / total * 100), 2) if total else 0.0,
        "average_balance": round(float(frame["balance"].mean()), 2) if total else 0.0,
    }

    distribution = [
        {
            "name": "Subscribed",
            "value": subscribers,
            "percentage": round((subscribers / total * 100), 2) if total else 0.0,
        },
        {
            "name": "Not Subscribed",
            "value": total - subscribers,
            "percentage": round(((total - subscribers) / total * 100), 2) if total else 0.0,
        },
    ]

    chart_frame = frame.copy()
    chart_frame["age_group"] = pd.cut(
        chart_frame["age"],
        bins=[18, 26, 36, 46, 56, 66, np.inf],
        labels=["18-25", "26-35", "36-45", "46-55", "56-65", "66+"],
        right=False,
    )
    chart_frame["balance_group"] = pd.cut(
        chart_frame["balance"],
        bins=[-np.inf, 0, 1000, 5000, 10000, np.inf],
        labels=["Negative", "0-1K", "1K-5K", "5K-10K", "10K+"],
        right=False,
    )
    chart_frame["campaign_group"] = pd.cut(
        chart_frame["campaign"],
        bins=[1, 2, 3, 4, 6, 11, np.inf],
        labels=["1", "2", "3", "4-5", "6-10", "11+"],
        right=False,
        include_lowest=True,
    )

    return {
        "summary": summary,
        "filters": dataset_filter_options(),
        "applied_filters": {
            "job": job,
            "month": month,
            "contact": contact,
            "education": education,
            "age_min": age_min,
            "age_max": age_max,
        },
        "subscription_distribution": distribution,
        "by_job": _rate_records(chart_frame, "job"),
        "by_age": _rate_records(
            chart_frame, "age_group", ["18-25", "26-35", "36-45", "46-55", "56-65", "66+"]
        ),
        "by_balance": _rate_records(
            chart_frame, "balance_group", ["Negative", "0-1K", "1K-5K", "5K-10K", "10K+"]
        ),
        "by_month": _rate_records(chart_frame, "month", MONTH_ORDER),
        "by_campaign": _rate_records(
            chart_frame, "campaign_group", ["1", "2", "3", "4-5", "6-10", "11+"]
        ),
        "by_previous_outcome": _rate_records(
            chart_frame, "poutcome", ["success", "failure", "other", "unknown"]
        ),
        "by_contact": _rate_records(
            chart_frame, "contact", ["cellular", "telephone", "unknown"]
        ),
        "feature_importance": GLOBAL_FEATURE_IMPORTANCE[:10],
    }
