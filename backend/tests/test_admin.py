import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app
from app.routers.auth import create_jwt

client = TestClient(app)

def test_admin_stats_unauthorized():
    r = client.get("/api/admin/stats")
    assert r.status_code == 401

def test_admin_stats_not_admin():
    token = create_jwt("user1", "test@test.com", "citizen")
    r = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403

def test_admin_stats_authorized():
    token = create_jwt("admin1", "admin@email.com", "admin")
    r = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert "total_sessions" in r.json()

def test_admin_sessions():
    token = create_jwt("admin1", "admin@email.com", "admin")
    r = client.get("/api/admin/sessions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200

def test_integrations_panel():
    token = create_jwt("admin1", "admin@email.com", "admin")
    r = client.get("/api/admin/integrations", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert "apis" in r.json()
