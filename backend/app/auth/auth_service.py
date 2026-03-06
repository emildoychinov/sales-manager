from app.auth.utils import *
from app.config import settings
from app.models import User
from app.schemas import Token, UserCreate
from sqlalchemy.orm import Session
from fastapi import HTTPException

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.jwt_secret = settings.JWT_SECRET
        self.jwt_algorithm = settings.JWT_ALGORITHM
        self.jwt_expiration_minutes = settings.JWT_EXPIRATION_MINUTES

    def register_user(self, user: UserCreate) -> User:
        if self.db.query(User).filter(User.email == user.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed_password = hash_password(user.password)
        db_user = User(email=user.email, hashed_password=hashed_password)

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

        return db_user

    def login_user(self, email: str, password: str) -> Token:
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return Token(access_token=create_access_token(user.id, self.jwt_secret, self.jwt_algorithm, self.jwt_expiration_minutes), token_type="bearer")

    def get_current_user(self, token: str) -> User:
        user_id = verify_access_token(token, self.jwt_secret, self.jwt_algorithm)
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user