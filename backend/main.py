from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import chat, voice, schemes, applications, auth, admin

settings = get_settings()

app = FastAPI(
    title="Jan Saathi API",
    description="Voice-first AI assistant for rural Indian farmers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router,         prefix="/api/chat",     tags=["chat"])
app.include_router(voice.router,        prefix="/api/voice",    tags=["voice"])
app.include_router(schemes.router,      prefix="/api/schemes",  tags=["schemes"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(auth.router,         prefix="/auth",         tags=["auth"])
app.include_router(admin.router,        prefix="/api/admin",    tags=["admin"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "jan-saathi-api"}

@app.get("/")
async def root():
    return {"message": "Jan Saathi API", "docs": "/docs"}
