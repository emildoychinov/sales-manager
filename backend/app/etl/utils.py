import pandas as pd

# in order to enusure no numpy values are leaked into the ORM, NaN / NaT safety

def safe_int(val) -> int | None:
    if pd.isna(val):
        return None
    return int(val)


def safe_float(val) -> float | None:
    if pd.isna(val):
        return None
    return float(val)


def safe_str(val) -> str | None:
    if pd.isna(val):
        return None
    return str(val)


def safe_date(val):
    if pd.isna(val):  # type: ignore[arg-type]
        return None
    return pd.Timestamp(val).date()  # type: ignore[arg-type]