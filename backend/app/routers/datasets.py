from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from fastapi.responses import Response
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_etl_service
from app.etl.etl_service import ETLService
from app.models import User
from app.schemas import (
    DatasetSummary,
    SalesRecordResponse,
    UploadResponse,
)

#TODO : add sockets for real-time UI updates

router = APIRouter()


@router.get("/", response_model=Page[DatasetSummary])
def list_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    query = etl.get_datasets_query(db, current_user.id)
    return paginate(db, query)


@router.get("/{dataset_id}", response_model=DatasetSummary)
#TODO : return upload progress
#TODO : return delete progress
def get_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = etl.get_dataset_by_id(db, dataset_id, current_user.id)

    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    return dataset


@router.get("/{dataset_id}/records", response_model=Page[SalesRecordResponse])
def get_dataset_records(
    dataset_id: int,
    sort_by: str = "id",
    sort_order: str = "asc",
    status: str | None = None,
    product_line: str | None = None,
    country: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = etl.get_dataset_by_id(db, dataset_id, current_user.id)

    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    query = etl.get_records_query(
        db=db,
        dataset_id=dataset_id,
        sort_by=sort_by,
        sort_order=sort_order,
        status=status,
        product_line=product_line,
        country=country,
        date_from=date_from,
        date_to=date_to,
    )

    return paginate(db, query)


@router.get("/{dataset_id}/statuses", response_model=list[str])
def get_dataset_statuses(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = etl.get_dataset_by_id(db, dataset_id, current_user.id)

    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    return etl.get_distinct_statuses(db, dataset_id)


@router.get("/{dataset_id}/product-lines", response_model=list[str])
def get_dataset_product_lines(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = etl.get_dataset_by_id(db, dataset_id, current_user.id)

    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    return etl.get_distinct_product_lines(db, dataset_id)


@router.get("/{dataset_id}/countries", response_model=list[str])
def get_dataset_countries(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = etl.get_dataset_by_id(db, dataset_id, current_user.id)

    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    return etl.get_distinct_countries(db, dataset_id)


@router.get("/{dataset_id}/aggregates")
def get_dataset_aggregates(
    dataset_id: int,
    status: str | None = None,
    product_line: str | None = None,
    country: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = etl.get_dataset_by_id(db, dataset_id, current_user.id)

    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    return etl.get_aggregates(
        db=db,
        dataset_id=dataset_id,
        status=status,
        product_line=product_line,
        country=country,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/{dataset_id}/export")
def export_dataset(
    dataset_id: int,
    fmt: str = Query(default="csv", pattern="^(csv|parquet)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    data = etl.export_dataset(db, dataset_id, current_user.id, fmt)

    if data is None:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset_id}.{fmt}"},
    )


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = etl.delete_dataset(db, dataset_id, current_user.id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return {"message": "Dataset deletion started", "dataset_id": dataset_id}


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    etl: ETLService = Depends(get_etl_service),
):
    dataset = await etl.upload_dataset(db, current_user.id, file)

    return UploadResponse(
        dataset_id=dataset.id,
        status=dataset.status.value,
        message="Processing upload",
    )
