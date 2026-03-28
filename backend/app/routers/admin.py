"""Admin router — stats, pipeline, sessions, users, integrations health panel."""
import time
from fastapi import APIRouter, Depends
from app.routers.auth import require_admin
from app.services import supabase_db as db

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/stats")
async def get_stats():
    return db.get_admin_stats()


@router.get("/sessions")
async def get_sessions(limit: int = 50):
    return db.get_all_sessions(limit)


@router.get("/users")
async def get_users(limit: int = 50):
    return db.get_all_users(limit)


@router.get("/pipeline")
async def get_pipeline_queue(status: str = "pending"):
    return db.get_pipeline_queue(status)


@router.get("/integrations")
async def get_integrations():
    """Real health check for all 4 external services with latency measurement."""
    from app.services import groq_llm, cohere_embed, sarvam
    from app.services.supabase_db import health_check as supabase_health

    checks = [
        ("groq", groq_llm.health_check),
        ("cohere", cohere_embed.health_check),
        ("sarvam", sarvam.health_check),
        ("supabase", supabase_health),
    ]

    services = []
    for name, check_fn in checks:
        start = time.monotonic()
        try:
            result = await check_fn()
        except Exception as e:
            result = {"status": "error", "error": str(e)}
        latency_ms = int((time.monotonic() - start) * 1000)
        services.append({
            "name": name,
            "status": result.get("status", "error"),
            "latency_ms": latency_ms,
            **{k: v for k, v in result.items() if k not in ("status",)},
        })

    return {"services": services}
