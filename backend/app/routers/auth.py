from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.auth_service import AuthService
from app.dependencies import get_current_user, get_auth_service
from app.schemas import UserCreate, UserResponse, Token
from app.models import User

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db), auth: AuthService = Depends(get_auth_service)):
    user = auth.register_user(db, user)
    return {"id": user.id, "email": user.email, "created_at": user.created_at}

@router.post("/login", response_model=Token)
def login_user(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db), auth: AuthService = Depends(get_auth_service)):
    return auth.login_user(db, form_data.username, form_data.password)

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
