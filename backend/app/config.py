from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    groq_api_key: str
    groq_primary_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    groq_fallback_1: str = "llama-3.3-70b-versatile"
    groq_fallback_2: str = "moonshotai/kimi-k2-instruct"
    groq_fallback_3: str = "qwen/qwen3-32b"
    cohere_api_key: str
    cohere_embed_model: str = "embed-multilingual-v3.0"
    sarvam_api_key: str
    sarvam_stt_model: str = "saaras:v3"
    sarvam_tts_model: str = "bulbul:v3"
    sarvam_tts_speaker: str = "shubh"
    google_client_id: str
    google_client_secret: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    admin_email: str = "aniruddhvijay2k7@gmail.com"
    ipapi_url: str = "https://ipapi.co/{ip}/json/"

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache
def get_settings() -> Settings:
    return Settings()
