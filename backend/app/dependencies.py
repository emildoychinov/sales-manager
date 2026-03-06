from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.auth_service import AuthService
from app.database import get_db
from app.etl.etl_service import ETLService
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_etl_service(request: Request) -> ETLService:
    return request.app.state.etl_service

def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    auth: AuthService = Depends(get_auth_service),
) -> User:
    return auth.get_current_user(db, token)
