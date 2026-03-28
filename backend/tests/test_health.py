"""test_health.py — health, root, docs endpoints."""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    # Status is "ok" when all services respond, "degraded" in test/CI without real keys
    assert data["status"] in ("ok", "degraded")
    assert "services" in data
    assert "version" in data


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "Jan Saathi" in r.json().get("message", "")


def test_docs_accessible(client):
    r = client.get("/docs")
    assert r.status_code == 200
