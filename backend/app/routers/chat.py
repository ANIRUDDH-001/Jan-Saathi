"""Chat router — 4-state machine: intake → match → guide → form_fill.

Intake uses a deterministic question queue (no LLM for question selection).
Age/income extracted via regex first, LLM used only for state/category.
"""
import re
import logging
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from app.models import ChatRequest, ChatResponse
from app.services import supabase_db as db
from app.services import groq_llm as llm
from app.services import cohere_embed as embed
from app.services import sarvam
from app.config import get_settings
from app.limiter import limiter

logger = logging.getLogger(__name__)

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
    "bn": {
        "state":    "আপনি কোন রাজ্য থেকে এসেছেন?",
        "age":      "আপনার বয়স কত?",
        "income":   "আপনার বার্ষিক আয় কত? (টাকায় বলুন)",
        "category": "আপনি SC, ST, OBC না General?",
        "bpl":      "আপনার কাছে BPL কার্ড আছে?",
        "gender":   "আপনি পুরুষ না মহিলা?",
    },
    "ta": {
        "state":    "நீங்கள் எந்த மாநிலத்திலிருந்து வருகிறீர்கள்?",
        "age":      "உங்கள் வயது என்ன?",
        "income":   "உங்கள் ஆண்டு வருமானம் எவ்வளவு?",
        "category": "நீங்கள் SC, ST, OBC அல்லது General?",
        "bpl":      "உங்களிடம் BPL அட்டை உள்ளதா?",
        "gender":   "நீங்கள் ஆண் அல்லது பெண்?",
    },
    "te": {
        "state":    "మీరు ఏ రాష్ట్రం నుండి వచ్చారు?",
        "age":      "మీ వయస్సు ఎంత?",
        "income":   "మీ వార్షిక ఆదాయం ఎంత? (రూపాయలలో చెప్పండి)",
        "category": "మీరు SC, ST, OBC లేదా General?",
        "bpl":      "మీ దగ్గర BPL కార్డ్ ఉందా?",
        "gender":   "మీరు పురుషుడా లేదా స్త్రీయా?",
    },
    "gu": {
        "state":    "તમે ક્યા રાજ્યમાંથી છો?",
        "age":      "તમારી ઉંમર કેટલી છે?",
        "income":   "તમારી વાર્ષિક આવક કેટલી છે? (રૂપિયામાં)",
        "category": "તમે SC, ST, OBC કે General?",
        "bpl":      "તમારી પાસે BPL કાર્ડ છે?",
        "gender":   "તમે પુરુષ છો કે સ્ત્રી?",
    },
    "kn": {
        "state":    "ನೀವು ಯಾವ ರಾಜ್ಯದಿಂದ ಬಂದಿದ್ದೀರಿ?",
        "age":      "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?",
        "income":   "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು? (ರೂಪಾಯಿಗಳಲ್ಲಿ)",
        "category": "ನೀವು SC, ST, OBC ಅಥವಾ General?",
        "bpl":      "ನಿಮ್ಮಲ್ಲಿ BPL ಕಾರ್ಡ್ ಇದೆಯೇ?",
        "gender":   "ನೀವು ಪುರುಷ ಅಥವಾ ಮಹಿಳೆ?",
    },
    "ml": {
        "state":    "നിങ്ങൾ ഏത് സംസ്ഥാനത്ത് നിന്നാണ്?",
        "age":      "നിങ്ങളുടെ പ്രായം എത്രയാണ്?",
        "income":   "നിങ്ങളുടെ വാർഷിക വരുമാനം എത്ര? (രൂപയിൽ)",
        "category": "നിങ്ങൾ SC, ST, OBC അല്ലെങ്കിൽ General?",
        "bpl":      "നിങ്ങൾക്ക് BPL കാർഡ് ഉണ്ടോ?",
        "gender":   "നിങ്ങൾ പുരുഷനോ സ്ത്രീയോ?",
    },
    "mr": {
        "state":    "तुम्ही कोणत्या राज्यातून आहात?",
        "age":      "तुमचे वय किती आहे?",
        "income":   "तुमचे वार्षिक उत्पन्न किती आहे? (रुपयांमध्ये)",
        "category": "तुम्ही SC, ST, OBC की General?",
        "bpl":      "तुमच्याकडे BPL कार्ड आहे का?",
        "gender":   "तुम्ही पुरुष आहात की महिला?",
    },
    "pa": {
        "state":    "ਤੁਸੀਂ ਕਿਹੜੇ ਰਾਜ ਤੋਂ ਹੋ?",
        "age":      "ਤੁਹਾਡੀ ਉਮਰ ਕਿੰਨੀ ਹੈ?",
        "income":   "ਤੁਹਾਡੀ ਸਾਲਾਨਾ ਆਮਦਨ ਕਿੰਨੀ ਹੈ? (ਰੁਪਏ ਵਿੱਚ)",
        "category": "ਤੁਸੀਂ SC, ST, OBC ਜਾਂ General?",
        "bpl":      "ਕੀ ਤੁਹਾਡੇ ਕੋਲ BPL ਕਾਰਡ ਹੈ?",
        "gender":   "ਤੁਸੀਂ ਮਰਦ ਹੋ ਜਾਂ ਔਰਤ?",
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
    "bn": {
        "state":    "অনুগ্রহ করে রাজ্যের নাম বলুন, যেমন ওডিশা, রাজস্থান বা উত্তর প্রদেশ।",
        "age":      "আপনার বয়স একটি সংখ্যায় বলুন, যেমন ২৫।",
        "income":   "বার্ষিক আয় টাকায় বলুন, যেমন ৫০০০০ বা ১ লাখ।",
        "category": "SC, ST, OBC না General — কোন বিভাগ?",
        "bpl":      "BPL কার্ড আছে কি — হ্যাঁ বা না?",
        "gender":   "পুরুষ না মহিলা?",
    },
    "ta": {
        "state":    "மாநிலத்தின் பெயரை சொல்லுங்கள், எ.கா. ஒடிஷா, ராஜஸ்தான்.",
        "age":      "உங்கள் வயதை ஒரு எண்ணில் சொல்லுங்கள், எ.கா. 25.",
        "income":   "ஆண்டு வருமானம் ரூபாயில் சொல்லுங்கள், எ.கா. 50000 அல்லது 1 லட்சம்.",
        "category": "SC, ST, OBC அல்லது General — எந்த பிரிவு?",
        "bpl":      "BPL அட்டை உள்ளதா — ஆம் அல்லது இல்லை?",
        "gender":   "ஆண் அல்லது பெண்?",
    },
    "te": {
        "state":    "రాష్ట్రం పేరు చెప్పండి, ఉదా. ఒడిశా, రాజస్థాన్.",
        "age":      "మీ వయస్సు ఒక సంఖ్యలో చెప్పండి, ఉదా. 25.",
        "income":   "వార్షిక ఆదాయం రూపాయలలో చెప్పండి, ఉదా. 50000 లేదా 1 లక్ష.",
        "category": "SC, ST, OBC లేదా General — ఏ విభాగం?",
        "bpl":      "BPL కార్డ్ ఉందా — అవును లేదా కాదు?",
        "gender":   "పురుషుడా లేదా స్త్రీయా?",
    },
    "gu": {
        "state":    "રાજ્યનું નામ કહો, જેમ કે ઓડિશા, રાજસ્થાન.",
        "age":      "તમારી ઉંમર એક સંખ્યામાં કહો, જેમ કે 25.",
        "income":   "વાર્ષિક આવક રૂપિયામાં કહો, જેમ કે 50000 કે 1 લાખ.",
        "category": "SC, ST, OBC કે General — કઈ શ્રેણી?",
        "bpl":      "BPL કાર્ડ છે — હા કે ના?",
        "gender":   "પુરુષ કે સ્ત્રી?",
    },
    "kn": {
        "state":    "ರಾಜ್ಯದ ಹೆಸರು ಹೇಳಿ, ಉದಾ. ಒಡಿಶಾ, ರಾಜಸ್ಥಾನ.",
        "age":      "ನಿಮ್ಮ ವಯಸ್ಸನ್ನು ಒಂದು ಸಂಖ್ಯೆಯಲ್ಲಿ ಹೇಳಿ, ಉದಾ. 25.",
        "income":   "ವಾರ್ಷಿಕ ಆದಾಯ ರೂಪಾಯಿಗಳಲ್ಲಿ ಹೇಳಿ, ಉದಾ. 50000 ಅಥವಾ 1 ಲಕ್ಷ.",
        "category": "SC, ST, OBC ಅಥವಾ General — ಯಾವ ವರ್ಗ?",
        "bpl":      "BPL ಕಾರ್ಡ್ ಇದೆಯೇ — ಹೌದು ಅಥವಾ ಇಲ್ಲ?",
        "gender":   "ಪುರುಷ ಅಥವಾ ಮಹಿಳೆ?",
    },
    "ml": {
        "state":    "സംസ്ഥാനത്തിന്റെ പേര് പറയൂ, ഉദാ. ഒഡിഷ, രാജസ്ഥാൻ.",
        "age":      "നിങ്ങളുടെ പ്രായം ഒരു സംഖ്യയിൽ പറയൂ, ഉദാ. 25.",
        "income":   "വാർഷിക വരുമാനം രൂപയിൽ പറയൂ, ഉദാ. 50000 അല്ലെങ്കിൽ 1 ലക്ഷം.",
        "category": "SC, ST, OBC അല്ലെങ്കിൽ General — ഏത് വിഭാഗം?",
        "bpl":      "BPL കാർഡ് ഉണ്ടോ — അതെ അല്ലെങ്കിൽ ഇല്ല?",
        "gender":   "പുരുഷൻ അല്ലെങ്കിൽ സ്ത്രീ?",
    },
    "mr": {
        "state":    "राज्याचे नाव सांगा, उदा. ओडिशा, राजस्थान.",
        "age":      "तुमचे वय एका संख्येत सांगा, उदा. 25.",
        "income":   "वार्षिक उत्पन्न रुपयांमध्ये सांगा, उदा. 50000 किंवा 1 लाख.",
        "category": "SC, ST, OBC की General — कोणती श्रेणी?",
        "bpl":      "BPL कार्ड आहे का — हो किंवा नाही?",
        "gender":   "पुरुष की महिला?",
    },
    "pa": {
        "state":    "ਰਾਜ ਦਾ ਨਾਮ ਦੱਸੋ, ਜਿਵੇਂ ਕਿ ਓਡੀਸ਼ਾ, ਰਾਜਸਥਾਨ।",
        "age":      "ਆਪਣੀ ਉਮਰ ਇੱਕ ਸੰਖਿਆ ਵਿੱਚ ਦੱਸੋ, ਜਿਵੇਂ ਕਿ 25।",
        "income":   "ਸਾਲਾਨਾ ਆਮਦਨ ਰੁਪਏ ਵਿੱਚ ਦੱਸੋ, ਜਿਵੇਂ ਕਿ 50000 ਜਾਂ 1 ਲੱਖ।",
        "category": "SC, ST, OBC ਜਾਂ General — ਕਿਹੜੀ ਸ਼੍ਰੇਣੀ?",
        "bpl":      "BPL ਕਾਰਡ ਹੈ — ਹਾਂ ਜਾਂ ਨਹੀਂ?",
        "gender":   "ਮਰਦ ਜਾਂ ਔਰਤ?",
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


_OCCUPATION_SUBTYPE_TO_DB = {
    "crop_farmer": "farmer",
    "dairy_farmer": "dairy_farmer",
    "livestock_farmer": "livestock_farmer",
    "fisherman": "fisherman",
}

def _map_occupation(occupation_subtype: str) -> str:
    """Map chat occupation_subtype values to DB occupation array values."""
    return _OCCUPATION_SUBTYPE_TO_DB.get(occupation_subtype, "farmer")


async def _do_scheme_matching(profile: dict, session_id: str, language: str):
    """Run scheme matching with Cohere vector search, falling back to simple SQL."""
    raw_occ = profile.get("occupation_subtype", "crop_farmer")
    db_occupation = _map_occupation(raw_occ)
    try:
        query_embedding = await embed.embed_profile_query(profile, language)
        matched = db.match_schemes(
            query_embedding=query_embedding,
            match_threshold=0.30,   # Lower threshold for better recall
            filter_state=profile.get("state"),
            filter_occupation=db_occupation,
            filter_income=profile.get("income") if isinstance(profile.get("income"), int) else None,
            filter_bpl=profile.get("bpl"),
            filter_age=profile.get("age") if isinstance(profile.get("age"), int) else None,
        )
        logger.info(f"Vector match returned {len(matched)} schemes for session {session_id}")
        if not matched:
            # If vector search returns nothing, try without occupation filter for broader results
            matched = db.match_schemes(
                query_embedding=query_embedding,
                match_threshold=0.25,
                filter_state=profile.get("state"),
                filter_income=profile.get("income") if isinstance(profile.get("income"), int) else None,
                filter_age=profile.get("age") if isinstance(profile.get("age"), int) else None,
            )
            logger.info(f"Broader vector match returned {len(matched)} schemes for session {session_id}")
        return matched
    except Exception as e:
        logger.warning(f"Vector search failed ({e}), trying simple fallback for {session_id}")
        # Fallback: basic table scan without vector search
        try:
            matched = db.match_schemes_fallback(
                filter_state=profile.get("state"),
                filter_occupation=db_occupation,
            )
            # Add synthetic similarity for frontend compatibility
            for s in matched:
                s.setdefault("similarity", 0.0)
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

    # ── Silence timeout sentinel from frontend ────────────────────────────────
    # Frontend sends __SILENCE_TIMEOUT__ when the 30s inactivity timer fires.
    if req.message == "__SILENCE_TIMEOUT__":
        req = req.model_copy(update={"message": "bye"})

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
                    new_state = "match"
                else:
                    # Don't say "no schemes" yet if more fields remain to collect
                    next_field = _next_missing_field(profile)
                    if next_field:
                        reply = _get_q(next_field, language)
                    else:
                        # All intake fields collected and still no match — now tell user
                        reply = (
                            "आपके प्रोफाइल के अनुसार अभी कोई योजना नहीं मिली। "
                            "थोड़ी देर में फिर कोशिश करें।"
                            if language == "hi" else
                            "No schemes found for your profile right now. Please try again shortly."
                        )
                    new_state = "intake"

                matched_ids = [s.get("scheme_id") for s in matched if s.get("scheme_id")]
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
        # Use cached scheme IDs from session to avoid re-running vector search
        matched = db.get_schemes_by_ids(matched_ids) if matched_ids else []

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
        matched_ids = session.get("matched_scheme_ids", [])
        matched = db.get_schemes_by_ids(matched_ids) if matched_ids else []
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
