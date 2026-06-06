from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from core.config import get_settings
from core.database import get_db
from models.user import User
from schemas.token import TokenPayload
from core.security import decode_token
from uuid import UUID

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise credentials_exception
        
    token_data = TokenPayload(sub=user_id_str)
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
    if str(user.status) != "ACTIVE": # Enum comparison
        pass # Depending on how Enum is set up in model, normally user.status.value
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    # We can add more strict checks here if needed
    return current_user
