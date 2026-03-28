"""All Supabase database operations."""
import os
from datetime import datetime, timedelta
from typing import Optional, List
from supabase import create_client, Client
from app.config import get_settings

_settings = get_settings()

def get_db() -> Client:
    return create_client(_settings.supabase_url, _settings.supabase_service_role_key)

# ── Sessions ────────────────────────────────────────────────────────────────

def get_or_create_session(session_id: str) -> dict:
    db = get_db()
    result = db.rpc("get_or_create_session", {"p_session_id": session_id}).execute()
    # The RPC returns a single row. The supabase client might wrap it in a list.
    data = result.data
    if isinstance(data, list) and len(data) > 0:
        return data[0]
    return data if isinstance(data, dict) else {}

def update_session(session_id: str, updates: dict) -> None:
    get_db().table("user_sessions").update(updates).eq("session_id", session_id).execute()

def get_session(session_id: str) -> Optional[dict]:
    r = get_db().table("user_sessions").select("*").eq("session_id", session_id).execute()
    return r.data[0] if r.data else None

def save_anonymous_query(session_id: str, query_text: str,
                         profile: dict, matched_count: int, language: str) -> None:
    get_db().table("anonymous_queries").insert({
        "session_id": session_id,
        "query_text": query_text,
        "profile_snapshot": profile,
        "matched_count": matched_count,
        "language": language,
    }).execute()

# ── Scheme matching ──────────────────────────────────────────────────────────

def match_schemes(
    query_embedding: List[float],
    match_threshold: float = 0.60,
    match_count: int = 8,
    filter_state: Optional[str] = None,
    filter_occupation: Optional[str] = None,
    filter_income: Optional[int] = None,
    filter_bpl: Optional[bool] = None,
    filter_age: Optional[int] = None,
) -> List[dict]:
    params = {
        "query_embedding": query_embedding,
        "match_threshold": match_threshold,
        "match_count": match_count,
    }
    if filter_state:      params["filter_state"] = filter_state
    if filter_occupation: params["filter_occupation"] = filter_occupation
    if filter_income:     params["filter_income"] = filter_income
    if filter_bpl is not None: params["filter_bpl"] = filter_bpl
    if filter_age:        params["filter_age"] = filter_age
    
    r = get_db().rpc("match_schemes", params).execute()
    return r.data or []

# ── Applications ─────────────────────────────────────────────────────────────

def create_application(
    session_id: str, scheme_id: str,
    scheme_name: str, form_data: dict,
    user_id: Optional[str] = None
) -> dict:
    db = get_db()
    ref_result = db.rpc("generate_reference_number", {}).execute()
    
    # Extract the reference number. If it's wrapped in a list, unpack it.
    ref = ref_result.data[0] if isinstance(ref_result.data, list) else ref_result.data
    if isinstance(ref, dict) and "generate_reference_number" in ref:
        ref = ref["generate_reference_number"]
    
    today = datetime.now().date()
    row = {
        "reference_number": ref,
        "session_id": session_id,
        "user_id": user_id,
        "scheme_id": scheme_id,
        "scheme_name": scheme_name,
        "form_data": form_data,
        "status": "submitted",
        "submitted_at": datetime.now().isoformat(),
        "expected_state_verify_date": (today + timedelta(days=7)).isoformat(),
        "expected_central_date": (today + timedelta(days=21)).isoformat(),
        "expected_benefit_date": (today + timedelta(days=45)).isoformat(),
    }
    result = db.table("applications").insert(row).execute()
    return result.data[0]

def get_application(reference_number: str) -> Optional[dict]:
    r = get_db().table("applications").select("*").eq("reference_number", reference_number).execute()
    return r.data[0] if r.data else None

def get_session_applications(session_id: str) -> List[dict]:
    r = get_db().table("applications").select(
        "*, schemes(name_english, name_hindi, acronym, portal_url)"
    ).eq("session_id", session_id).order("created_at", desc=True).execute()
    return r.data or []

# ── Users ────────────────────────────────────────────────────────────────────

def get_user_by_email(email: str) -> Optional[dict]:
    r = get_db().table("users").select("*").eq("email", email).execute()
    return r.data[0] if r.data else None

def upsert_user(user_data: dict) -> dict:
    r = get_db().table("users").upsert(user_data, on_conflict="id").execute()
    return r.data[0]

# ── Admin stats ───────────────────────────────────────────────────────────────

def get_admin_stats() -> dict:
    r = get_db().rpc("get_admin_stats", {}).execute()
    
    data = r.data
    if isinstance(data, list) and len(data) > 0:
        return data[0] if isinstance(data[0], dict) else data
    return data if isinstance(data, dict) else {}

def get_pipeline_queue(status: str = "pending") -> List[dict]:
    r = get_db().table("pipeline_queue").select("*").eq("status", status).execute()
    return r.data or []

def get_all_sessions(limit: int = 50) -> List[dict]:
    r = get_db().table("user_sessions").select("*").order(
        "updated_at", desc=True
    ).limit(limit).execute()
    return r.data or []

def get_all_users(limit: int = 50) -> List[dict]:
    r = get_db().table("users").select("*").order(
        "created_at", desc=True
    ).limit(limit).execute()
    return r.data or []
