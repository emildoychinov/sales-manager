import pandas as pd
import io
from sqlalchemy.orm import Session
from app.models import SalesRecord
from app.etl.utils import safe_int, safe_float, safe_str, safe_date

COLUMNS = [
    "ORDERNUMBER",
    "QUANTITYORDERED",
    "PRICEEACH",
    "ORDERLINENUMBER",
    "SALES",
    "ORDERDATE",
    "STATUS",
    "QTR_ID",
    "MONTH_ID",
    "YEAR_ID",
    "PRODUCTLINE",
    "MSRP",
    "PRODUCTCODE",
    "CUSTOMERNAME",
    "PHONE",
    "ADDRESSLINE1",
    "ADDRESSLINE2",
    "CITY",
    "STATE",
    "POSTALCODE",
    "COUNTRY",
    "TERRITORY",
    "CONTACTLASTNAME",
    "CONTACTFIRSTNAME",
    "DEALSIZE",
]

def extract(file: bytes) -> pd.DataFrame:
    try:
        data_frame = pd.read_csv(io.BytesIO(file), encoding="cp1252")
        missing_columns = set(COLUMNS) - set(data_frame.columns)

        if missing_columns:
            raise ValueError(f"ERROR: Missing required columns: {missing_columns}")

        if data_frame.empty:
            raise ValueError("ERROR: No data found in the file")

        return data_frame
    except Exception as e:
        raise ValueError(f"ERROR: {e}")

def transform(data_frame: pd.DataFrame) -> pd.DataFrame:
    try:
        data_frame.drop_duplicates(subset=["ORDERNUMBER", "PRODUCTCODE"], keep="last", inplace=True)
        data_frame.dropna(subset=["ORDERNUMBER", "PRODUCTCODE"], inplace=True)
        numeric_cols = [c for c in data_frame.columns if pd.api.types.is_numeric_dtype(data_frame[c])]
        object_cols = [c for c in data_frame.columns if pd.api.types.is_object_dtype(data_frame[c])]

        if object_cols:
            modes = data_frame[object_cols].mode()
            if not modes.empty:
                data_frame[object_cols] = data_frame[object_cols].fillna(modes.iloc[0])
            else:
                data_frame[object_cols] = data_frame[object_cols].fillna("")

        if numeric_cols:
            data_frame[numeric_cols] = data_frame[numeric_cols].fillna(data_frame[numeric_cols].median())

        data_frame["ORDERDATE"] = pd.to_datetime(data_frame["ORDERDATE"], errors="coerce")
        data_frame.dropna(subset=["ORDERDATE"], inplace=True)

        data_frame['TOTAL_SALES'] = (data_frame['QUANTITYORDERED'] * data_frame['PRICEEACH']).round(2)

        return data_frame
    except Exception as e:
        raise ValueError(f"ERROR: {e}")


def load(data_frame: pd.DataFrame, dataset_id: int, db: Session) -> None:
    try:
        records = [
            SalesRecord(
                dataset_id=dataset_id,
                order_number=safe_int(row["ORDERNUMBER"]),
                quantity_ordered=safe_int(row["QUANTITYORDERED"]),
                price_each=safe_float(row["PRICEEACH"]),
                sales=safe_float(row["SALES"]),
                total_sales=safe_float(row["TOTAL_SALES"]),
                order_date=safe_date(row["ORDERDATE"]),
                status=safe_str(row["STATUS"]),
                product_line=safe_str(row["PRODUCTLINE"]),
                product_code=safe_str(row["PRODUCTCODE"]),
                customer_name=safe_str(row["CUSTOMERNAME"]),
                city=safe_str(row["CITY"]),
                country=safe_str(row["COUNTRY"]),
                deal_size=safe_str(row["DEALSIZE"]),
            )
            for _, row in data_frame.iterrows()
        ]
        db.add_all(records)
        db.commit()
    except Exception as e:
        db.rollback()
        raise ValueError(f"ERROR: {e}")

def metrics(data_frame: pd.DataFrame, total_rows: int) -> dict:
    data_frame_rows = len(data_frame)
    rows_dropped = total_rows - data_frame_rows
    total_sales = round(float(data_frame["TOTAL_SALES"].sum()), 2)
    date_min = safe_date(data_frame["ORDERDATE"].min())
    date_max = safe_date(data_frame["ORDERDATE"].max())

    return {
        "total_rows": data_frame_rows,
        "rows_dropped": rows_dropped,
        "total_sales": total_sales,
        "date_min": date_min,
        "date_max": date_max,
    }