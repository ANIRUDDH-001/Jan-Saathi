import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_google_auth_url():
    r = client.get("/auth/google")
    assert r.status_code == 200
    assert "accounts.google.com" in r.json()["url"]

def test_google_callback_mocked():
    from unittest.mock import patch, AsyncMock
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as m_post, \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock) as m_get, \
         patch("app.services.supabase_db.upsert_user", return_value={"id": "user1", "role": "citizen"}):
         
         m_post.return_value.json = lambda: {"access_token": "token123"}
         m_get.return_value.json = lambda: {"id": "google-123", "email": "test@example.com", "name": "Test User", "picture": "url"}
         
         r = client.get("/auth/google/callback?code=mockcode")
         assert r.status_code == 200
         data = r.json()
         assert "token" in data
         assert data["user"]["role"] == "citizen"
