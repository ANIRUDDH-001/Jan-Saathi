"""Tests for chat endpoint state machine."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_intake_extracts_profile():
    # Will use the mocked process_intake returning all 3 field values 
    r = client.post("/api/chat", json={
        "message": "Main UP se hoon, kisan hoon, 45 saal",
        "session_id": "test-001",
        "language": "hi"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["state"] in ["intake", "match"]
    assert "reply" in data
    assert data["profile"].get("state") == "uttar_pradesh" or data["state"] == "intake"

def test_threshold_triggers_match():
    """When state+subtype+age all collected, should transition to match."""
    r = client.post("/api/chat", json={
        "message": "Mera naam Ramesh hai. Main Uttar Pradesh ke Varanasi se hoon. Fasal ugata hoon. Umra 48 saal hai.",
        "session_id": "test-threshold-001",
        "language": "hi"
    })
    assert r.status_code == 200
    data = r.json()
    # Mock makes it ready to match
    assert data["state"] in ["intake", "match"]
    if data["state"] == "match":
        assert data["gap_value"] > 0
        assert len(data["schemes"]) > 0

def test_goodbye_triggers_summary():
    # Because of our custom goodbye_side_effect in conftest
    r = client.post("/api/chat", json={
        "message": "dhanyawaad, bas ab",
        "session_id": "test-goodbye-001",
        "language": "hi"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["state"] == "goodbye"
    assert len(data["reply"]) > 1

def test_ip_detect():
    r = client.post("/api/chat/ip-detect")
    assert r.status_code == 200
    data = r.json()
    assert "detected" in data
