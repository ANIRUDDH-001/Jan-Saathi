"""Groq LLM service — chat state machine with 4-model fallback chain (async)."""
import asyncio
import json
import logging
from groq import AsyncGroq
from groq import RateLimitError, APIError
from app.config import get_settings

logger = logging.getLogger(__name__)
_s = get_settings()

_client = AsyncGroq(api_key=_s.groq_api_key)

MODELS = [
    _s.groq_primary_model,
    _s.groq_fallback_1,
    _s.groq_fallback_2,
    _s.groq_fallback_3,
]

PLAIN_LANGUAGE_RULE = """
PLAIN LANGUAGE (mandatory):
- Max 15 words per sentence
- Active voice, concrete actions
- Hindi: simple vocabulary a farmer understands
- No: submission, verification, disbursement, beneficiary, documentation
- Write as if explaining to your farmer grandfather
"""
PLAIN = PLAIN_LANGUAGE_RULE

SYSTEM_PROMPTS = {
    "extract_fields": """You are a data extraction assistant for Jan Saathi, an Indian government scheme finder.

TASK: Extract profile fields from the farmer's message. Return ONLY valid JSON, no markdown.

Fields to extract (only include if clearly mentioned — never guess):
- state: Indian state in snake_case. City/district → infer state.
  Examples: "odisha", "uttar_pradesh", "rajasthan", "maharashtra", "gujarat", "west_bengal"
  City mapping: saharanpur→uttar_pradesh, pune→maharashtra, surat→gujarat, patna→bihar
- occupation_subtype: "crop_farmer" (default), "dairy_farmer", "livestock_farmer", "fisherman"
- age: integer. Parse "21 saal", "21 sal", "21 years", "21 साल", plain "21" → 21
- income: annual INR as integer. "50 hazaar"→50000, "1 lakh"→100000, "less than 10000"→10000
- bpl: true/false (BPL card)
- gender: "male" or "female"
- category: "SC", "ST", "OBC", or "General"

Return format (omit fields not mentioned):
{"state": null, "occupation_subtype": null, "age": null, "income": null, "bpl": null, "gender": null, "category": null}

RULES:
- age must be 10–100. If user says "21" or "21 saal" → age: 21 (NOT null)
- If user says just a state name like "odisha" → state: "odisha"
- Return null for anything not clearly stated
""",

    "match": """You are Ved. The farmer's profile has been matched to schemes.
Generate a spoken gap announcement and brief scheme introduction.
Language: {language}
Return ONLY valid JSON.
{"gap_announcement": "Spoken sentence announcing total benefit", "top_3_summary": "2-3 sentences about top 3 schemes by benefit"}
""" + PLAIN_LANGUAGE_RULE,

    "guide": """You are Ved, guiding a farmer through a specific scheme.
Answer their question about the scheme in plain language.
Language: {language}
Scheme context: {scheme_context}
Return ONLY valid JSON.
{"reply": "Your spoken answer. Max 50 words. Plain language.", "follow_up": "Optional follow-up question or null"}
""" + PLAIN_LANGUAGE_RULE,

    "form_fill": """You are Ved, helping fill a government form for a farmer.
Current form data: {form_data}
Missing fields: {missing_fields}
Language: {language}
Return ONLY valid JSON.
{"reply": "What to say next (confirmation/question)", "form_updates": {"field": "value"}, "form_complete": false, "next_field": "field_name or null"}
""" + PLAIN_LANGUAGE_RULE,
}


async def call_groq(messages: list, model_index: int = 0) -> str:
    """Call Groq with automatic fallback on rate limit."""
    if model_index >= len(MODELS):
        return '{"error": "All models exhausted"}'

    model = MODELS[model_index]
    try:
        response = await _client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content
    except RateLimitError:
        logger.warning(f"Rate limit on {model}, trying next model")
        await asyncio.sleep(1)
        return await call_groq(messages, model_index + 1)
    except APIError as e:
        logger.error(f"API error from {model}: {e}")
        if model_index + 1 < len(MODELS):
            return await call_groq(messages, model_index + 1)
        raise
    except Exception as e:
        if "429" in str(e) or "rate" in str(e).lower():
            await asyncio.sleep(1)
            return await call_groq(messages, model_index + 1)
        raise


def _safe_json(raw: str, fallback: dict) -> dict:
    """Parse JSON from LLM response, returning fallback on any parse error."""
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError, ValueError):
        # Strip common LLM decoration (```json ... ```)
        stripped = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        try:
            return json.loads(stripped)
        except Exception:
            logger.error(f"Groq returned unparseable JSON: {raw[:300]}")
            return fallback


