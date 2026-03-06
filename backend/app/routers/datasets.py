from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordBearer
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate
from sqlalchemy.orm import Session

from app.auth.auth_service import AuthService
from app.database import get_db
from app.etl.etl_service import ETLService
from app.models import User
from app.schemas import (
    AggregateItem,
    DatasetSummary,
    SalesRecordResponse,
    UploadResponse,
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    return AuthService(db).get_current_user(token)


@router.get("/", response_model=list[DatasetSummary])
def list_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ETLService(db).get_datasets(current_user.id)


@router.get("/{dataset_id}", response_model=DatasetSummary)
def get_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = ETLService(db).get_dataset_by_id(dataset_id, current_user.id)
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
    date_from: date | None = None,
    date_to: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ETLService(db)
    dataset = service.get_dataset_by_id(dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")

    query = service.get_records_query(
        dataset_id=dataset_id,
        sort_by=sort_by,
        sort_order=sort_order,
        status=status,
        product_line=product_line,
        date_from=date_from,
        date_to=date_to,
    )
    return paginate(db, query)


@router.get("/{dataset_id}/aggregates")
def get_dataset_aggregates(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ETLService(db)
    dataset = service.get_dataset_by_id(dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")
    return service.get_aggregates(dataset_id)


@router.get("/{dataset_id}/export")
def export_dataset(
    dataset_id: int,
    fmt: str = Query(default="csv", pattern="^(csv)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = ETLService(db).export_dataset(dataset_id, current_user.id, fmt)
    if data is None:
        raise HTTPException(status_code=404, detail="ERROR: Dataset not found")
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset_id}.csv"},
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = await ETLService(db).upload_dataset(current_user.id, file)
    return UploadResponse(
        dataset_id=dataset.id,
        status=dataset.status,
        message="Uprocessing upload",
    )
