import pandas as pd
import io

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
]

def extract(file: bytes) -> pd.DataFrame:
    try:
        data_frame = pd.read_csv(io.BytesIO(file), encoding="cp1252")
        missing_columns = set(COLUMNS) - set(data_frame.columns)

        if missing_columns:
            raise ValueError(f"ERROR:Missing required columns: {missing_columns}")

        if data_frame.empty:
            raise ValueError("ERROR:No data found in the file")

        print(data_frame)
        return data_frame
    except Exception as e:
        raise ValueError(f"ERROR: {e}")