"""Schemes router — list, detail, search."""
from fastapi import APIRouter, Query, HTTPException
from app.services import supabase_db as db
from app.services import cohere_embed as embed

router = APIRouter()

@router.get("")
async def list_schemes(state: str = None, limit: int = 20):
    """List all verified schemes, optionally filtered by state."""
    from app.services.supabase_db import get_db
    q = get_db().table("schemes").select(
        "scheme_id,name_english,name_hindi,acronym,level,state,benefit_annual_inr,has_monetary_benefit,demo_ready"
    ).eq("is_verified", True).limit(limit)
    if state:
        q = q.or_(f"state.eq.{state},state.eq.national")
    return q.execute().data

@router.get("/search")
async def search_schemes(q: str = Query(...), state: str = None):
    """Semantic search for schemes."""
    query_embedding = await embed.embed_query(q)
    return db.match_schemes(
        query_embedding, match_threshold=0.5,
        filter_state=state, match_count=6
    )

@router.get("/{scheme_id}")
async def get_scheme(scheme_id: str):
    """Get full scheme details."""
    from app.services.supabase_db import get_db
    r = get_db().table("schemes").select("*").eq("scheme_id", scheme_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return r.data[0]
