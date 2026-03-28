"""Voice router — STT and TTS endpoints."""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models import VoiceResponse
from app.services import sarvam

router = APIRouter()

@router.post("/transcribe", response_model=VoiceResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language_hint: str = Form("hi-IN"),
    session_id: str = Form(...)
):
    """Transcribe farmer's speech using Saaras v3."""
    audio_bytes = await audio.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio too short")
    
    result = await sarvam.transcribe(audio_bytes, language_hint)
    return VoiceResponse(**result)

@router.post("/speak")
async def synthesize_speech(text: str, language: str = "hi-IN"):
    """Convert text to speech using Bulbul v3."""
    audio_b64 = await sarvam.text_to_speech(text, language)
    return {"audio_b64": audio_b64, "language": language}
