"""Chat router — 4-state machine: intake → match → guide → form_fill."""
import json
import httpx
from fastapi import APIRouter, HTTPException, Request
from app.models import ChatRequest, ChatResponse
from app.services import supabase_db as db
from app.services import groq_llm as llm
from app.services import cohere_embed as embed
from app.services import sarvam
from app.config import get_settings

router = APIRouter()

LANG_TO_SARVAM = {
    "hi": "hi-IN", "bn": "bn-IN", "ta": "ta-IN", "te": "te-IN",
    "gu": "gu-IN", "kn": "kn-IN", "ml": "ml-IN", "mr": "mr-IN",
    "pa": "pa-IN", "od": "od-IN", "en": "en-IN"
}


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    session = db.get_or_create_session(req.session_id)
    profile = session.get("profile", {})
    state = session.get("chat_state", "intake")
    language = req.language or session.get("language", "hi")

    # Check goodbye intent
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
        try:
            audio = await sarvam.text_to_speech(summary, LANG_TO_SARVAM.get(language, "hi-IN"))
        except Exception:
            audio = ""
        return ChatResponse(
            reply=summary, audio_b64=audio, state="goodbye",
            profile=profile, session_id=req.session_id, language=language
        )

    # ── INTAKE STATE ─────────────────────────────────────────────────────────
    if state == "intake":
        result = await llm.process_intake(req.message, profile, language)
        extracted = result.get("extracted", {})

        # Merge extracted fields into profile
        profile.update({k: v for k, v in extracted.items() if v is not None})

        # Check if threshold fields collected (state + occupation_subtype + age)
        threshold_met = all([
            profile.get("state"),
            profile.get("occupation_subtype"),
            profile.get("age"),
        ])

        if threshold_met:
            # Trigger scheme matching using profile-aware embedding
            query_embedding = await embed.embed_profile_query(profile, language)

            matched = db.match_schemes(
                query_embedding=query_embedding,
                filter_state=profile.get("state"),
                filter_occupation=profile.get("occupation_subtype", "crop_farmer"),
                filter_income=profile.get("income"),
                filter_bpl=profile.get("bpl"),
                filter_age=profile.get("age"),
            )

            gap_value = sum(
                s.get("benefit_annual_inr", 0)
                for s in matched
                if s.get("has_monetary_benefit")
            )

            gap_result = await llm.generate_gap_announcement(matched, profile, language)
            reply = gap_result.get("gap_announcement", "") + " " + gap_result.get("top_3_summary", "")

            matched_ids = [s["scheme_id"] for s in matched]
            db.update_session(req.session_id, {
                "chat_state": "match",
                "profile": profile,
                "language": language,
                "matched_scheme_ids": matched_ids,
                "gap_value": gap_value,
            })

            db.save_anonymous_query(req.session_id, req.message, profile, len(matched), language)
            try:
                audio = await sarvam.text_to_speech(reply, LANG_TO_SARVAM.get(language, "hi-IN"))
            except Exception:
                audio = ""

            return ChatResponse(
                reply=reply, audio_b64=audio, state="match",
                profile=profile, schemes=matched, gap_value=gap_value,
                session_id=req.session_id, language=language
            )
        else:
            # Ask for next missing field
            next_q = result.get("next_question_in_language") or result.get("next_question_hindi", "Aap kahan se hain?")
            db.update_session(req.session_id, {"profile": profile, "language": language})
            try:
                audio = await sarvam.text_to_speech(next_q, LANG_TO_SARVAM.get(language, "hi-IN"))
            except Exception:
                audio = ""

            return ChatResponse(
                reply=next_q, audio_b64=audio, state="intake",
                profile=profile, session_id=req.session_id, language=language
            )

    # ── MATCH STATE ──────────────────────────────────────────────────────────
    elif state == "match":
        matched = db.match_schemes(
            query_embedding=await embed.embed_query(req.message),
            filter_state=profile.get("state"),
        )

        result = await llm.generate_scheme_guidance(req.message, matched[0] if matched else {}, language)
        reply = result.get("reply", "")

        db.update_session(req.session_id, {"chat_state": "guide"})
        try:
            audio = await sarvam.text_to_speech(reply, LANG_TO_SARVAM.get(language, "hi-IN"))
        except Exception:
            audio = ""

        return ChatResponse(
            reply=reply, audio_b64=audio, state="guide",
            profile=profile, schemes=matched,
            gap_value=session.get("gap_value", 0),
            session_id=req.session_id, language=language
        )

    # ── GUIDE STATE ──────────────────────────────────────────────────────────
    elif state == "guide":
        matched = db.match_schemes(await embed.embed_query(req.message))
        scheme = matched[0] if matched else {}
        result = await llm.generate_scheme_guidance(req.message, scheme, language)
        reply = result.get("reply", "")
        try:
            audio = await sarvam.text_to_speech(reply, LANG_TO_SARVAM.get(language, "hi-IN"))
        except Exception:
            audio = ""

        return ChatResponse(
            reply=reply, audio_b64=audio, state="guide",
            profile=profile, schemes=matched,
            gap_value=session.get("gap_value", 0),
            session_id=req.session_id, language=language
        )

    # ── FORM_FILL STATE ──────────────────────────────────────────────────────
    elif state == "form_fill":
        form_data = session.get("form_data", {})
        active_scheme_id = session.get("active_form_scheme")
        missing = []  # Calculate from scheme form_field_mapping vs form_data

        result = await llm.process_form_fill(req.message, form_data, missing, language)
        form_data.update(result.get("form_updates", {}))
        reply = result.get("reply", "")

        db.update_session(req.session_id, {"form_data": form_data})
        try:
            audio = await sarvam.text_to_speech(reply, LANG_TO_SARVAM.get(language, "hi-IN"))
        except Exception:
            audio = ""

        return ChatResponse(
            reply=reply, audio_b64=audio, state="form_fill",
            profile=profile, session_id=req.session_id, language=language
        )

    raise HTTPException(status_code=400, detail="Unknown chat state")


@router.post("/ip-detect")
async def detect_location(request: Request):
    """Detect farmer's state from IP geolocation."""
    settings = get_settings()

    # Railway passes real IP in X-Forwarded-For
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
