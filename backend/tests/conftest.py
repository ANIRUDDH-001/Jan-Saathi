"""conftest.py — shared fixtures for all backend tests."""
import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ── Shared mock data ──────────────────────────────────────────────────────────
MOCK_SCHEMES = [{
    "scheme_id": "pradhan-mantri-kisan-samman-nidhi-pm-kisan-nationa",
    "name_english": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    "name_hindi":   "प्रधानमंत्री किसान सम्मान निधि",
    "acronym": "PM-KISAN", "level": "central", "state": "national",
    "ministry": "Ministry of Agriculture and Farmers Welfare",
    "has_monetary_benefit": True, "benefit_annual_inr": 6000,
    "eligibility_summary": "All landholding farmers eligible.",
    "spoken_content": {"hi": {"gap_announcement": "PM-KISAN से साल में ₹6,000 मिलेंगे।"}},
    "form_field_mapping": {"form_name": "PM-KISAN-REG-2019", "fields": [
        {"form_field_label": "Name of Farmer", "profile_field": "name",
         "required": True, "shubh_question_hindi": "आपका पूरा नाम क्या है?"},
    ]},
    "portal_url": "https://pmkisan.gov.in/", "helpline_number": "155261",
    "similarity": 0.92, "demo_ready": True,
}]

MOCK_APPLICATION = {
    "id": "00000000-0000-0000-0000-000000000001",
    "reference_number": "JAN-2026-00001",
    "session_id": "test-session",
    "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    "status": "submitted",
    "submitted_at": "2026-03-28T10:00:00",
    "expected_state_verify_date": "2026-04-04",
    "expected_central_date": "2026-04-18",
    "expected_benefit_date": "2026-05-12",
    "form_data": {"name": "Ramesh Kumar"},
    "status_history": [{"from_status": None, "to_status": "submitted",
                        "changed_at": "2026-03-28T10:00:00"}],
}

MOCK_SESSION = {
    "session_id": "test-session", "chat_state": "intake", "language": "hi",
    "profile": {}, "matched_scheme_ids": [], "gap_value": 0,
    "form_data": {}, "active_form_scheme": None, "last_session_summary": {},
    "user_id": None,
}

MOCK_SESSION_MATCH = {
    **MOCK_SESSION,
    "chat_state": "match",
    "profile": {"state": "uttar_pradesh", "occupation_subtype": "crop_farmer", "age": 45},
    "matched_scheme_ids": ["pradhan-mantri-kisan-samman-nidhi-pm-kisan-nationa"],
    "gap_value": 6000,
}


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


@pytest.fixture
def mock_db(monkeypatch):
    """Mock all Supabase calls so tests run without live DB."""
    from app.services import supabase_db as db_mod

    monkeypatch.setattr(db_mod, "get_or_create_session", lambda sid: {**MOCK_SESSION, "session_id": sid})
    monkeypatch.setattr(db_mod, "update_session", lambda *a, **k: None)
    monkeypatch.setattr(db_mod, "save_anonymous_query", lambda *a, **k: None)
    monkeypatch.setattr(db_mod, "match_schemes", lambda *a, **k: MOCK_SCHEMES)
    monkeypatch.setattr(db_mod, "get_scheme_by_slug", lambda slug: MOCK_SCHEMES[0])
    monkeypatch.setattr(db_mod, "get_scheme_by_db_id", lambda id: MOCK_SCHEMES[0])
    monkeypatch.setattr(db_mod, "create_application", lambda **k: MOCK_APPLICATION)
    monkeypatch.setattr(db_mod, "get_application", lambda ref: MOCK_APPLICATION)
    monkeypatch.setattr(db_mod, "get_application_detail", lambda ref: MOCK_APPLICATION)
    monkeypatch.setattr(db_mod, "get_session_applications", lambda sid: [MOCK_APPLICATION])
    monkeypatch.setattr(db_mod, "get_session", lambda sid: MOCK_SESSION)
    monkeypatch.setattr(db_mod, "get_admin_stats", lambda: {
        "total_sessions": 42, "total_applications": 7, "total_schemes": 51})
    return db_mod


@pytest.fixture
def mock_llm(monkeypatch):
    """Mock Groq LLM calls — all async to match AsyncGroq implementation."""
    from app.services import groq_llm as llm

    async def _process_intake(*a, **k):
        return {
            "extracted": {"state": "uttar_pradesh", "occupation_subtype": "crop_farmer", "age": 45},
            "threshold_ready": True,
            "next_question_hi": "Aap kahan se hain?",
            "next_question_in_language": "Aap kahan se hain?",
            "ready_to_match": True,
        }

    async def _generate_gap(*a, **k):
        return {
            "gap_announcement": "Aapko ₹6,000 per saal mil sakta hai.",
            "top_3_summary": "PM-KISAN se ₹6,000.",
            "top3_spoken": "PM-KISAN se ₹6,000.",
        }

    async def _generate_guidance(*a, **k):
        return {
            "reply": "PM-KISAN ke liye CSC jaana hai. Aadhaar aur passbook lekar jaana.",
            "suggest_form_fill": False, "form_fill_prompt": None, "follow_up": None,
        }

    async def _generate_goodbye(*a, **k):
        return "Aaj bahut kuch hua. Kal CSC jaana."

    monkeypatch.setattr(llm, "process_intake", _process_intake)
    monkeypatch.setattr(llm, "generate_gap_announcement", _generate_gap)
    monkeypatch.setattr(llm, "generate_scheme_guidance", _generate_guidance)
    monkeypatch.setattr(llm, "generate_goodbye_summary", _generate_goodbye)
    monkeypatch.setattr(llm, "classify_goodbye_intent", lambda msg: "bas" in msg.lower() or "bye" in msg.lower())
    monkeypatch.setattr(llm, "is_goodbye", lambda msg: "bas" in msg.lower() or "bye" in msg.lower())
    return llm


@pytest.fixture
def mock_embed(monkeypatch):
    """Mock Cohere embed — all async to match AsyncClientV2 implementation."""
    from app.services import cohere_embed as emb

    async def _embed_query(text):
        return [0.1] * 1024

    async def _embed_profile_query(profile, language="hi"):
        return [0.1] * 1024

    monkeypatch.setattr(emb, "embed_query", _embed_query)
    monkeypatch.setattr(emb, "embed_profile_query", _embed_profile_query)
    return emb


@pytest.fixture
def mock_sarvam(monkeypatch):
    """Mock Sarvam TTS — must be async, returns empty string."""
    from app.services import sarvam

    async def fake_text_to_speech(text, lang="hi-IN"):
        return "UklGRiQAAABXQVZFZm10IBAAAA=="  # tiny valid WAV b64

    async def fake_transcribe(audio, language_code="hi-IN"):
        return {"transcript": "Main UP se hoon kisan hoon 45 saal",
                "language_code": "hi-IN", "language_short": "hi"}

    monkeypatch.setattr(sarvam, "text_to_speech", fake_text_to_speech)
    monkeypatch.setattr(sarvam, "transcribe", fake_transcribe)
    return sarvam
