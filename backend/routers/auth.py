from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel

from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from core.config import get_settings
from models.user import User, OAuthProviderEnum, StatusEnum
from schemas.user import UserCreate, UserResponse
from schemas.token import Token
from core.dependencies import get_current_user

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])

class GoogleAuthRequest(BaseModel):
    token: str

class VerifyEmailRequest(BaseModel):
    token: str

class AdminLoginRequest(BaseModel):
    email: str
    password: str
    admin_secret: str

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=get_password_hash(user_in.password),
        email_verified=True,
        status=StatusEnum.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=400, detail="Incorrect email or password"
        )
    if str(user.status) != "ACTIVE" and str(user.status) != "StatusEnum.ACTIVE":
        raise HTTPException(
            status_code=403, detail="Email not verified. Please verify your email first."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return {
        "access_token": create_access_token(
            {"sub": str(user.user_id)}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/admin-login", response_model=Token)
def admin_login(req: AdminLoginRequest, db: Session = Depends(get_db)):
    from models.user import RoleEnum
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    import os
    admin_secret = os.environ.get("ADMIN_SECRET_KEY", "newpulse_admin_secret_123")
    if req.admin_secret == admin_secret:
        user.role = RoleEnum.ADMIN
        db.commit()
    else:
        if str(user.role) not in ["ADMIN", "RoleEnum.ADMIN"]:
            raise HTTPException(status_code=403, detail="Invalid admin secret and you are not an admin")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            {"sub": str(user.user_id)}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    from services.email_service import verify_token
    email = verify_token(req.token)
    
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.email_verified = True
    user.status = StatusEnum.ACTIVE
    db.commit()
    return {"message": "Email verified successfully"}

@router.post("/google", response_model=Token)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            req.token, requests.Request(), settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name=name,
                oauth_provider=OAuthProviderEnum.GOOGLE,
                oauth_provider_id=idinfo['sub'],
                profile_image_url=picture,
                status=StatusEnum.ACTIVE,
                email_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return {
            "access_token": create_access_token(
                {"sub": str(user.user_id)}, expires_delta=access_token_expires
            ),
            "token_type": "bearer",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
