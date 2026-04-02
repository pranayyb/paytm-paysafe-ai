"""
Paytm AI VoiceGuard - Authentication Utilities
JWT token management, password hashing, and user dependency
"""
import os
import jwt
from datetime import datetime, timedelta
import hashlib
import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import cols

# ─── Configuration ───
JWT_SECRET = os.getenv("JWT_SECRET", "paytm_voiceguard_super_secret_key_2026_piyush_hackathon_india")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Direct bcrypt fix: bypasses passlib.ValueError for short/long passwords on Mac
print("✅ Auth Utilities active: Using direct bcrypt (bypassing passlib bug)")
security = HTTPBearer()

# ─── Password Utilities ───
def get_password_hash(password: str) -> str:
    """Hash password using SHA-256 followed by Bcrypt to overcome 72-byte limit and avoid Passlib-Mac bugs."""
    pre_hash = hashlib.sha256(password.encode('utf-8')).hexdigest().encode('utf-8')
    return bcrypt.hashpw(pre_hash, bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Verify password by pre-hashing it first, then using direct Bcrypt verification."""
    try:
        if not hashed: return False
        pre_hash = hashlib.sha256(plain.encode('utf-8')).hexdigest().encode('utf-8')
        return bcrypt.checkpw(pre_hash, hashed.encode('utf-8'))
    except Exception as e:
        print(f"⚠️  Verification Error: {e}")
        return False

# ─── JWT Utilities ───
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

# ─── FastAPI Dependency: Get Current User ───
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await cols.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

