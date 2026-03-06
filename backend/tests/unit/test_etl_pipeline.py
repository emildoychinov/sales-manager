import pandas as pd
import pytest
from sqlalchemy.orm import Session

from app.etl import etl_pipeline
from app.etl.etl_constants import COLUMNS


def _minimal_csv(rows=None, encoding="cp1252"):
    header = ",".join(COLUMNS)
    if rows is None:
        rows = [
            "10100,30,95.7,1,2871,2003-02-01,Shipped,1,2,2003,Classic Cars,95,S10_1678,Customer A,,Address,,NYC,,10001,USA,,Smith,John,Small",
        ]
    body = "\n".join(rows)
    return (header + "\n" + body).encode(encoding)


def test_extract_valid_returns_dataframe():
    data = _minimal_csv()
    df = etl_pipeline.extract(data)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1
    assert list(df.columns) == COLUMNS


def test_extract_missing_columns_raises():
    data = "ORDERNUMBER,QUANTITYORDERED\n1,2".encode("cp1252")
    with pytest.raises(ValueError, match="Missing required columns"):
        etl_pipeline.extract(data)


def test_extract_empty_file_raises():
    data = (",".join(COLUMNS) + "\n").encode("cp1252")
    with pytest.raises(ValueError, match="No data found"):
        etl_pipeline.extract(data)


def test_transform_deduplicates_by_order_and_product():
    data = _minimal_csv(
        rows=[
            "10100,30,95.7,1,2871,2003-02-01,Shipped,1,2,2003,Classic Cars,95,S10_1678,Cust A,,a,,NYC,,10001,USA,,S,J,Small",
            "10100,30,95.7,1,2871,2003-02-01,Shipped,1,2,2003,Classic Cars,95,S10_1678,Cust B,,b,,NYC,,10001,USA,,S,J,Small",
        ]
    )
    df = etl_pipeline.extract(data)
    out = etl_pipeline.transform(df)
    assert len(out) == 1
    assert out["CUSTOMERNAME"].iloc[0] == "Cust B"


def test_transform_parses_orderdate():
    data = _minimal_csv(rows=["10100,30,95.7,1,2871,2003-06-15,Shipped,1,6,2003,Classic Cars,95,S10_1678,Cust,,a,,NYC,,10001,USA,,S,J,Small"])
    df = etl_pipeline.extract(data)
    out = etl_pipeline.transform(df)
    assert out["ORDERDATE"].iloc[0] is not None
    assert pd.Timestamp(out["ORDERDATE"].iloc[0]).year == 2003
    assert pd.Timestamp(out["ORDERDATE"].iloc[0]).month == 6


def test_transform_adds_total_sales():
    data = _minimal_csv(rows=["10100,10,100.0,1,1000,2003-02-01,Shipped,1,2,2003,Classic Cars,95,S10_1678,Cust,,a,,NYC,,10001,USA,,S,J,Small"])
    df = etl_pipeline.extract(data)
    out = etl_pipeline.transform(df)
    assert "TOTAL_SALES" in out.columns
    assert out["TOTAL_SALES"].iloc[0] == pytest.approx(1000.0)


def test_transform_drops_null_orderdate():
    data = _minimal_csv(rows=["10100,30,95.7,1,2871,,Shipped,1,2,2003,Classic Cars,95,S10_1678,Cust,,a,,NYC,,10001,USA,,S,J,Small"])
    df = etl_pipeline.extract(data)
    out = etl_pipeline.transform(df)
    assert len(out) == 0


def test_metrics_row_counts():
    data = _minimal_csv()
    df = etl_pipeline.extract(data)
    transformed = etl_pipeline.transform(df)
    total_before = len(df)
    m = etl_pipeline.metrics(transformed, total_before)
    assert m["total_rows"] == len(transformed)
    assert m["rows_dropped"] == total_before - len(transformed)
    assert "total_sales" in m
    assert "date_min" in m
    assert "date_max" in m


def test_load_inserts_records(db: Session):
    data = _minimal_csv()
    df = etl_pipeline.extract(data)
    transformed = etl_pipeline.transform(df)
    from app.models import Dataset, SalesRecord, User
    from app.etl.etl_constants import Status

    user = User(email="loadtest@example.com", hashed_password="hash")
    db.add(user)
    db.commit()
    db.refresh(user)

    dataset = Dataset(user_id=user.id, filename="test.csv", status=Status.COMPLETED)
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    etl_pipeline.load(transformed, dataset.id, db)

    count = db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset.id).count()
    assert count == len(transformed)
