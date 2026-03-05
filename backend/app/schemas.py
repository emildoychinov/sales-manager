from datetime import date, datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class DatasetSummary(BaseModel):
    id: int
    filename: str
    status: str
    total_rows: int
    rows_dropped: int
    total_sales: float
    date_min: date | None
    date_max: date | None
    progress: float
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

class UploadResponse(BaseModel):
    dataset_id: int
    status: str
    message: str    

class SalesRecordResponse(BaseModel):
    id: int
    order_number: int | None
    quantity_ordered: int | None
    price_each: float | None
    sales: float | None
    total_sales: float | None
    order_date: date | None
    status: str | None
    product_line: str | None
    product_code: str | None
    customer_name: str | None
    city: str | None
    country: str | None
    deal_size: str | None

    model_config = {"from_attributes": True}

class PaginatedRecords(BaseModel):
    records: list[SalesRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class AggregateItem(BaseModel):
    label: str
    value: float

class DatasetDetail(BaseModel):
    dataset: DatasetSummary
    records: PaginatedRecords
    sales_by_product_line: list[AggregateItem]
    sales_by_country: list[AggregateItem]
    sales_over_time: list[AggregateItem]
