from app.worker import celery_app
from app.database import SessionLocal
from app.models import Dataset
from app.etl import etl_pipeline


@celery_app.task(bind=True)
def process_upload_task(self, dataset_id: int, file_bytes_hex: str):
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return

        dataset.status = "processing"
        dataset.progress = 0.0
        db.commit()

        file_bytes = bytes.fromhex(file_bytes_hex)

        df = etl_pipeline.extract(file_bytes)
        rows_before = len(df)
        dataset.progress = 0.2
        db.commit()

        df = etl_pipeline.transform(df)
        dataset.progress = 0.5
        db.commit()

        etl_pipeline.load(df, dataset.id, db)
        dataset.progress = 0.8
        db.commit()

        stats = etl_pipeline.metrics(df, rows_before)
        dataset.total_rows = stats["total_rows"]
        dataset.rows_dropped = stats["rows_dropped"]
        dataset.total_sales = stats["total_sales"]
        dataset.date_min = stats["date_min"]
        dataset.date_max = stats["date_max"]
        dataset.progress = 1.0
        dataset.status = "completed"
        db.commit()

    except Exception as e:
        db.rollback()
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            dataset.status = "failed"
            dataset.error_message = str(e)
            db.commit()
    finally:
        db.close()
