from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import User, Dataset, SalesRecord
from app.routers.auth import router as auth_router

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


app.include_router(auth_router, prefix="/api/auth")