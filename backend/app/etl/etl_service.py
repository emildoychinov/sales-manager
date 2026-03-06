import io
import uuid
from datetime import date
from typing import Callable

import pandas as pd
from fastapi import UploadFile
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy import func
from sqlalchemy.orm import Session, Query

from app.models import Dataset, SalesRecord
from app.etl.tasks import process_upload_task
from app.etl.etl_constants import COLUMN_MAP


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


        #filtering could probably be moved out in a param -> schema mapping so that we don't use so much ifs
        #this would also allow for more flexible filtering in the future

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
                {"label": r[0] or "", "value": round(float(r[1] or 0), 2)}
                for r in sales_by_product_line
            ],
            "sales_by_country": [
                {"label": r[0] or "", "value": round(float(r[1] or 0), 2)}
                for r in sales_by_country
            ],
            "sales_over_time": [
                {"label": r[0] or "", "value": round(float(r[1] or 0), 2)}
                for r in sales_over_time
            ],
        }

    def export_dataset(self, dataset_id: int, user_id: int, fmt: str = "csv") -> bytes | None:
        dataset = self.get_dataset_by_id(dataset_id, user_id)
        if not dataset:
            return None

        query = self.db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset_id)
        export_columns = [field for field, _ in COLUMN_MAP.values()]
        df = pd.read_sql(query.statement, self.db.bind)[export_columns]

        def to_csv_bytes(d: pd.DataFrame) -> bytes:
            return d.to_csv(index=False).encode("utf-8")

        def to_parquet_bytes(d: pd.DataFrame) -> bytes:
            buf = io.BytesIO()
            d.to_parquet(buf, index=False)
            return buf.getvalue()

        exporters: dict[str, Callable[[pd.DataFrame], bytes]] = {
            "csv": to_csv_bytes,
            "parquet": to_parquet_bytes,
        }
        formatter = exporters.get(fmt.lower(), to_csv_bytes)
        
        return formatter(pd.DataFrame(df))

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
