from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.services.prediction_service import CATEGORY_OPTIONS


JobType = Literal[tuple(CATEGORY_OPTIONS["job"])]  # type: ignore[valid-type]
MaritalType = Literal[tuple(CATEGORY_OPTIONS["marital"])]  # type: ignore[valid-type]
EducationType = Literal[tuple(CATEGORY_OPTIONS["education"])]  # type: ignore[valid-type]
YesNoType = Literal["yes", "no"]
ContactType = Literal[tuple(CATEGORY_OPTIONS["contact"])]  # type: ignore[valid-type]
MonthType = Literal[tuple(CATEGORY_OPTIONS["month"])]  # type: ignore[valid-type]
PoutcomeType = Literal[tuple(CATEGORY_OPTIONS["poutcome"])]  # type: ignore[valid-type]


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CustomerInput(BaseModel):
    age: int = Field(ge=18, le=100)
    job: JobType
    marital: MaritalType
    education: EducationType
    default: YesNoType
    balance: int = Field(ge=-20000, le=200000)
    housing: YesNoType
    loan: YesNoType
    contact: ContactType
    day: int = Field(ge=1, le=31)
    month: MonthType
    campaign: int = Field(ge=1, le=100)
    previously_contacted: bool
    pdays: int | None = Field(default=None, ge=0, le=900)
    previous: int | None = Field(default=None, ge=0, le=300)
    poutcome: PoutcomeType | None = None

    @model_validator(mode="after")
    def require_previous_campaign_fields(self):
        if self.previously_contacted:
            missing = [
                name
                for name in ("pdays", "previous", "poutcome")
                if getattr(self, name) is None
            ]
            if missing:
                raise ValueError(
                    f"{', '.join(missing)} required when previously_contacted is true"
                )
        return self


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class PredictionResponse(BaseModel):
    prediction: Literal["yes", "no"]
    probability: float
    confidence: Literal["Low", "Medium", "High"]
    model_name: str
    top_factors: list[FeatureImportance]
    message: str
    history_id: int
    created_at: datetime


class SummaryResponse(BaseModel):
    total_predictions: int
    likely: int
    unlikely: int
    average_probability: float


class HistoryItem(BaseModel):
    id: int
    age: int
    job: str
    marital: str
    education: str
    default: str
    balance: int
    housing: str
    loan: str
    contact: str
    day: int
    month: str
    campaign: int
    previously_contacted: bool
    pdays: int | None
    previous: int | None
    poutcome: str | None
    prediction: str
    probability: float
    confidence: str
    model_name: str
    created_at: datetime


class HistoryPage(BaseModel):
    items: list[HistoryItem]
    page: int
    page_size: int
    total: int
    total_pages: int
    summary: SummaryResponse
