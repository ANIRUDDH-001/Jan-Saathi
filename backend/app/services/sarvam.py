"""Sarvam AI — STT (Saaras v3) and TTS (Bulbul v3)."""
import httpx, base64, tempfile, os
from app.config import get_settings

_s = get_settings()
BASE = "https://api.sarvam.ai"
HEADERS = {"API-Subscription-Key": _s.sarvam_api_key}

LANG_CODE_MAP = {
    "hi-IN": "hi", "bn-IN": "bn", "ta-IN": "ta", "te-IN": "te",
    "gu-IN": "gu", "kn-IN": "kn", "ml-IN": "ml", "mr-IN": "mr",
    "pa-IN": "pa", "od-IN": "od", "en-IN": "en",
}

async def transcribe(audio_bytes: bytes, language_code: str = "hi-IN") -> dict:
    """Transcribe audio using Saaras v3. Returns transcript + detected language."""
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(audio_bytes)
        tmp = f.name
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            with open(tmp, "rb") as audio_file:
                response = await client.post(
                    f"{BASE}/speech-to-text",
                    headers=HEADERS,
                    files={"file": ("audio.webm", audio_file, "audio/webm")},
                    data={
                        "model": _s.sarvam_stt_model,
                        "language_code": language_code,
                        "with_timestamps": "false",
                        "with_diarization": "false",
                        "mode": "online",
                    }
                )
        response.raise_for_status()
        data = response.json()
        detected = data.get("language_code", language_code)
        return {
            "transcript": data.get("transcript", ""),
            "language_code": detected,
            "language_short": LANG_CODE_MAP.get(detected, "hi"),
        }
    finally:
        os.unlink(tmp)

async def text_to_speech(text: str, language_code: str = "hi-IN") -> str:
    """Convert text to speech. Returns base64 WAV string."""
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BASE}/text-to-speech",
            headers={**HEADERS, "Content-Type": "application/json"},
            json={
                "inputs": [text[:500]],  # Bulbul v3 max ~500 chars per call
                "target_language_code": language_code,
                "speaker": _s.sarvam_tts_speaker,
                "pitch": 0,
                "pace": 1.1,  # Slightly faster for snappy responses
                "loudness": 1.5,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True,
                "model": _s.sarvam_tts_model,
            }
        )
    response.raise_for_status()
    data = response.json()
    audios = data.get("audios", [])
    return audios[0] if audios else ""
