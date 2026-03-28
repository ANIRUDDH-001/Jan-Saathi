"""Cohere embedding service (async) — multilingual semantic search."""
import logging
from typing import Optional
import cohere
from app.config import get_settings

logger = logging.getLogger(__name__)
_s = get_settings()

_client: Optional[cohere.AsyncClient] = None


def get_client() -> cohere.AsyncClient:
    global _client
    if _client is None:
        _client = cohere.AsyncClient(api_key=_s.cohere_api_key)
    return _client


async def embed_query(text: str) -> list[float]:
    """Generate 1024-dim embedding for a search query."""
    client = get_client()
    response = await client.embed(
        texts=[text],
        model=_s.cohere_embed_model,
        input_type="search_query",
        embedding_types=["float"],
    )
    return response.embeddings.float[0]


async def build_scheme_query(profile: dict, language: str = "hi") -> str:
    """Convert a user profile dict into a natural language query for embedding."""
    parts = []

    if profile.get("occupation_subtype"):
        occ_map = {
            "crop_farmer": "farmer kisan agriculture krishi crop",
            "dairy_farmer": "dairy farmer dugdh pashu palan",
            "livestock_farmer": "livestock farmer pashu palan",
            "fisherman": "fisherman machhuara fisheries matsya",
        }
        parts.append(occ_map.get(profile["occupation_subtype"], profile["occupation_subtype"]))
    elif profile.get("occupation"):
        parts.append(profile["occupation"])

    if profile.get("state"):
        parts.append(f"state {profile['state']}")

    income = profile.get("income") or profile.get("income_annual_inr")
    if income is not None:
        if income < 100000:
            parts.append("low income BPL poor garib")
        elif income < 300000:
            parts.append("middle income medium")
        parts.append(f"income {income}")

    if profile.get("bpl"):
        parts.append("BPL card below poverty line")

    if profile.get("category"):
        parts.append(profile["category"])

    if profile.get("age") is not None:
        age = profile["age"]
        if age >= 60:
            parts.append("senior citizen old age vriddha")
        elif age < 25:
            parts.append("youth yuva young")

    if profile.get("land_area_acres") is not None:
        parts.append("land owner kisan cultivator")

    return " ".join(parts) if parts else "government scheme yojana farmer"


async def embed_profile_query(profile: dict, language: str = "hi") -> list[float]:
    """Build natural language query from profile and embed it."""
    query_text = await build_scheme_query(profile, language)
    logger.info(f"Embedding profile query: {query_text}")
    return await embed_query(query_text)


async def health_check() -> dict:
    """Verify Cohere is reachable."""
    try:
        await embed_query("test")
        return {"status": "ok", "model": _s.cohere_embed_model}
    except Exception as e:
        return {"status": "error", "error": str(e)}
