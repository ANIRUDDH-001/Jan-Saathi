"""Sarvam AI — STT (Saaras v3) and TTS (Bulbul v3)."""
import logging
import tempfile
import os
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)
_s = get_settings()
BASE = "https://api.sarvam.ai"

LANG_CODE_MAP = {
    "hi-IN": "hi", "bn-IN": "bn", "ta-IN": "ta", "te-IN": "te",
    "gu-IN": "gu", "kn-IN": "kn", "ml-IN": "ml", "mr-IN": "mr",
    "pa-IN": "pa", "od-IN": "od", "or-IN": "od", "en-IN": "en",
}

# Per-language speaker names for Bulbul v3
LANG_TO_SPEAKER = {
    "hi-IN": "shubh",
    "bn-IN": "anushka",
    "ta-IN": "kavya",
    "te-IN": "meera",
    "gu-IN": "diya",
    "kn-IN": "nadia",
    "ml-IN": "pavithra",
    "mr-IN": "aarohi",
    "pa-IN": "gurpreet",
    "or-IN": "priya",
    "en-IN": "maya",
}


async def transcribe(
    audio_bytes: bytes,
    language_code: str = "hi-IN",
    session_id: str = "",
) -> dict:
    """Transcribe audio using Saaras v3. Returns transcript + detected language.

    On failure returns dict with empty transcript and 'error' key — never raises.
    """
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp = f.name

        async with httpx.AsyncClient(timeout=30) as client:
            with open(tmp, "rb") as audio_file:
                response = await client.post(
                    f"{BASE}/speech-to-text",
                    headers={"api-subscription-key": _s.sarvam_api_key},
                    files={"file": ("audio.webm", audio_file, "audio/webm")},
                    data={
                        "model": _s.sarvam_stt_model,
                        "language_code": language_code,
                        "with_timestamps": "false",
                        "with_diarization": "false",
                    },
                )
        response.raise_for_status()
        data = response.json()
        detected = data.get("language_code", language_code)
        transcript = data.get("transcript", "")

        logger.info(
            "STT success | session=%s | detected=%s | chars=%d",
            session_id, detected, len(transcript),
        )
        return {
            "transcript": transcript,
            "language_code": detected,
            "language_short": LANG_CODE_MAP.get(detected, "hi"),
        }

    except httpx.TimeoutException:
        logger.error("STT timeout | session=%s", session_id)
        return {
            "transcript": "", "language_code": language_code,
            "language_short": LANG_CODE_MAP.get(language_code, "hi"),
            "error": "timeout",
        }
    except httpx.HTTPStatusError as e:
        logger.error(
            "STT HTTP error %d | session=%s | body=%s",
            e.response.status_code, session_id, e.response.text[:200],
        )
        return {
            "transcript": "", "language_code": language_code,
            "language_short": LANG_CODE_MAP.get(language_code, "hi"),
            "error": f"http_{e.response.status_code}",
        }
    except Exception as e:
        logger.error("STT unexpected error: %s | session=%s", e, session_id)
        return {
            "transcript": "", "language_code": language_code,
            "language_short": LANG_CODE_MAP.get(language_code, "hi"),
            "error": str(e),
        }
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except Exception:
                pass


async def text_to_speech(text: str, language_code: str = "hi-IN") -> str:
    """Convert text to speech using Bulbul v3. Returns base64 WAV string, or '' on failure."""
    if not text.strip():
        return ""

    # Per-language speaker selection
    speaker = LANG_TO_SPEAKER.get(language_code, _s.sarvam_tts_speaker)

    # Trim text — Bulbul works best under 500 chars for low latency
    trimmed = text
    if len(text) > 500:
        for sep in ["।", ".", "!", "?"]:
            last = text[:500].rfind(sep)
            if last > 200:
                trimmed = text[: last + 1]
                break
        else:
            trimmed = text[:500]

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{BASE}/text-to-speech",
                headers={
                    "api-subscription-key": _s.sarvam_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": [trimmed],
                    "target_language_code": language_code,
                    "speaker": speaker,
                    "pitch": 0,
                    "pace": 1.1,
                    "loudness": 1.5,
                    "speech_sample_rate": 22050,
                    "enable_preprocessing": True,
                    "model": _s.sarvam_tts_model,
                },
            )
        response.raise_for_status()
        data = response.json()
        audios = data.get("audios", [])
        result = audios[0] if audios else ""

        if result:
            logger.info(
                "TTS success | lang=%s | speaker=%s | chars=%d",
                language_code, speaker, len(trimmed),
            )
        else:
            logger.warning("TTS returned empty audio | lang=%s", language_code)

        return result

    except httpx.TimeoutException:
        logger.error("TTS timeout | lang=%s", language_code)
        return ""
    except httpx.HTTPStatusError as e:
        logger.error(
            "TTS HTTP error %d | lang=%s | body=%s",
            e.response.status_code, language_code, e.response.text[:200],
        )
        return ""
    except Exception as e:
        logger.error("TTS unexpected error: %s | lang=%s", e, language_code)
        return ""


async def health_check() -> dict:
    """Verify Sarvam API is reachable by making a test TTS call."""
    try:
        result = await text_to_speech("namaste", "hi-IN")
        if result:
            return {"status": "ok", "tts": _s.sarvam_tts_model, "stt": _s.sarvam_stt_model}
        return {"status": "error", "error": "empty_audio_response"}
    except Exception as e:
        return {"status": "error", "error": str(e)}