async def extract_all_fields(message: str, profile: dict, language: str) -> dict:
    """Extract all possible profile fields from a user message.
    Returns a flat dict of extracted fields (None for anything not mentioned).
    This only EXTRACTS — question generation is handled by chat.py deterministically.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["extract_fields"]},
        {"role": "user", "content": f"User message: {message}\nAlready known: {json.dumps({k: v for k, v in profile.items() if v is not None})}"}
    ]
    raw = await call_groq(messages)
    result = _safe_json(raw, {})
    # Return only non-null values that differ from existing profile
    return {k: v for k, v in result.items() if v is not None}


async def generate_gap_announcement(schemes: list, profile: dict, language: str) -> dict:
    """Generate spoken gap card announcement."""
    gap = sum(s.get("benefit_annual_inr", 0) for s in schemes if s.get("has_monetary_benefit"))
    top3 = sorted(schemes, key=lambda x: x.get("benefit_annual_inr", 0), reverse=True)[:3]
    top3_names = [f"{s.get('acronym') or s.get('name_english','')}: ₹{s.get('benefit_annual_inr',0):,}" for s in top3]

    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["match"].format(language=language)},
        {"role": "user", "content": f"Gap: ₹{gap:,}/year. Top 3: {', '.join(top3_names)}. Profile: {json.dumps(profile)}"}
    ]
    raw = await call_groq(messages)
    return _safe_json(raw, {
        "gap_announcement": f"Aapke liye ₹{gap:,} tak ke sarkari yojanayen mili hain.",
        "top_3_summary": ", ".join(top3_names),
    })


async def generate_scheme_guidance(question: str, scheme: dict, language: str) -> dict:
    """Answer farmer's question about a specific scheme."""
    scheme_ctx = f"Name: {scheme.get('name_english')}\nBenefit: ₹{scheme.get('benefit_annual_inr',0):,}\nGuidance: {scheme.get('spoken_guidance','')}\nEligibility: {scheme.get('eligibility_summary','')}"
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["guide"].format(language=language, scheme_context=scheme_ctx)},
        {"role": "user", "content": question}
    ]
    raw = await call_groq(messages)
    return _safe_json(raw, {"reply": "Mujhe abhi ye jaankari nahi mil rahi. Kripya baad mein poochein."})


async def process_form_fill(message: str, form_data: dict, missing_fields: list, language: str) -> dict:
    """Process form fill conversation turn."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["form_fill"].format(
            form_data=json.dumps(form_data),
            missing_fields=missing_fields,
            language=language
        )},
        {"role": "user", "content": message}
    ]
    raw = await call_groq(messages)
    return _safe_json(raw, {"reply": "Samajh nahi aaya. Kripya dobara batayein.", "form_updates": {}, "form_complete": False})


async def generate_goodbye_summary(session: dict, language: str) -> str:
    """Generate closing spoken summary."""
    prompt = f"""Generate a warm closing summary in {language} for this Jan Saathi session.
Session: schemes found={len(session.get('matched_scheme_ids',[]))}, gap=₹{session.get('gap_value',0):,}
Profile: {json.dumps(session.get('profile',{}))}
Return JSON: {{"summary_spoken": "3 part summary: what found, what to do next, farewell. Max 60 words total."}}
""" + PLAIN_LANGUAGE_RULE
    raw = await call_groq([{"role": "user", "content": prompt}])
    result = _safe_json(raw, {"summary_spoken": "Dhanyawaad! Jan Saathi ne aapki madad ki. Milte hain phir."})
    return result.get("summary_spoken", "Dhanyawaad! Jan Saathi ne aapki madad ki.")


def is_goodbye(message: str) -> bool:
    """Check if message is a goodbye/end intent.
    IMPORTANT: Only match explicit farewell phrases, NOT common conversational words.
    "ठीक है" (OK), "बस" (just/enough) are common mid-conversation and must NOT trigger goodbye.
    """
    GOODBYE_KEYWORDS = [
        "dhanyawaad", "shukriya", "alvida",
        "band karo", "ok bye", "bye bye",
        "धन्यवाद", "शुक्रिया", "अलविदा", "बंद करो",
        "khatam karo", "band kar",
    ]
    # Exact-match short phrases to avoid false positives
    GOODBYE_EXACT = {"bye", "goodbye", "bas karo", "theek hai bas", "ok bye"}
    msg_lower = message.lower().strip()
    if msg_lower in GOODBYE_EXACT:
        return True
    return any(kw in msg_lower for kw in GOODBYE_KEYWORDS)


def classify_goodbye_intent(message: str) -> bool:
    return is_goodbye(message)


async def health_check() -> dict:
    """Verify Groq is reachable."""
    try:
        await _client.chat.completions.create(
            model=MODELS[0],
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5,
        )
        return {"status": "ok", "model": MODELS[0]}
    except Exception as e:
        return {"status": "error", "error": str(e)}
