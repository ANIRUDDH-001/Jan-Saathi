"""Pytest configuration and global mocking."""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

@pytest.fixture(autouse=True)
def mock_all_external_services():
    """Mock out all external service calls for tests so we don't hit real APIs."""
    
    # Supabase mocks
    with patch("app.services.supabase_db.get_or_create_session", return_value={"session_id": "test", "profile": {}}) as m_sess, \
         patch("app.services.supabase_db.update_session", return_value=None), \
         patch("app.services.supabase_db.save_anonymous_query", return_value=None), \
         patch("app.services.supabase_db.match_schemes", return_value=[{"scheme_id": "uuid-123", "name_english": "Test Scheme", "has_monetary_benefit": True, "benefit_annual_inr": 6000}]), \
         patch("app.services.supabase_db.create_application", return_value={"reference_number": "JAN-2026-00001", "status": "submitted", "submitted_at": "2026-01-01"}), \
         patch("app.services.supabase_db.get_application", return_value={"reference_number": "JAN-2026-00001"}), \
         patch("app.services.supabase_db.get_admin_stats", return_value={"total_sessions": 100}), \
         patch("app.services.supabase_db.get_db") as m_get_db:
             
        # Configure get_db mock for direct table querying used in schemes/applications etc.
        db_client = MagicMock()
        db_client.table().select().eq().execute.return_value = MagicMock(data=[{"id": "uuid-123", "acronym": "TEST", "name_english": "Test Scheme"}])
        db_client.table().select().eq().limit().execute.return_value = MagicMock(data=[{"id": "uuid-123"}])
        db_client.rpc().execute.return_value = MagicMock(data=[{"total": 100}])
        m_get_db.return_value = db_client
        
        # Groq mocks
        with patch("app.services.groq_llm.process_intake", return_value={"extracted": {"state": "uttar_pradesh", "occupation_subtype": "crop_farmer", "age": 45}, "ready_to_match": True, "next_question_in_language": "Aap kahan se hain?"}), \
             patch("app.services.groq_llm.generate_gap_announcement", return_value={"gap_announcement": "Hi", "top_3_summary": "Top 3"}), \
             patch("app.services.groq_llm.classify_goodbye_intent", return_value=False) as m_goodbye, \
             patch("app.services.groq_llm.generate_goodbye_summary", return_value="Goodbye!"):
            
            # Special logic for goodbye intent in test_chat
            def goodbye_side_effect(msg):
                return "dhanyawaad" in msg.lower() or "bye" in msg.lower()
            m_goodbye.side_effect = goodbye_side_effect

            # Cohere mock
            with patch("app.services.cohere_embed.embed_query", return_value=[0.1]*1024):
                
                # Sarvam mocks (Async)
                with patch("app.services.sarvam.transcribe", new_callable=AsyncMock, return_value={"transcript": "Test transcript", "language_code": "hi-IN", "language_short": "hi", "confidence": 0.99}), \
                     patch("app.services.sarvam.text_to_speech", new_callable=AsyncMock, return_value="base64audio"):
                     
                    yield
