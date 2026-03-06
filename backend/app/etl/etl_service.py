import io
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Callable

import pandas as pd
from fastapi import UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, Query

from app.models import Dataset, SalesRecord
from app.etl.tasks import process_upload_task, delete_dataset_task
from app.etl.etl_constants import COLUMN_MAP, Status


class ETLService:

    def get_datasets_query(self, db: Session, user_id: int) -> Query:
        return (
            db.query(Dataset)
            .filter(Dataset.user_id == user_id)
            .order_by(Dataset.created_at.desc())
        )

    def get_records_query(
        self,
        db: Session,
        dataset_id: int,
        sort_by: str = "id",
        sort_order: str = "asc",
        status: str | None = None,
        product_line: str | None = None,
        country: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> Query:
        query = db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset_id)

        # there is probably a better way to do this
        if status:
            query = query.filter(SalesRecord.status == status)
        if product_line:
            query = query.filter(SalesRecord.product_line == product_line)
        if country:
            query = query.filter(SalesRecord.country == country)
        if date_from:
            query = query.filter(SalesRecord.order_date >= date_from)
        if date_to:
            query = query.filter(SalesRecord.order_date <= date_to)

        sort_col = getattr(SalesRecord, sort_by, SalesRecord.id)
        if sort_order == "desc":
            sort_col = sort_col.desc()
        query = query.order_by(sort_col)

        return query

    def get_dataset_by_id(self, db: Session, dataset_id: int, user_id: int) -> Dataset | None:
        return (
            db.query(Dataset)
            .filter(Dataset.id == dataset_id, Dataset.user_id == user_id)
            .first()
        )

    def get_distinct_statuses(self, db: Session, dataset_id: int) -> list[str]:
        rows = (
            db.query(SalesRecord.status)
            .filter(SalesRecord.dataset_id == dataset_id, SalesRecord.status.isnot(None))
            .distinct()
            .order_by(SalesRecord.status)
            .all()
        )
        return [r[0] for r in rows]

    def get_distinct_product_lines(self, db: Session, dataset_id: int) -> list[str]:
        rows = (
            db.query(SalesRecord.product_line)
            .filter(SalesRecord.dataset_id == dataset_id, SalesRecord.product_line.isnot(None))
            .distinct()
            .order_by(SalesRecord.product_line)
            .all()
        )
        return [r[0] for r in rows]

    def get_distinct_countries(self, db: Session, dataset_id: int) -> list[str]:
        rows = (
            db.query(SalesRecord.country)
            .filter(SalesRecord.dataset_id == dataset_id, SalesRecord.country.isnot(None))
            .distinct()
            .order_by(SalesRecord.country)
            .all()
        )
        return [r[0] for r in rows]

    def _apply_record_filters(self, query, dataset_id: int, status: str | None = None,
                               product_line: str | None = None, country: str | None = None,
                               date_from: date | None = None, date_to: date | None = None):

        # there is probably a better way to do this
        query = query.filter(SalesRecord.dataset_id == dataset_id)
        if status:
            query = query.filter(SalesRecord.status == status)
        if product_line:
            query = query.filter(SalesRecord.product_line == product_line)
        if country:
            query = query.filter(SalesRecord.country == country)
        if date_from:
            query = query.filter(SalesRecord.order_date >= date_from)
        if date_to:
            query = query.filter(SalesRecord.order_date <= date_to)
        return query

    def get_aggregates(
        self,
        db: Session,
        dataset_id: int,
        status: str | None = None,
        product_line: str | None = None,
        country: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> dict:
        base = db.query(SalesRecord)
        base = self._apply_record_filters(base, dataset_id, status, product_line, country, date_from, date_to)

        sales_by_product_line = (
            base.with_entities(SalesRecord.product_line, func.sum(SalesRecord.total_sales))
            .group_by(SalesRecord.product_line)
            .all()
        )

        sales_by_country = (
            base.with_entities(SalesRecord.country, func.sum(SalesRecord.total_sales))
            .group_by(SalesRecord.country)
            .all()
        )

        dialect = db.bind.dialect.name if db.bind else "postgresql"
        if dialect == "sqlite":
            month_expr = func.strftime('%Y-%m', SalesRecord.order_date).label("month")
        else:
            month_expr = func.to_char(SalesRecord.order_date, 'YYYY-MM').label("month")

        sales_over_time = (
            base.with_entities(month_expr, func.sum(SalesRecord.total_sales))
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

    def export_dataset(self, db: Session, dataset_id: int, user_id: int, fmt: str = "csv") -> bytes | None:
        dataset = self.get_dataset_by_id(db, dataset_id, user_id)
        if not dataset:
            return None

        query = db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset_id)
        export_columns = [field for field, _ in COLUMN_MAP.values()]
        df = pd.read_sql(query.statement, db.bind)[export_columns]

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

    async def upload_dataset(self, db: Session, user_id: int, file: UploadFile):
        file_bytes = await file.read()

        dataset = Dataset(
            user_id=user_id,
            filename=file.filename or f"{uuid.uuid4()}.csv",
            status=Status.PENDING,
            progress=0.0,
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        process_upload_task.apply_async(
            args=[dataset.id, file_bytes.hex()],
            eta=datetime.now(timezone.utc) + timedelta(seconds=1),
            expires=3600,
            retry=True,
            retry_policy={"max_retries": 3},
        )

        return dataset

    def delete_dataset(self, db: Session, dataset_id: int, user_id: int) -> Dataset | None:
        dataset = self.get_dataset_by_id(db, dataset_id, user_id)
        if not dataset:
            return None

        dataset.status = Status.DELETING
        db.commit()

        delete_dataset_task.apply_async(
            args=[dataset.id],
            expires=3600,
            retry=True,
            retry_policy={"max_retries": 3},
        )

        return dataset
