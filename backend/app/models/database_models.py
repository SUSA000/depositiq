from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    predictions: Mapped[list["PredictionHistory"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    __table_args__ = (
        Index("ix_prediction_history_user_created", "user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    age: Mapped[int] = mapped_column(Integer, nullable=False)
    job: Mapped[str] = mapped_column(String(40), nullable=False)
    marital: Mapped[str] = mapped_column(String(20), nullable=False)
    education: Mapped[str] = mapped_column(String(30), nullable=False)

    credit_default: Mapped[str] = mapped_column("default", String(3), nullable=False)
    balance: Mapped[int] = mapped_column(Integer, nullable=False)
    housing: Mapped[str] = mapped_column(String(3), nullable=False)
    loan: Mapped[str] = mapped_column(String(3), nullable=False)

    contact: Mapped[str] = mapped_column(String(20), nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[str] = mapped_column(String(3), nullable=False)
    campaign: Mapped[int] = mapped_column(Integer, nullable=False)

    previously_contacted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    pdays: Mapped[int | None] = mapped_column(Integer)
    previous: Mapped[int | None] = mapped_column(Integer)
    poutcome: Mapped[str | None] = mapped_column(String(20))

    prediction: Mapped[str] = mapped_column(String(3), nullable=False)
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[str] = mapped_column(String(10), nullable=False)
    model_name: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped[User] = relationship(back_populates="predictions")
