import csv
import io
import uuid
from datetime import date

from fastapi import UploadFile
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import func
from sqlalchemy.orm import Session, Query

from app.models import Dataset, SalesRecord
from app.etl.tasks import process_upload_task


class ETLService:
    def __init__(self, db: Session):
        self.db = db

    def get_datasets(self, user_id: int) -> list[Dataset]:
        return (
            self.db.query(Dataset)
            .filter(Dataset.user_id == user_id)
            .order_by(Dataset.created_at.desc())
            .all()
        )

    def get_records_query(
        self,
        dataset_id: int,
        sort_by: str = "id",
        sort_order: str = "asc",
        status: str | None = None,
        product_line: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> Query:
        query = self.db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset_id)

        if status:
            query = query.filter(SalesRecord.status == status)
        if product_line:
            query = query.filter(SalesRecord.product_line == product_line)
        if date_from:
            query = query.filter(SalesRecord.order_date >= date_from)
        if date_to:
            query = query.filter(SalesRecord.order_date <= date_to)

        sort_col = getattr(SalesRecord, sort_by, SalesRecord.id)
        if sort_order == "desc":
            sort_col = sort_col.desc()
        query = query.order_by(sort_col)

        return query

    def get_dataset_by_id(self, dataset_id: int, user_id: int) -> Dataset | None:
        return (
            self.db.query(Dataset)
            .filter(Dataset.id == dataset_id, Dataset.user_id == user_id)
            .first()
        )

    def get_aggregates(self, dataset_id: int) -> dict:
        sales_by_product_line = (
            self.db.query(SalesRecord.product_line, func.sum(SalesRecord.total_sales))
            .filter(SalesRecord.dataset_id == dataset_id)
            .group_by(SalesRecord.product_line)
            .all()
        )

        sales_by_country = (
            self.db.query(SalesRecord.country, func.sum(SalesRecord.total_sales))
            .filter(SalesRecord.dataset_id == dataset_id)
            .group_by(SalesRecord.country)
            .all()
        )

        sales_over_time = (
            self.db.query(
                func.to_char(SalesRecord.order_date, 'YYYY-MM').label("month"),
                func.sum(SalesRecord.total_sales),
            )
            .filter(SalesRecord.dataset_id == dataset_id)
            .group_by("month")
            .order_by("month")
            .all()
        )

        return {
            "sales_by_product_line": [
                {"label": r[0] or "Unknown", "value": round(float(r[1] or 0), 2)}
                for r in sales_by_product_line
            ],
            "sales_by_country": [
                {"label": r[0] or "Unknown", "value": round(float(r[1] or 0), 2)}
                for r in sales_by_country
            ],
            "sales_over_time": [
                {"label": r[0] or "Unknown", "value": round(float(r[1] or 0), 2)}
                for r in sales_over_time
            ],
        }

    def export_dataset(self, dataset_id: int, user_id: int, fmt: str = "csv") -> bytes | None:
        dataset = self.get_dataset_by_id(dataset_id, user_id)
        if not dataset:
            return None

        records = (
            self.db.query(SalesRecord)
            .filter(SalesRecord.dataset_id == dataset_id)
            .all()
        )

        if fmt == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([
                "order_number", "quantity_ordered", "price_each", "sales",
                "total_sales", "order_date", "status", "product_line",
                "product_code", "customer_name", "city", "country", "deal_size",
            ])
            for r in records:
                writer.writerow([
                    r.order_number, r.quantity_ordered, r.price_each, r.sales,
                    r.total_sales, r.order_date, r.status, r.product_line,
                    r.product_code, r.customer_name, r.city, r.country, r.deal_size,
                ])
            return output.getvalue().encode("utf-8")

        return None

    async def upload_dataset(self, user_id: int, file: UploadFile):
        file_bytes = await file.read()

        dataset = Dataset(
            user_id=user_id,
            filename=file.filename or f"{uuid.uuid4()}.csv",
            status="pending",
            progress=0.0,
        )
        self.db.add(dataset)
        self.db.commit()
        self.db.refresh(dataset)

        process_upload_task.delay(dataset.id, file_bytes.hex())

        return dataset
