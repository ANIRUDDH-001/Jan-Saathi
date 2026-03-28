"""Groq LLM service — chat state machine with 4-model fallback chain."""
import json, time
from groq import Groq
from app.config import get_settings

_s = get_settings()
_client = Groq(api_key=_s.groq_api_key)

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
    "intake": """You are Ved, a Hindi-first voice assistant helping rural Indian farmers 
discover government schemes. Agriculture is the ONLY domain.

TASK: Extract profile fields from the farmer's natural speech (Hinglish OK).
Return ONLY valid JSON. No markdown.

Profile fields to extract:
- state: Indian state name in English (e.g. "uttar_pradesh")
- occupation: always "farmer" for this app
- occupation_subtype: one of ["crop_farmer", "dairy_farmer", "livestock_farmer", "fisherman"]
- age: integer
- income: annual income in INR as integer  
- bpl: boolean (BPL card holder)
- gender: "male"/"female"/"other"
- category: "SC"/"ST"/"OBC"/"General"
- name: full name
- district: district name

Return: {"extracted": {"field": "value", ...}, "missing_threshold_fields": ["state","age",...], "next_question_hindi": "...", "next_question_in_language": "..."}

THRESHOLD FIELDS (must have all 3 to trigger matching): state, occupation_subtype, age
If all 3 collected → set "ready_to_match": true

""" + PLAIN_LANGUAGE_RULE,

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

def call_groq(messages: list, model_index: int = 0) -> str:
    """Call Groq with automatic fallback on 429."""
    if model_index >= len(MODELS):
        return '{"error": "All models exhausted"}'
    
    model = MODELS[model_index]
    try:
        response = _client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content
    except Exception as e:
        if "429" in str(e) or "rate" in str(e).lower():
            time.sleep(2)
            return call_groq(messages, model_index + 1)
        raise

def process_intake(message: str, profile: dict, language: str) -> dict:
    """Extract profile fields from user message."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["intake"]},
        {"role": "user", "content": f"Language detected: {language}\nCurrent profile: {json.dumps(profile)}\nUser said: {message}"}
    ]
    raw = call_groq(messages)
    return json.loads(raw)

def generate_gap_announcement(schemes: list, profile: dict, language: str) -> dict:
    """Generate spoken gap card announcement."""
    gap = sum(s.get("benefit_annual_inr", 0) for s in schemes if s.get("has_monetary_benefit"))
    top3 = sorted(schemes, key=lambda x: x.get("benefit_annual_inr", 0), reverse=True)[:3]
    top3_names = [f"{s.get('acronym') or s.get('name_english','')}: ₹{s.get('benefit_annual_inr',0):,}" for s in top3]
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["match"].format(language=language)},
        {"role": "user", "content": f"Gap: ₹{gap:,}/year. Top 3: {', '.join(top3_names)}. Profile: {json.dumps(profile)}"}
    ]
    raw = call_groq(messages)
    return json.loads(raw)

def generate_scheme_guidance(question: str, scheme: dict, language: str) -> dict:
    """Answer farmer's question about a specific scheme."""
    scheme_ctx = f"Name: {scheme.get('name_english')}\nBenefit: ₹{scheme.get('benefit_annual_inr',0):,}\nGuidance: {scheme.get('spoken_guidance','')}\nEligibility: {scheme.get('eligibility_summary','')}"
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["guide"].format(language=language, scheme_context=scheme_ctx)},
        {"role": "user", "content": question}
    ]
    raw = call_groq(messages)
    return json.loads(raw)

def process_form_fill(message: str, form_data: dict, missing_fields: list, language: str) -> dict:
    """Process form fill conversation turn."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["form_fill"].format(
            form_data=json.dumps(form_data),
            missing_fields=missing_fields,
            language=language
        )},
        {"role": "user", "content": message}
    ]
    raw = call_groq(messages)
    return json.loads(raw)

def generate_goodbye_summary(session: dict, language: str) -> str:
    """Generate closing spoken summary."""
    prompt = f"""Generate a warm closing summary in {language} for this Jan Saathi session.
Session: schemes found={len(session.get('matched_scheme_ids',[]))}, gap=₹{session.get('gap_value',0):,}
Profile: {json.dumps(session.get('profile',{}))}
Return JSON: {{"summary_spoken": "3 part summary: what found, what to do next, farewell. Max 60 words total."}}
""" + PLAIN_LANGUAGE_RULE
    raw = call_groq([{"role": "user", "content": prompt}])
    return json.loads(raw).get("summary_spoken", "")

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
