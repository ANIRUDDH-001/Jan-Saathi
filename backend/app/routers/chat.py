"""Chat router — 4-state machine: intake → match → guide → form_fill.

Intake uses a deterministic question queue (no LLM for question selection).
Age/income extracted via regex first, LLM used only for state/category.
"""
import json
import re
import logging
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)
from app.models import ChatRequest, ChatResponse
from app.services import supabase_db as db
from app.services import groq_llm as llm
from app.services import cohere_embed as embed
from app.services import sarvam
from app.config import get_settings
from app.limiter import limiter

router = APIRouter()

LANG_TO_SARVAM = {
    "hi": "hi-IN", "bn": "bn-IN", "ta": "ta-IN", "te": "te-IN",
    "gu": "gu-IN", "kn": "kn-IN", "ml": "ml-IN", "mr": "mr-IN",
    "pa": "pa-IN", "od": "od-IN", "en": "en-IN"
}

# ── Structured intake question bank ──────────────────────────────────────────
# These are asked in this exact order. LLM is NOT used to choose what to ask.

INTAKE_ORDER = ["state", "age", "income", "category", "bpl", "gender"]
THRESHOLD_FIELDS = {"state", "occupation_subtype", "age"}  # must have all 3 to trigger matching

INTAKE_QUESTIONS = {
    "hi": {
        "state":    "आप किस राज्य से हैं?",
        "age":      "आपकी उम्र कितनी है?",
        "income":   "आपकी सालाना कमाई कितनी है? (रुपए में बताइए)",
        "category": "आप SC, ST, OBC या General श्रेणी में हैं?",
        "bpl":      "क्या आपके पास BPL कार्ड है?",
        "gender":   "आप पुरुष हैं या महिला?",
    },
    "en": {
        "state":    "Which state are you from?",
        "age":      "What is your age (in years)?",
        "income":   "What is your annual income (in rupees)?",
        "category": "Are you SC, ST, OBC or General category?",
        "bpl":      "Do you have a BPL card? (yes/no)",
        "gender":   "Are you male or female?",
    },
    "od": {
        "state":    "ଆପଣ କେଉଁ ରାଜ୍ୟରୁ ଆସୁଛନ୍ତି?",
        "age":      "ଆପଣଙ୍କ ବୟସ କେତେ?",
        "income":   "ଆପଣଙ୍କ ବାର୍ଷିକ ଆୟ କେତେ?",
        "category": "ଆପଣ SC, ST, OBC ବା General?",
        "bpl":      "ଆପଣଙ୍କ ପାଖରେ BPL କାର୍ଡ ଅଛି କି?",
        "gender":   "ଆପଣ ପୁରୁଷ ନା ମହିଳା?",
    },
}

INTAKE_RETRY = {
    "hi": {
        "state":    "कृपया राज्य का नाम बताइए, जैसे ओडिशा, राजस्थान या उत्तर प्रदेश।",
        "age":      "कृपया अपनी उम्र सिर्फ एक संख्या में बताइए, जैसे 25 या 30।",
        "income":   "सालाना कमाई रुपए में बताइए, जैसे 50000 या 1 लाख।",
        "category": "SC, ST, OBC या General — कौन सी श्रेणी है?",
        "bpl":      "BPL कार्ड है तो 'हाँ' कहिए, नहीं है तो 'नहीं' कहिए।",
        "gender":   "'पुरुष' या 'महिला' — कौन से हैं आप?",
    },
    "en": {
        "state":    "Please tell your state name, e.g. Odisha, Rajasthan, Uttar Pradesh.",
        "age":      "Please say your age as a number, e.g. 25.",
        "income":   "Annual income in rupees, e.g. 50000 or 1 lakh.",
        "category": "Which category — SC, ST, OBC or General?",
        "bpl":      "Do you have BPL card — yes or no?",
        "gender":   "Are you male or female?",
    },
}


def _get_q(field: str, language: str, retry: bool = False) -> str:
    """Return the question (or retry message) for a field in the correct language."""
    bank = INTAKE_RETRY if retry else INTAKE_QUESTIONS
    lang = language if language in bank else "hi"
    return bank[lang].get(field, (INTAKE_RETRY if retry else INTAKE_QUESTIONS)["hi"][field])


