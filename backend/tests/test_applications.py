import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_submit_application():
    r = client.post("/api/applications/submit", json={
        "session_id": "test-apply-001",
        "scheme_id": "uuid-123",
        "form_data": {
            "name": "Ramesh Kumar",
            "state": "uttar_pradesh",
            "aadhaar": "123456789012",
            "bank_account": "1234567890",
            "bank_ifsc": "SBIN0001234",
        },
        "confirmed": True
    })
    assert r.status_code == 200
    data = r.json()
    assert data["reference_number"].startswith("JAN-")
    assert data["status"] == "submitted"

def test_submit_not_confirmed():
    r = client.post("/api/applications/submit", json={
        "session_id": "test-123", "scheme_id": "1", "form_data": {}, "confirmed": False
    })
    assert r.status_code == 400

def test_track_application():
    r = client.get("/api/applications/track/JAN-2026-00001")
    assert r.status_code == 200
    data = r.json()
    assert data["reference_number"] == "JAN-2026-00001"

def test_session_applications():
    r = client.get("/api/applications/session/test-123")
    assert r.status_code == 200
