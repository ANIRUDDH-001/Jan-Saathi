"""test_chat.py — chat state machine unit tests."""
import pytest


class TestIntakeState:
    def test_intake_returns_question(self, client, mock_db, mock_llm, mock_embed, mock_sarvam, monkeypatch):
        """When threshold not met, reply contains the follow-up question."""
        # Override extract_all_fields to return only 1 field (threshold not met)
        from app.services import groq_llm as llm

        async def _partial_extract(*a, **k):
            return {"state": "uttar_pradesh"}

        monkeypatch.setattr(llm, "extract_all_fields", _partial_extract)
        r = client.post("/api/chat", json={
            "message": "Main UP se hoon",
            "session_id": "test-intake-001",
            "language": "hi"
        })
        assert r.status_code == 200
        d = r.json()
        assert d["state"] == "intake"
        assert len(d["reply"]) > 0

    def test_intake_transitions_to_match_when_threshold_met(
            self, client, mock_db, mock_llm, mock_embed, mock_sarvam):
        """When all 3 threshold fields collected, state transitions to match."""
        r = client.post("/api/chat", json={
            "message": "Main UP se hoon, kisan hoon, 45 saal",
            "session_id": "test-threshold-001",
            "language": "hi"
        })
        assert r.status_code == 200
        d = r.json()
        assert d["state"] == "match"
        assert d["gap_value"] == 6000
        assert len(d["schemes"]) == 1
        assert d["schemes"][0]["acronym"] == "PM-KISAN"

    def test_language_passed_through(self, client, mock_db, mock_llm, mock_embed, mock_sarvam):
        """Language field in response matches the request language."""
        r = client.post("/api/chat", json={
            "message": "আমি UP থেকে কৃষক",
            "session_id": "test-lang-001",
            "language": "bn"
        })
        assert r.status_code == 200
        assert r.json()["language"] == "bn"



class TestGoodbye:
    def test_goodbye_keyword_triggers_summary(
            self, client, mock_db, mock_llm, mock_sarvam, mock_embed):
        r = client.post("/api/chat", json={
            "message": "dhanyawaad bas",
            "session_id": "test-goodbye-001",
            "language": "hi"
        })
        assert r.status_code == 200
        d = r.json()
        assert d["state"] == "goodbye"
        assert len(d["reply"]) > 10

    @pytest.mark.parametrize("msg", ["bye", "bas", "ok bye", "bye bye"])
    def test_various_goodbye_triggers(self, client, mock_db, mock_llm, mock_sarvam, mock_embed, msg):
        """All goodbye keywords should trigger goodbye state."""
        r = client.post("/api/chat", json={
            "message": msg, "session_id": f"test-bye-{msg[:3]}", "language": "hi"
        })
        assert r.status_code == 200
        assert r.json()["state"] == "goodbye"
