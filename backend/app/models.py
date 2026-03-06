from datetime import date, datetime
from app.etl.etl_constants import Status
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    datasets = relationship("Dataset", back_populates="owner")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    status = Column(Enum(Status, name="dataset_status"), default=Status.PENDING, nullable=False)
    total_rows = Column(Integer, default=0)
    rows_dropped = Column(Integer, default=0)
    total_sales = Column(Float, default=0.0)
    date_min = Column(Date, nullable=True)
    date_max = Column(Date, nullable=True)
    progress = Column(Float, default=0.0)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="datasets")
    records = relationship("SalesRecord", back_populates="dataset", cascade="all, delete-orphan")

class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)

    order_number = Column(Integer, nullable=True)
    quantity_ordered = Column(Integer, nullable=True)
    price_each = Column(Float, nullable=True)
    sales = Column(Float, nullable=True)
    total_sales = Column(Float, nullable=True)
    order_date = Column(Date, nullable=True)
    status = Column(String, nullable=True)
    product_line = Column(String, nullable=True, index=True)
    product_code = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True, index=True)
    deal_size = Column(String, nullable=True)

    dataset = relationship("Dataset", back_populates="records")
