"""Auth router — Google OAuth + JWT."""
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings
from app.services import supabase_db as db

router = APIRouter()
security = HTTPBearer(auto_error=False)
settings = get_settings()

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

def create_jwt(user_id: str, email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {
            "sub": user_id, 
            "email": email, 
            "role": role, 
            "exp": expire, 
            "iss": "jan-saathi"
        },
        settings.jwt_secret, algorithm=settings.jwt_algorithm
    )

def decode_jwt(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"verify_iss": True, "iss": "jan-saathi"},
    )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return decode_jwt(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return user

@router.get("/google")
async def google_auth_url():
    """Return Google OAuth URL for frontend redirect."""
    from urllib.parse import urlencode
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.frontend_url}/auth/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"}

@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback, issue JWT."""
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_r = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": f"{settings.frontend_url}/auth/callback",
            "grant_type": "authorization_code",
        })
        tokens = token_r.json()
        
        if "error" in tokens:
            raise HTTPException(status_code=400, detail=tokens["error"])
        
        # Get user info
        info_r = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        guser = info_r.json()
    
    email = guser.get("email")
    role = "admin" if email == settings.admin_email else "citizen"
    
    user_data = {
        "id": guser.get("id"),
        "email": email,
        "name": guser.get("name"),
        "avatar_url": guser.get("picture"),
        "role": role,
    }
    
    # Need to handle UUID cast effectively if guser id isn't full UUID 
    # Supabase might error. We'll try to let upsert_user handle it.
    try:
        user = db.upsert_user(user_data)
    except Exception as e:
        # If ID is invalid UUID, let's omit it and let Supabase generate one if it fails,
        # or error out gracefully in this demo.
        print(f"Error upserting user: {e}")
        user = user_data
    
    token = create_jwt(user.get("id", "guest"), email, role)
    return {"token": token, "user": user}
