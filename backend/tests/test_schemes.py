import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_list_schemes():
    r = client.get("/api/schemes")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert "id" in data[0]

def test_search_schemes():
    r = client.get("/api/schemes/search?q=farmer")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0

def test_get_scheme():
    r = client.get("/api/schemes/uuid-123")
    assert r.status_code == 200
    assert r.json()["acronym"] == "TEST"

def test_get_scheme_not_found():
    # Will have to mock this specifically to return null, 
    # but the global mock returns data. Let's patch it inline.
    from unittest.mock import patch, MagicMock
    with patch("app.services.supabase_db.get_db") as m_db:
        db_client = MagicMock()
        db_client.table().select().eq().execute.return_value = MagicMock(data=[])
        m_db.return_value = db_client
        
        r = client.get("/api/schemes/fake-id")
        assert r.status_code == 404