def _next_missing_field(profile: dict) -> Optional[str]:
    """Return the next field to ask about (first one missing from INTAKE_ORDER)."""
    for field in INTAKE_ORDER:
        val = profile.get(field)
        if val is None or val == "":
            return field
    return None


# ── Regex extractors (faster and more reliable than LLM for numbers) ──────────

def _extract_age(message: str) -> Optional[int]:
    """Extract age from message using regex. Returns None if not found."""
    # Handle written forms: "21 saal", "21 sal", "21 years", "21 साल", plain "21"
    nums = re.findall(r'\b(\d{1,3})\b', message)
    for n in nums:
        age = int(n)
        if 10 <= age <= 100:
            return age
    return None


def _extract_income(message: str) -> Optional[int]:
    """Extract annual income from message using regex."""
    msg = message.lower().replace(',', '').replace('₹', '')

    # "1.5 lakh", "1 lakh", "2 lakh"
    m = re.search(r'(\d+\.?\d*)\s*lakh', msg)
    if m:
        return int(float(m.group(1)) * 100000)

    # "50 hazaar", "50 हजार", "50 thousand"
    m = re.search(r'(\d+)\s*(hazaar|हजार|hajar|thousand)', msg)
    if m:
        return int(m.group(1)) * 1000

    # "less than 10000", "under 50000"
    m = re.search(r'(?:less than|under|below)\s*(\d{4,7})', msg)
    if m:
        return int(m.group(1))

    # Plain number ≥ 1000 (likely rupees)
    nums = re.findall(r'\b(\d{4,7})\b', msg)
    if nums:
        return int(nums[0])

    # 3-digit number could be "500" (hundreds)
    nums = re.findall(r'\b(\d{3})\b', msg)
    if nums:
        return int(nums[0]) * 100

    return None


def _extract_bpl(message: str) -> Optional[bool]:
    msg = message.lower()
    yes_words = ["yes", "haan", "ha", "han", "हाँ", "हां", "hai", "है", "hain", "haa"]
    no_words  = ["no", "nahi", "nahin", "nai", "नहीं", "nhi", "nahi hai", "nhin"]
    if any(w in msg for w in yes_words):
        return True
    if any(w in msg for w in no_words):
        return False
    return None


def _extract_gender(message: str) -> Optional[str]:
    msg = message.lower()
    if any(w in msg for w in ["male", "purush", "पुरुष", "man ", "aadmi", "आदमी", "ladka", "patni"]):
        return "male"
    if any(w in msg for w in ["female", "mahila", "महिला", "woman", "aurat", "औरत", "ladki"]):
        return "female"
    return None


def _extract_category(message: str) -> Optional[str]:
    msg_upper = message.upper()
    words = re.findall(r'\b\w+\b', msg_upper)
    if "SC" in words:
        return "SC"
    if "ST" in words:
        return "ST"
    if "OBC" in words:
        return "OBC"
    if any(w in words for w in ["GENERAL", "GEN", "SAAMANYA"]) or "सामान्य" in message:
        return "General"
    return None


def _extract_field_locally(field: str, message: str) -> Optional[object]:
    """Try to extract a field using pure regex/rules (no LLM). Returns None if unsure."""
    if field == "age":
        return _extract_age(message)
    if field == "income":
        return _extract_income(message)
    if field == "bpl":
        return _extract_bpl(message)
    if field == "gender":
        return _extract_gender(message)
    if field == "category":
        return _extract_category(message)
    return None  # state requires LLM


async def _tts(text: str, language: str) -> str:
    """Call TTS, return empty string on failure."""
    try:
        return await sarvam.text_to_speech(text, LANG_TO_SARVAM.get(language, "hi-IN"))
    except Exception:
        return ""


