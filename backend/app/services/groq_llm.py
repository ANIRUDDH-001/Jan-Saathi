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
    "intake": """You are Shubh, a voice assistant helping rural Indian farmers discover government schemes.

TASK: Extract profile fields from the farmer's natural speech (Hinglish/Hindi/regional OK).
Return ONLY valid JSON with NO markdown or code fences.

Profile fields to extract (include only if mentioned by user):
- state: Indian state in English snake_case (e.g. "uttar_pradesh", "rajasthan")
- occupation: always "farmer"
- occupation_subtype: one of ["crop_farmer","dairy_farmer","livestock_farmer","fisherman"] — default "crop_farmer" if unclear
- age: integer years
- income: annual income in INR as INTEGER only — if user says "less than 10000" extract 10000
- bpl: boolean (has BPL card)
- gender: "male"/"female"/"other"
- category: "SC"/"ST"/"OBC"/"General"
- name: full name
- district: district name

THRESHOLD FIELDS (need all 3): state, occupation_subtype, age

LANGUAGE RULE (CRITICAL): The user's current language is provided as "Language: {code}".
- "next_question_in_language" MUST be spoken in THAT language (e.g. hi=Hindi, en=English, ta=Tamil)
- If language is "hi", ask in Hindi/Hinglish
- If language is "en", ask in English
- next_question_hindi is ALWAYS in Hindi regardless

Return JSON format:
{"extracted": {"field": value, ...}, "missing_threshold_fields": ["state","age",...], "next_question_hindi": "Hindi mein poochho", "next_question_in_language": "In the user's language"}

""" + PLAIN_LANGUAGE_RULE,

    "match": """You are Shubh. The farmer's profile has been matched to schemes.
Generate a spoken gap announcement and brief scheme introduction.
Language: {language}
Return ONLY valid JSON.
{"gap_announcement": "Spoken sentence announcing total benefit", "top_3_summary": "2-3 sentences about top 3 schemes by benefit"}
""" + PLAIN_LANGUAGE_RULE,

    "guide": """You are Shubh, guiding a farmer through a specific scheme.
Answer their question about the scheme in plain language.
Language: {language}
Scheme context: {scheme_context}
Return ONLY valid JSON.
{"reply": "Your spoken answer. Max 50 words. Plain language.", "follow_up": "Optional follow-up question or null"}
""" + PLAIN_LANGUAGE_RULE,

    "form_fill": """You are Shubh, helping fill a government form for a farmer.
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


async def process_intake(message: str, profile: dict, language: str) -> dict:
    """Extract profile fields from user message."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["intake"]},
        {"role": "user", "content": f"Language: {language}\nCurrent profile: {json.dumps(profile)}\nUser said: {message}"}
    ]
    raw = await call_groq(messages)
    return _safe_json(raw, {
        "extracted": {},
        "next_question_hindi": "Kripya dobara batayein.",
        "next_question_in_language": "Kripya dobara batayein." if language == "hi" else "Please repeat that.",
    })


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
    """Check if message is a goodbye/end intent."""
    GOODBYE_KEYWORDS = [
        "dhanyawaad", "shukriya", "theek hai bas", "bye", "alvida",
        "bas", "khatam", "band karo", "thank you", "thanks", "ok bye",
        "बस", "धन्यवाद", "शुक्रिया", "ठीक है", "बंद करो"
    ]
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in GOODBYE_KEYWORDS)


def classify_goodbye_intent(message: str) -> bool:
    return is_goodbye(message)


async def health_check() -> dict:
    """Verify Groq is reachable."""
    try:
        r = await _client.chat.completions.create(
            model=MODELS[0],
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5,
        )
        return {"status": "ok", "model": MODELS[0]}
    except Exception as e:
        return {"status": "error", "error": str(e)}
