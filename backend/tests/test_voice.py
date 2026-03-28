"""test_voice.py — voice transcription and speech synthesis endpoints."""
import pytest
from io import BytesIO


class TestTranscribe:
    def test_transcribe_empty_audio_returns_too_short(self, client):
        """Empty/tiny audio should return error=audio_too_short, not crash."""
        r = client.post(
            "/api/voice/transcribe",
            files={"audio": ("rec.webm", BytesIO(b""), "audio/webm")},
            data={"session_id": "test-voice-001", "language_hint": "hi-IN"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("error") == "audio_too_short" or data["transcript"] == ""

    def test_transcribe_short_audio_returns_too_short(self, client):
        """Audio under 100 bytes should be rejected gracefully."""
        tiny = b"\x00" * 50
        r = client.post(
            "/api/voice/transcribe",
            files={"audio": ("rec.webm", BytesIO(tiny), "audio/webm")},
            data={"session_id": "test-voice-002", "language_hint": "hi-IN"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("error") == "audio_too_short"

    def test_transcribe_valid_audio_returns_transcript(self, client, mock_sarvam):
        """Valid (mocked) audio should return a transcript string."""
        fake_audio = b"\x00" * 500  # >100 bytes passes the size check
        r = client.post(
            "/api/voice/transcribe",
            files={"audio": ("rec.webm", BytesIO(fake_audio), "audio/webm")},
            data={"session_id": "test-voice-003", "language_hint": "hi-IN"},
        )
        assert r.status_code == 200
        data = r.json()
        assert "transcript" in data
        assert len(data["transcript"]) > 0

    def test_transcribe_missing_audio_returns_422(self, client):
        """Missing audio file should return 422 validation error."""
        r = client.post(
            "/api/voice/transcribe",
            data={"session_id": "test-voice-004", "language_hint": "hi-IN"},
        )
        assert r.status_code == 422


class TestSpeak:
    def test_speak_empty_text_returns_empty_audio(self, client):
        """Empty text should return empty audio, not crash."""
        r = client.post("/api/voice/speak?text=&language=hi")
        assert r.status_code == 200
        data = r.json()
        assert "audio_b64" in data
        assert data["audio_b64"] == ""

    def test_speak_whitespace_only_returns_empty(self, client):
        """Whitespace-only text should be treated as empty."""
        r = client.post("/api/voice/speak?text=%20%20%20&language=hi")
        assert r.status_code == 200
        data = r.json()
        assert data.get("error") == "empty_text"

    def test_speak_valid_text_returns_audio(self, client, mock_sarvam):
        """Valid text should return base64-encoded audio."""
        r = client.post("/api/voice/speak?text=namaste&language=hi")
        assert r.status_code == 200
        data = r.json()
        assert "audio_b64" in data
        assert len(data["audio_b64"]) > 0

    def test_speak_long_text_still_responds(self, client, mock_sarvam):
        """Long text should not crash the TTS endpoint."""
        long_text = "yah ek lamba sandesh hai " * 50
        r = client.post(f"/api/voice/speak?text={long_text[:500]}&language=hi")
        assert r.status_code == 200
        data = r.json()
        assert "audio_b64" in data

    def test_speak_default_language(self, client, mock_sarvam):
        """No language param should default to Hindi."""
        r = client.post("/api/voice/speak?text=hello")
        assert r.status_code == 200
