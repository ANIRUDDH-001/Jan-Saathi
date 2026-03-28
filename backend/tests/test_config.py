"""test_config.py — settings and configuration validation."""
import pytest


class TestSettings:
    def test_settings_singleton(self):
        """get_settings returns the same object each time (cached)."""
        from app.config import get_settings
        s1 = get_settings()
        s2 = get_settings()
        assert s1 is s2

    def test_settings_has_required_fields(self):
        """Settings object has all required API key fields."""
        from app.config import get_settings
        s = get_settings()
        required = ["groq_api_key", "cohere_api_key", "sarvam_api_key",
                     "supabase_url", "supabase_service_role_key"]
        for field in required:
            assert hasattr(s, field), f"Missing setting: {field}"

    def test_jwt_secret_defined(self):
        """JWT_SECRET must be set (even if test value)."""
        from app.config import get_settings
        s = get_settings()
        assert hasattr(s, "jwt_secret") or hasattr(s, "JWT_SECRET")

    def test_frontend_url_defined(self):
        """FRONTEND_URL must be defined for CORS."""
        from app.config import get_settings
        s = get_settings()
        assert hasattr(s, "frontend_url")


class TestModels:
    def test_chat_request_validation(self):
        """ChatRequest model validates required fields."""
        from app.models import ChatRequest
        req = ChatRequest(message="hello", session_id="s1", language="hi")
        assert req.message == "hello"
        assert req.session_id == "s1"

    def test_chat_request_empty_message_allowed(self):
        """Empty message should be allowed (validated at router level)."""
        from app.models import ChatRequest
        req = ChatRequest(message="", session_id="s1", language="hi")
        assert req.message == ""
