"""Quick smoke test — run before deploying to Railway.

Usage:
    cd backend
    python tests/test_smoke.py
"""
import asyncio
from app.services.groq_llm import health_check as groq_health
from app.services.cohere_embed import health_check as cohere_health
from app.services.supabase_db import health_check as supabase_health
from app.services.sarvam import health_check as sarvam_health


async def smoke_test():
    print("Jan Saathi — Pre-deploy Smoke Test")
    print("=" * 40)

    checks = {
        "groq": groq_health,
        "cohere": cohere_health,
        "supabase": supabase_health,
        "sarvam": sarvam_health,
    }

    results = {}
    for service, check_fn in checks.items():
        try:
            results[service] = await check_fn()
        except Exception as e:
            results[service] = {"status": "error", "error": str(e)}

    all_ok = all(r.get("status") == "ok" for r in results.values())
    for service, result in results.items():
        icon = "OK  " if result.get("status") == "ok" else "FAIL"
        print(f"  [{icon}] {service}: {result}")

    print("=" * 40)
    print(f"  Result: {'ALL SERVICES OK' if all_ok else 'SOME SERVICES FAILED'}")
    return all_ok


if __name__ == "__main__":
    ok = asyncio.run(smoke_test())
    exit(0 if ok else 1)
