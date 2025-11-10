"""
Authentication and user management module for PDRM Minutes App
"""

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pathlib import Path

import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, validator
from tinydb import TinyDB, Query
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing - use direct bcrypt to avoid passlib compatibility issues
security = HTTPBearer()

# Database setup
DB_PATH = Path(__file__).parent / "users.json"
db = TinyDB(DB_PATH)
users_table = db.table("users")

# Pydantic models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    is_active: bool = True
    is_admin: bool = False

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    confirm_password: str

    @validator('username')
    def username_must_be_alphanumeric(cls, v):
        if not v.replace('_', '').replace('.', '').replace('@', '').isalnum():
            raise ValueError('Username must contain only letters, numbers, underscore, dot, or @ symbol')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        return v.lower()

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDB(UserBase):
    id: int
    password_hash: str
    created_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Password utilities
def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    # Ensure password is not longer than 72 bytes (bcrypt limitation)
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "token_type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "token_type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        
        # Verify token type
        if payload.get("token_type") != token_type:
            return None
            
        token_data = TokenData(username=username)
        return token_data
    except JWTError:
        return None

# User management
def get_user_by_username(username: str) -> Optional[Dict[Any, Any]]:
    """Get user by username"""
    User = Query()
    result = users_table.search(User.username == username.lower())
    return result[0] if result else None

def get_user_by_email(email: str) -> Optional[Dict[Any, Any]]:
    """Get user by email"""
    User = Query()
    result = users_table.search(User.email == email.lower())
    return result[0] if result else None

def create_user(user_data: UserCreate) -> Dict[str, Any]:
    """Create a new user"""
    # Check if user already exists
    if get_user_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    if get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    password_hash = get_password_hash(user_data.password)
    
    # Create user record
    user_dict = {
        "username": user_data.username.lower(),
        "email": user_data.email.lower(),
        "full_name": user_data.full_name,
        "password_hash": password_hash,
        "is_active": True,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    }
    
    # Insert into database
    user_id = users_table.insert(user_dict)
    user_dict["id"] = user_id
    
    return user_dict

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user with username/email and password"""
    # Try to find user by username or email
    user = get_user_by_username(username.lower())
    if not user:
        user = get_user_by_email(username.lower())
    
    if not user:
        return None
    
    if not verify_password(password, user["password_hash"]):
        return None
    
    # Update last login
    User = Query()
    users_table.update(
        {"last_login": datetime.now(timezone.utc).isoformat()},
        User.username == user["username"]
    )
    
    return user

def get_current_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """Get current user from JWT token"""
    token_data = verify_token(token)
    if token_data is None:
        return None
    
    user = get_user_by_username(token_data.username)
    if user is None:
        return None
    
    if not user.get("is_active", True):
        return None
    
    return user

def create_tokens(user: Dict[str, Any]) -> Token:
    """Create access and refresh tokens for a user"""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user["username"]})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

def create_default_admin():
    """Create default admin user if no users exist"""
    if not users_table.all():
        default_admin = UserCreate(
            username="admin",
            email="admin@vrs.com.my",
            password="Admin1234",
            confirm_password="Admin1234",
            full_name="System Administrator"
        )
        
        user = create_user(default_admin)
        # Make this user admin
        User = Query()
        users_table.update(
            {"is_admin": True},
            User.username == "admin"
        )
        return user
    return None

# Initialize default admin on module import
create_default_admin()