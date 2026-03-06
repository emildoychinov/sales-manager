from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.etl.etl_constants import Status


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    datasets: Mapped[list[Dataset]] = relationship("Dataset", back_populates="owner")


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    filename: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[Status] = mapped_column(Enum(Status, name="dataset_status"), default=Status.PENDING, nullable=False)
    total_rows: Mapped[int] = mapped_column(default=0)
    rows_dropped: Mapped[int] = mapped_column(default=0)
    total_sales: Mapped[float] = mapped_column(default=0.0)
    date_min: Mapped[Optional[date]] = mapped_column(nullable=True)
    date_max: Mapped[Optional[date]] = mapped_column(nullable=True)
    progress: Mapped[float] = mapped_column(default=0.0)
    error_message: Mapped[Optional[str]] = mapped_column(nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    owner: Mapped[User] = relationship("User", back_populates="datasets")
    records: Mapped[list[SalesRecord]] = relationship(
        "SalesRecord", back_populates="dataset", cascade="all, delete-orphan"
    )


class SalesRecord(Base):
    __tablename__ = "sales_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True
    )

    order_number: Mapped[Optional[int]] = mapped_column(nullable=True)
    quantity_ordered: Mapped[Optional[int]] = mapped_column(nullable=True)
    price_each: Mapped[Optional[float]] = mapped_column(nullable=True)
    sales: Mapped[Optional[float]] = mapped_column(nullable=True)
    total_sales: Mapped[Optional[float]] = mapped_column(nullable=True)
    order_date: Mapped[Optional[date]] = mapped_column(nullable=True)
    status: Mapped[Optional[str]] = mapped_column(nullable=True)
    product_line: Mapped[Optional[str]] = mapped_column(nullable=True, index=True)
    product_code: Mapped[Optional[str]] = mapped_column(nullable=True)
    customer_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    city: Mapped[Optional[str]] = mapped_column(nullable=True)
    country: Mapped[Optional[str]] = mapped_column(nullable=True, index=True)
    deal_size: Mapped[Optional[str]] = mapped_column(nullable=True)

    dataset: Mapped[Dataset] = relationship("Dataset", back_populates="records")
