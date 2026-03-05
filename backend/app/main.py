from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import User, Dataset, SalesRecord
from app.routers.auth import router as auth_router
import kagglehub
from app.etl import etl_pipeline
from pathlib import Path

app = FastAPI(
    title="CSV Data Ingestion Pipeline",
    description="Upload sales CSVs, process via ETL, and view on a dashboard.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# testing purposes
# @app.get("/api/datasets")
# def get_datasets():
#     path = kagglehub.dataset_download("kyanyoga/sample-sales-data")
#     csv_path = Path(path) / "sales_data_sample.csv"
#     with open(csv_path, "rb") as file:
#         data = file.read()

#     df = etl_pipeline.extract(data)
#     return df.head(5).to_dict(orient="records")

app.include_router(auth_router, prefix="/api/auth")