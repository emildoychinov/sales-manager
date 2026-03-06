from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import add_pagination

from app.auth.auth_service import AuthService
from app.database import Base, engine
from app.etl.etl_service import ETLService
from app.models import User, Dataset, SalesRecord
from app.routers.auth import router as auth_router
from app.routers.datasets import router as datasets_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    app.state.auth_service = AuthService()
    app.state.etl_service = ETLService()
    yield


app = FastAPI(
    title="CSV Data Ingestion Pipeline",
    description="Upload sales CSVs, process via ETL, and view on a dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

app.include_router(auth_router, prefix="/api/auth")
app.include_router(datasets_router, prefix="/api/datasets")

add_pagination(app)
