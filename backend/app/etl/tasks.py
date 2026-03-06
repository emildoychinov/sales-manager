from app.worker import celery_app
from app.database import SessionLocal
from app.models import Dataset, SalesRecord
from app.etl.etl_constants import Status
from app.etl import etl_pipeline
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from celery.exceptions import SoftTimeLimitExceeded

DELETE_BATCH_SIZE = 5000
@celery_app.task(
    bind=True,
    max_retries=3,
    acks_late=True,
    reject_on_worker_lost=True,
    soft_time_limit=60 * 10,
    time_limit=60 * 12,
)
def process_upload_task(self, dataset_id: int, file_bytes_hex: str):
    db = SessionLocal()
    dataset: Dataset | None = None

    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return

        dataset.status = Status.PROCESSING
        dataset.progress = 0.0
        db.commit()
        self.update_state(state="PROGRESS", meta={"progress": 0.0})

        file_bytes = bytes.fromhex(file_bytes_hex)

        df = etl_pipeline.extract(file_bytes)
        rows_before = len(df)
        dataset.progress = 0.2
        db.commit()
        self.update_state(state="PROGRESS", meta={"progress": 0.2})

        df = etl_pipeline.transform(df)
        dataset.progress = 0.5
        db.commit()
        self.update_state(state="PROGRESS", meta={"progress": 0.5})

        etl_pipeline.load(df, dataset.id, db)
        dataset.progress = 0.8
        db.commit()
        self.update_state(state="PROGRESS", meta={"progress": 0.8})

        stats = etl_pipeline.metrics(df, rows_before)
        dataset.total_rows = stats["total_rows"]
        dataset.rows_dropped = stats["rows_dropped"]
        dataset.total_sales = stats["total_sales"]
        dataset.date_min = stats["date_min"]
        dataset.date_max = stats["date_max"]
        dataset.progress = 1.0
        dataset.status = Status.COMPLETED
        db.commit()
        self.update_state(state="SUCCESS", meta={"progress": 1.0})

    except SoftTimeLimitExceeded as e:
        db.rollback()
        if dataset is None:
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            dataset.status = Status.FAILED
            dataset.error_message = "ERROR: Processing timed out"
            db.commit()
        raise e

    except (OperationalError, SQLAlchemyError) as e:
        db.rollback()
        if dataset is None:
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            dataset.status = Status.PENDING
            dataset.error_message = f"Retrying: {type(e).__name__}"
            db.commit()
        raise self.retry(exc=e, countdown=10)

    except Exception as e:
        db.rollback()
        if dataset is None:
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            dataset.status = Status.FAILED
            dataset.error_message = f"ERROR: {str(e)}"
            db.commit()

    finally:
        db.close()

@celery_app.task(
    bind=True,
    max_retries=3,
    acks_late=True,
    reject_on_worker_lost=True,
    soft_time_limit=60 * 5,
    time_limit=60 * 7,
)
def delete_dataset_task(self, dataset_id: int):
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return

        while True:
            batch_ids = (
                db.query(SalesRecord.id)
                .filter(SalesRecord.dataset_id == dataset_id)
                .limit(DELETE_BATCH_SIZE)
                .all()
            )
            if not batch_ids:
                break
            ids = [row[0] for row in batch_ids]
            db.query(SalesRecord).filter(SalesRecord.id.in_(ids)).delete(synchronize_session=False)
            db.commit()

        db.delete(dataset)
        db.commit()

    except (OperationalError, SQLAlchemyError) as e:
        db.rollback()
        raise self.retry(exc=e, countdown=10)

    except Exception as e:
        db.rollback()
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

        if dataset:
            dataset.status = Status.FAILED
            dataset.error_message = f"ERROR: Delete failed: {e}"
            db.commit()

    finally:
        db.close()