async def _do_scheme_matching(profile: dict, session_id: str, language: str):
    """Run scheme matching with Cohere vector search, falling back to simple SQL."""
    try:
        query_embedding = await embed.embed_profile_query(profile, language)
        matched = db.match_schemes(
            query_embedding=query_embedding,
            filter_state=profile.get("state"),
            filter_occupation=profile.get("occupation_subtype", "crop_farmer"),
            filter_income=profile.get("income") if isinstance(profile.get("income"), int) else None,
            filter_bpl=profile.get("bpl"),
            filter_age=profile.get("age") if isinstance(profile.get("age"), int) else None,
        )
        logger.info(f"Vector match returned {len(matched)} schemes for session {session_id}")
        return matched
    except Exception as e:
        logger.warning(f"Vector search failed ({e}), trying simple fallback for {session_id}")
        # Fallback: basic table scan without vector search
        try:
            matched = db.match_schemes_fallback(
                filter_state=profile.get("state"),
                filter_occupation=profile.get("occupation_subtype", "crop_farmer"),
            )
            logger.info(f"Fallback match returned {len(matched)} schemes for session {session_id}")
            return matched
        except Exception as e2:
            logger.error(f"Fallback also failed for {session_id}: {e2}", exc_info=True)
            return []


@router.post("", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(req: ChatRequest, request: Request):
    session = db.get_or_create_session(req.session_id)
    profile = session.get("profile", {})
    state = session.get("chat_state", "intake")
    language = req.language or session.get("language", "hi")

    # ── Goodbye check ─────────────────────────────────────────────────────────
    if llm.classify_goodbye_intent(req.message):
        summary = await llm.generate_goodbye_summary(session, language)
        db.update_session(req.session_id, {
            "last_session_summary": {
                "summary": summary,
                "gap_value": session.get("gap_value", 0),
                "schemes_count": len(session.get("matched_scheme_ids", [])),
                "timestamp": "now()"
            }
        })
        return ChatResponse(
            reply=summary, audio_b64=await _tts(summary, language),
            state="goodbye", profile=profile,
            session_id=req.session_id, language=language
        )

    # ── INTAKE STATE ──────────────────────────────────────────────────────────
    if state == "intake":

        # Always default occupation so we never ask about it
        if not profile.get("occupation"):
            profile["occupation"] = "farmer"
        if not profile.get("occupation_subtype"):
            profile["occupation_subtype"] = "crop_farmer"

        # Determine what field we're currently collecting
        current_field = _next_missing_field(profile)

        if current_field is None:
            # All fields collected already — skip straight to matching
            current_field = "state"  # safety reset

        # ── Step 1: Try local extraction (regex/rules, no LLM) ───────────────
        extracted_value = _extract_field_locally(current_field, req.message)

        # ── Step 2: If local extraction failed AND field needs LLM, use LLM ──
        if extracted_value is None and current_field == "state":
            llm_result = await llm.extract_all_fields(req.message, profile, language)
            # Also pick up any other fields the user mentioned in the same message
            for k, v in llm_result.items():
                if v is not None and k != current_field and not profile.get(k):
                    profile[k] = v
            extracted_value = llm_result.get("state")

        elif extracted_value is None:
            # For non-state fields, also try LLM as a fallback
            llm_result = await llm.extract_all_fields(req.message, profile, language)
            extracted_value = llm_result.get(current_field)
            # Opportunistically pick up other fields mentioned
            for k, v in llm_result.items():
                if v is not None and k != current_field and not profile.get(k):
                    profile[k] = v

        # ── Step 3: Did we get the value? ────────────────────────────────────
        if extracted_value is not None:
            profile[current_field] = extracted_value

            # Normalize income string → int
            if current_field == "income" and isinstance(profile.get("income"), str):
                nums = re.findall(r'\d+', profile["income"])
                profile["income"] = int(nums[0]) if nums else None

            # Check threshold: state + occupation_subtype + age all present
            threshold_met = all(profile.get(f) for f in THRESHOLD_FIELDS)

            if threshold_met:
                # ── Try scheme matching ───────────────────────────────────────
                matched = await _do_scheme_matching(profile, req.session_id, language)

                gap_value = sum(
                    s.get("benefit_annual_inr", 0)
                    for s in matched
                    if s.get("has_monetary_benefit")
                )

                if matched:
                    gap_result = await llm.generate_gap_announcement(matched, profile, language)
                    reply = (
                        gap_result.get("gap_announcement", "") + " " +
                        gap_result.get("top_3_summary", "")
                    ).strip()
                else:
                    reply = _get_q("income", language) if not profile.get("income") else (
                        "आपके प्रोफाइल के अनुसार कोई योजना नहीं मिली। "
                        "अधिक जानकारी देने पर बेहतर परिणाम मिलेंगे।"
                        if language == "hi" else
                        "No schemes found for your profile. Providing more details may help."
                    )

                matched_ids = [s.get("scheme_id") for s in matched if s.get("scheme_id")]
                new_state = "match" if matched else "intake"
                db.update_session(req.session_id, {
                    "chat_state": new_state,
                    "profile": profile,
                    "language": language,
                    "matched_scheme_ids": matched_ids,
                    "gap_value": gap_value,
                })

                if matched:
                    try:
                        db.save_anonymous_query(req.session_id, req.message, profile, len(matched), language)
                    except Exception:
                        pass

                return ChatResponse(
                    reply=reply, audio_b64=await _tts(reply, language),
                    state=new_state, profile=profile, schemes=matched,
                    gap_value=gap_value, session_id=req.session_id, language=language
                )
            else:
                # Threshold not yet met — ask the next missing field
                next_field = _next_missing_field(profile)
                question = _get_q(next_field, language) if next_field else ""
                db.update_session(req.session_id, {"profile": profile, "language": language})
                return ChatResponse(
                    reply=question, audio_b64=await _tts(question, language),
                    state="intake", profile=profile,
                    session_id=req.session_id, language=language
                )

        else:
            # ── Extraction failed: ask the same question again with a hint ───
            retry_msg = _get_q(current_field, language, retry=True)
            db.update_session(req.session_id, {"profile": profile, "language": language})
            return ChatResponse(
                reply=retry_msg, audio_b64=await _tts(retry_msg, language),
                state="intake", profile=profile,
                session_id=req.session_id, language=language
            )

    # ── MATCH STATE ───────────────────────────────────────────────────────────
    elif state == "match":
        matched_ids = session.get("matched_scheme_ids", [])
        # Use cached matched schemes from session rather than re-embedding
        try:
            matched = await _do_scheme_matching(profile, req.session_id, language)
        except Exception:
            matched = []

        scheme = matched[0] if matched else {}
        result = await llm.generate_scheme_guidance(req.message, scheme, language)
        reply = result.get("reply", "")

        db.update_session(req.session_id, {"chat_state": "guide"})
        return ChatResponse(
            reply=reply, audio_b64=await _tts(reply, language),
            state="guide", profile=profile, schemes=matched,
            gap_value=session.get("gap_value", 0),
            session_id=req.session_id, language=language
        )

    # ── GUIDE STATE ───────────────────────────────────────────────────────────
    elif state == "guide":
        try:
            matched = await _do_scheme_matching(profile, req.session_id, language)
        except Exception:
            matched = []
        scheme = matched[0] if matched else {}
        result = await llm.generate_scheme_guidance(req.message, scheme, language)
        reply = result.get("reply", "")
        return ChatResponse(
            reply=reply, audio_b64=await _tts(reply, language),
            state="guide", profile=profile, schemes=matched,
            gap_value=session.get("gap_value", 0),
            session_id=req.session_id, language=language
        )

    # ── FORM_FILL STATE ───────────────────────────────────────────────────────
    elif state == "form_fill":
        form_data = session.get("form_data", {})
        missing = []
        result = await llm.process_form_fill(req.message, form_data, missing, language)
        form_data.update(result.get("form_updates", {}))
        reply = result.get("reply", "")
        db.update_session(req.session_id, {"form_data": form_data})
        return ChatResponse(
            reply=reply, audio_b64=await _tts(reply, language),
            state="form_fill", profile=profile,
            session_id=req.session_id, language=language
        )

    raise HTTPException(status_code=400, detail="Unknown chat state")


@router.post("/ip-detect")
async def detect_location(request: Request):
    """Detect farmer's state from IP geolocation."""
    settings = get_settings()

    forwarded_for = request.headers.get("X-Forwarded-For", "")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host

    if not client_ip or client_ip in ("127.0.0.1", "::1", ""):
        return {"state": None, "city": None, "detected": False}

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(settings.ipapi_url.format(ip=client_ip))
            data = r.json()
        return {
            "state": data.get("region", "").lower().replace(" ", "_") or None,
            "city": data.get("city"),
            "detected": True,
        }
    except Exception:
        return {"state": None, "city": None, "detected": False}
