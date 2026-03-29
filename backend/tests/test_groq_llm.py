"""test_groq_llm.py — unit tests for groq_llm service logic."""
import pytest


class TestIsGoodbye:
    """Tests for the is_goodbye / classify_goodbye_intent function."""

    @pytest.mark.parametrize("msg,expected", [
        ("dhanyawaad", True),
        ("bye", True),
        ("bas karo", True),
        ("ok bye", True),
        ("theek hai bas", True),
        ("shukriya", True),
        ("धन्यवाद", True),
        ("बस", False),  # Standalone बस is NOT a goodbye trigger by design
        ("Main UP se hoon", False),
        ("kisan PM-KISAN", False),
        ("mujhe scheme chahiye", False),
    ])
    def test_goodbye_detection(self, msg, expected):
        """is_goodbye correctly detects (or rejects) goodbye messages."""
        from app.services.groq_llm import is_goodbye
        assert is_goodbye(msg) == expected

    def test_classify_goodbye_intent_alias(self):
        """classify_goodbye_intent is an alias of is_goodbye."""
        from app.services.groq_llm import is_goodbye, classify_goodbye_intent
        assert is_goodbye("bye") == classify_goodbye_intent("bye")
        assert is_goodbye("kisan") == classify_goodbye_intent("kisan")


class TestModelChain:
    def test_models_list_has_at_least_3(self):
        """MODELS fallback chain has at least 3 entries."""
        from app.services.groq_llm import MODELS
        assert len(MODELS) >= 3

    def test_plain_language_rule_defined(self):
        """PLAIN_LANGUAGE_RULE and PLAIN alias are both defined and non-empty."""
        from app.services.groq_llm import PLAIN_LANGUAGE_RULE, PLAIN
        assert "15" in PLAIN_LANGUAGE_RULE       # Max 15 words rule
        assert "words" in PLAIN_LANGUAGE_RULE.lower()
        assert PLAIN == PLAIN_LANGUAGE_RULE       # Alias must match

    def test_system_prompts_all_states_defined(self):
        """SYSTEM_PROMPTS contains all 4 state/task keys."""
        from app.services.groq_llm import SYSTEM_PROMPTS
        for state in ("extract_fields", "match", "guide", "form_fill"):
            assert state in SYSTEM_PROMPTS, f"Missing prompt for state: {state}"
            assert len(SYSTEM_PROMPTS[state]) > 50

    def test_format_strings_dont_raise_key_error(self):
        """Calling .format() on prompts that use it must not raise KeyError.
        Unescaped JSON braces like {'key': val} are misread as format placeholders."""
        from app.services.groq_llm import SYSTEM_PROMPTS
        import json
        # match: only {language} placeholder
        rendered = SYSTEM_PROMPTS["match"].format(language="hi")
        assert "gap_announcement" in rendered

        # guide: {language} and {scheme_context}
        rendered = SYSTEM_PROMPTS["guide"].format(language="hi", scheme_context="test")
        assert "reply" in rendered

        # form_fill: {form_data}, {missing_fields}, {language}
        rendered = SYSTEM_PROMPTS["form_fill"].format(
            form_data=json.dumps({}), missing_fields=["name"], language="hi"
        )
        assert "form_updates" in rendered


class TestPDFGenerator:
    def test_generate_pdf_falls_back_for_unknown_template(self):
        """generate_pdf returns clean PDF bytes for unknown scheme (never raises)."""
        from app.services.pdf_generator import generate_pdf
        result = generate_pdf("NONEXISTENT", {"name": "Test"})
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result[:5] == b"%PDF-"

    def test_calculate_pmy_full_table(self):
        """calculate_pmy_contribution matches the official government table at key ages."""
        from app.services.pdf_generator import calculate_pmy_contribution
        table = {18: 55, 19: 58, 25: 80, 29: 100, 30: 105, 35: 150, 40: 200}
        for age, expected in table.items():
            assert calculate_pmy_contribution(age) == expected, f"Failed at age {age}"
