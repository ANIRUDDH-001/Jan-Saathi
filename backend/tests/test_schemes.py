"""test_schemes.py — schemes listing, search, detail endpoints."""
from unittest.mock import MagicMock
import pytest

class TestSchemes:
    def test_list_schemes_returns_200(self, client, monkeypatch):
        """GET /api/schemes returns 200 with scheme data."""
        mock_supabase = MagicMock()
        mock_chain = MagicMock()
        mock_chain.execute.return_value = MagicMock(data=[{
            "scheme_id": "pm-kisan", "name_english": "PM-KISAN",
            "benefit_annual_inr": 6000, "is_verified": True,
            "acronym": "PM-KISAN", "level": "central", "state": "national",
            "has_monetary_benefit": True, "demo_ready": True,
        }])
        mock_supabase.table.return_value.select.return_value.eq.return_value.limit.return_value = mock_chain
        
        # Patch the source of get_db in the supabase_db module
        from app.services import supabase_db
        monkeypatch.setattr(supabase_db, "get_db", lambda: mock_supabase)
        
        r = client.get("/api/schemes")
        assert r.status_code == 200

    def test_scheme_detail_returns_200(self, client, monkeypatch):
        """GET /api/schemes/{id} returns 200 for a known scheme."""
        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = \
            MagicMock(data=[{"scheme_id": "pm-kisan", "name_english": "PM-KISAN"}])
        
        from app.services import supabase_db
        monkeypatch.setattr(supabase_db, "get_db", lambda: mock_supabase)
        
        r = client.get("/api/schemes/pm-kisan")
        assert r.status_code == 200

    def test_scheme_not_found_returns_404(self, client, monkeypatch):
        """GET /api/schemes/{unknown} returns 404."""
        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = \
            MagicMock(data=[])
        
        from app.services import supabase_db
        monkeypatch.setattr(supabase_db, "get_db", lambda: mock_supabase)
        
        r = client.get("/api/schemes/nonexistent-scheme")
        assert r.status_code == 404

    def test_scheme_search_returns_list(self, client, mock_embed, monkeypatch):
        """GET /api/schemes/search?q=... returns a list."""
        from app.services import supabase_db as db
        monkeypatch.setattr(db, "match_schemes", lambda *a, **k: [
            {"scheme_id": "pm-kisan", "name_english": "PM-KISAN",
             "benefit_annual_inr": 6000, "similarity": 0.92}
        ])
        r = client.get("/api/schemes/search?q=kisan+income+support")
        assert r.status_code == 200
        schemes = r.json()
        assert isinstance(schemes, list)
        assert len(schemes) > 0
