"""
Integration tests — require:
  - Backend running at VITE_API_URL or http://localhost:8000
  - Supabase with 51 schemes ingested
Run: pytest backend/tests/test_integration.py -v -m integration
"""
import pytest, os, requests

BASE = os.getenv("TEST_API_URL", "http://localhost:8000")

@pytest.mark.integration
class TestIntegrationChat:
    def test_health_live(self):
        try:
            r = requests.get(f"{BASE}/health", timeout=5)
            assert r.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip(f"Backend not running at {BASE}")

    def test_full_intake_to_match(self):
        """Full conversation: UP kisan 45 saal → scheme match."""
        import uuid
        sid = f"test-int-{uuid.uuid4().hex[:8]}"

        try:
            r = requests.post(f"{BASE}/api/chat", json={
                "message": "Main Uttar Pradesh se hoon. Fasal ugata hoon. Meri umar 45 saal hai.",
                "session_id": sid,
                "language": "hi"
            }, timeout=15)
            assert r.status_code == 200
            d = r.json()
            assert d["state"] in ("intake", "match")

            if d["state"] == "intake":
                # Needs more info — provide it
                r2 = requests.post(f"{BASE}/api/chat", json={
                    "message": "Haan kisan hoon, fasal ugata hoon, 45 saal, UP",
                    "session_id": sid, "language": "hi"
                }, timeout=15)
                d = r2.json()

            # Should now be in match state with PM-KISAN
            assert d["state"] == "match", f"Expected match, got {d['state']}: {d['reply']}"
            assert d["gap_value"] > 0, "Gap value should be positive"
            assert any(s.get("acronym") == "PM-KISAN" for s in d["schemes"]), \
                "PM-KISAN should be in results"
        except requests.exceptions.ConnectionError:
            pytest.skip(f"Backend not running at {BASE}")

    def test_semantic_search_accuracy(self):
        """PM-KISAN should be top result for kisan income query."""
        try:
            r = requests.get(f"{BASE}/api/schemes/search?q=kisan+income+support+UP+6000", timeout=10)
            assert r.status_code == 200
            schemes = r.json()
            assert len(schemes) > 0
            # PM-KISAN should be in top 3
            top3 = [s.get("acronym","") for s in schemes[:3]]
            assert "PM-KISAN" in top3, f"PM-KISAN not in top 3: {top3}"
        except requests.exceptions.ConnectionError:
            pytest.skip(f"Backend not running at {BASE}")

    def test_goodbye_saves_session_summary(self):
        import uuid
        sid = f"test-bye-{uuid.uuid4().hex[:8]}"
        try:
            r = requests.post(f"{BASE}/api/chat", json={
                "message": "dhanyawaad bas", "session_id": sid, "language": "hi"
            }, timeout=10)
            assert r.status_code == 200
            assert r.json()["state"] == "goodbye"
        except requests.exceptions.ConnectionError:
            pytest.skip(f"Backend not running at {BASE}")

    def test_state_filter_works(self):
        """Telangana-specific schemes should appear for Telangana filter."""
        try:
            r = requests.get(f"{BASE}/api/schemes/search?q=farmer+support&state=telangana", timeout=10)
            assert r.status_code == 200
            for s in r.json():
                assert s["state"].lower() in ("telangana", "national", "central"), \
                    f"Non-Telangana scheme returned: {s['name_english']}"
        except requests.exceptions.ConnectionError:
            pytest.skip(f"Backend not running at {BASE}")
