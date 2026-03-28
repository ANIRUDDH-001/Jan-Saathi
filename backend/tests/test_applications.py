"""test_applications.py — application submission, tracking, PDF generation."""
import pytest
from unittest.mock import MagicMock
from conftest import MOCK_APPLICATION


class TestApplicationSubmit:
    def test_submit_requires_confirmed_true(self, client, mock_db):
        """Unconfirmed submissions are rejected with 400."""
        r = client.post("/api/applications/submit", json={
            "session_id": "test-app-001",
            "scheme_id": "00000000-0000-0000-0000-000000000001",
            "form_data": {"name": "Ramesh Kumar"},
            "confirmed": False,
        })
        assert r.status_code == 400

    def test_submit_confirmed_returns_reference(self, client, mock_db, monkeypatch):
        """Confirmed submission returns reference number and expected dates."""
        # Patch get_db at the source module (supabase_db), not at the router
        from app.services import supabase_db
        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = \
            MagicMock(data=[{
                "id": "00000000-0000-0000-0000-000000000001",
                "name_english": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
                "acronym": "PM-KISAN", "portal_url": "https://pmkisan.gov.in/"
            }])
        monkeypatch.setattr(supabase_db, "get_db", lambda: mock_supabase)

        # Mock PDF generation  
        from app.services import pdf_generator
        monkeypatch.setattr(pdf_generator, "generate_pdf", lambda *a, **k: b"%PDF-1.4")

        r = client.post("/api/applications/submit", json={
            "session_id": "test-app-002",
            "scheme_id": "00000000-0000-0000-0000-000000000001",
            "form_data": {"name": "Ramesh Kumar", "state": "uttar_pradesh"},
            "confirmed": True,
        })
        assert r.status_code == 200
        d = r.json()
        assert d["reference_number"].startswith("JAN-")
        assert d["status"] == "submitted"
        assert "expected_state_verify_date" in d

    def test_track_existing_application(self, client, mock_db):
        """Tracking a known reference number returns the application."""
        r = client.get("/api/applications/track/JAN-2026-00001")
        assert r.status_code == 200
        d = r.json()
        assert d["reference_number"] == "JAN-2026-00001"

    def test_track_missing_returns_404(self, client, monkeypatch):
        """Tracking an unknown reference number returns 404."""
        from app.services import supabase_db as db
        monkeypatch.setattr(db, "get_application", lambda ref: None)
        r = client.get("/api/applications/track/NONEXISTENT-REF")
        assert r.status_code == 404

    def test_session_applications(self, client, mock_db):
        """Session applications endpoint returns a list."""
        r = client.get("/api/applications/session/test-session")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestPDFGenerator:
    def test_calculate_pmy_contribution_table(self):
        """PM-KMY contribution table values match official government table."""
        from app.services.pdf_generator import calculate_pmy_contribution
        assert calculate_pmy_contribution(18) == 55
        assert calculate_pmy_contribution(29) == 100
        assert calculate_pmy_contribution(40) == 200

    def test_pmy_contribution_clamped_below_min(self):
        """Age below 18 is clamped to 18."""
        from app.services.pdf_generator import calculate_pmy_contribution
        assert calculate_pmy_contribution(17) == 55   # clamped to 18

    def test_pmy_contribution_clamped_above_max(self):
        """Age above 40 is clamped to 40."""
        from app.services.pdf_generator import calculate_pmy_contribution
        assert calculate_pmy_contribution(50) == 200  # clamped to 40
