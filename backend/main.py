import time
import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.config import get_settings
from app.routers import chat, voice, schemes, applications, auth, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


def _normalize_origin(url: str) -> str:
    # CORS origin matching requires scheme+host(+port) without trailing slash.
    return (url or "").strip().rstrip("/")


allowed_origins = {
    _normalize_origin(settings.frontend_url),
    "http://localhost:3000",
    "http://localhost:5173",
    "https://jan-saathi.vercel.app",
}
allowed_origins.discard("")


app = FastAPI(
    title="Jan Saathi API",
    description="Voice-first AI assistant for rural Indian farmers",
    version="1.0.0"
)

from app.limiter import limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)



class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4())[:8])
        request.state.correlation_id = correlation_id
        start = time.monotonic()
        
        ip_addr = request.client.host if request.client else 'unknown'
        logger.info(f"[{correlation_id}] {request.method} {request.url.path} | ip={ip_addr}")
        
        try:
            response = await call_next(request)
            duration_ms = int((time.monotonic() - start) * 1000)
            logger.info(
                f"[{correlation_id}] → {response.status_code} | {duration_ms}ms"
            )
            response.headers["X-Correlation-ID"] = correlation_id
            return response
        except Exception:
            duration_ms = int((time.monotonic() - start) * 1000)
            logger.exception(
                f"{request.method} {request.url.path} "
                f"status=500 duration={duration_ms}ms corr={correlation_id}"
            )
            raise

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Keep CORS as the outermost app middleware so headers are added for all responses,
# including handled error responses from downstream routes/middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Correlation-ID"],
    max_age=600,
)

app.include_router(chat.router,         prefix="/api/chat",         tags=["chat"])
app.include_router(voice.router,        prefix="/api/voice",        tags=["voice"])
app.include_router(schemes.router,      prefix="/api/schemes",      tags=["schemes"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(auth.router,         prefix="/auth",             tags=["auth"])
app.include_router(admin.router,        prefix="/api/admin",        tags=["admin"])


@app.get("/health")
async def health():
    """Full health check — verifies all downstream services."""
    from app.services import groq_llm, cohere_embed, sarvam
    from app.services.supabase_db import health_check as supabase_health

    checks_config = [
        ("groq", groq_llm.health_check),
        ("cohere", cohere_embed.health_check),
        ("sarvam", sarvam.health_check),
        ("supabase", supabase_health),
    ]

    services = {}
    for name, check_fn in checks_config:
        t0 = time.monotonic()
        try:
            result = await check_fn()
        except Exception as e:
            result = {"status": "error", "error": str(e)}
        services[name] = {**result, "latency_ms": int((time.monotonic() - t0) * 1000)}

    all_ok = all(v.get("status") == "ok" for v in services.values())
    return {
        "status": "ok" if all_ok else "degraded",
        "services": services,
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    return {"message": "Jan Saathi API", "docs": "/docs", "version": "1.0.0"}
