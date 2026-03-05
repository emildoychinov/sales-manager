from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from app.models import Dataset, SalesRecord
from app.schemas import DatasetSummary, PaginatedRecords, AggregateItem
from app.database import get_db
from app.config import settings
from app.auth.utils import verify_access_token

class ETLService:
    def __init__(self, db: Session):
        self.db = db

    def get_dataset(self, dataset_id: int):
        return self.db.query(Dataset).filter(Dataset.id == dataset_id).first()