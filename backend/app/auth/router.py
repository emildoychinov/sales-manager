from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Annotated
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.auth_service import AuthService
from app.schemas import UserCreate, UserResponse, Token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    user = AuthService(db).register_user(user)
    return {"id": user.id, "email": user.email, "created_at": user.created_at}

@router.post("/login", response_model=Token)
#OAuth2 convention
def login_user(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    return AuthService(db).login_user(form_data.username, form_data.password)

@router.get("/me", response_model=UserResponse)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return AuthService(db).get_current_user(token)