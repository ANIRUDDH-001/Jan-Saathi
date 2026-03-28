import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_transcribe_audio_too_short():
    r = client.post("/api/voice/transcribe", files={"audio": ("test.webm", b"short", "audio/webm")}, data={"session_id": "123", "language_hint": "hi-IN"})
    assert r.status_code == 400

def test_transcribe_success():
    # Send >100 bytes of dummy audio
    audio_data = b"x" * 150
    r = client.post("/api/voice/transcribe", files={"audio": ("test.webm", audio_data, "audio/webm")}, data={"session_id": "123", "language_hint": "hi-IN"})
    assert r.status_code == 200
    assert r.json().get("transcript") == "Test transcript"

def test_speak():
    r = client.post("/api/voice/speak?text=Hello&language=en-IN")
    assert r.status_code == 200
    assert "audio_b64" in r.json()
