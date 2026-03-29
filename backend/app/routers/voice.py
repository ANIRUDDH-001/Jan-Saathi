"""Voice router — STT and TTS endpoints."""
from fastapi import APIRouter, UploadFile, File, Form
from app.services import sarvam
from app.limiter import limiter
from fastapi import Request

router = APIRouter()


@router.post("/transcribe")
@limiter.limit("20/minute")
async def transcribe_audio(
    request: Request,
    audio: UploadFile = File(...),
    language_hint: str = Form(default="hi-IN"),
    session_id: str = Form(default=""),
):
    """Transcribe farmer's speech using Saaras v3."""
    audio_bytes = await audio.read()
    if len(audio_bytes) < 100:
        return {
            "transcript": "", "language_code": language_hint,
            "language_short": "hi", "error": "audio_too_short",
        }

    result = await sarvam.transcribe(audio_bytes, language_hint, session_id)
    return result


_SHORT_TO_BCP47 = {
    "hi": "hi-IN", "bn": "bn-IN", "ta": "ta-IN", "te": "te-IN",
    "gu": "gu-IN", "kn": "kn-IN", "ml": "ml-IN", "mr": "mr-IN",
    "pa": "pa-IN", "od": "od-IN", "en": "en-IN",
}

@router.post("/speak")
async def synthesize_speech(text: str, language: str = "hi-IN"):
    """Convert text to speech using Bulbul v3."""
    if not text.strip():
        return {"audio_b64": "", "error": "empty_text"}

    # Accept both short codes (hi) and full BCP-47 (hi-IN)
    lang_code = _SHORT_TO_BCP47.get(language, language)
    audio_b64 = await sarvam.text_to_speech(text, lang_code)
    return {"audio_b64": audio_b64}
