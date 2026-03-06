from app.etl.utils import safe_int, safe_float, safe_str, safe_date
from typing import Any, Callable
import enum

class Status(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETING = "deleting"

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

COLUMN_MAP: dict[str, tuple[str, Callable[[Any], Any]]] = {
    "ORDERNUMBER":      ("order_number",      safe_int),
    "QUANTITYORDERED":  ("quantity_ordered",   safe_int),
    "PRICEEACH":        ("price_each",         safe_float),
    "SALES":            ("sales",              safe_float),
    "TOTAL_SALES":      ("total_sales",        safe_float),
    "ORDERDATE":        ("order_date",         safe_date),
    "STATUS":           ("status",             safe_str),
    "PRODUCTLINE":      ("product_line",       safe_str),
    "PRODUCTCODE":      ("product_code",       safe_str),
    "CUSTOMERNAME":     ("customer_name",      safe_str),
    "CITY":             ("city",               safe_str),
    "COUNTRY":          ("country",            safe_str),
    "DEALSIZE":         ("deal_size",          safe_str),
}
