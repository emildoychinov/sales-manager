from bcrypt import checkpw, hashpw
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

def hash_password(password: str) -> str:
    return hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: int, secret: str, algorithm: str, expiration_minutes: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
    }
    token = jwt.encode(payload, secret, algorithm=algorithm)
    return token if isinstance(token, str) else token.decode("utf-8")

def verify_access_token(token: str, secret: str, algorithm: str) -> int:
    try:
        payload = jwt.decode(token, secret, algorithms=[algorithm])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="ERROR: Token has expired")
    except jwt.InvalidTokenError as e:
        print("JWT InvalidTokenError:", type(e).__name__, str(e))
        raise HTTPException(status_code=401, detail="ERROR: Invalid token")
        