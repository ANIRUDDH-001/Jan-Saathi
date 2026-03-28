"""Cohere embedding service."""
import cohere
from app.config import get_settings

_s = get_settings()
_co = cohere.Client(_s.cohere_api_key)

def embed_query(text: str) -> list[float]:
    """Embed a search query for scheme matching."""
    response = _co.embed(
        texts=[text],
        model=_s.cohere_embed_model,
        input_type="search_query",
        embedding_types=["float"]
    )
    return response.embeddings.float[0]
