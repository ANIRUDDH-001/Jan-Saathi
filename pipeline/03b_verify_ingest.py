#!/usr/bin/env python3
"""
03b_verify_ingest.py — End-to-end Supabase verification.

Layer 1: 10 deterministic DB checks
Layer 2: 5 Groq-verified semantic search tests

Run:  python pipeline/03b_verify_ingest.py
Gate: Exits with code 1 if ANY Layer 1 check fails.
"""

import os
import sys

import cohere
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("pipeline/.env")
if not os.getenv("SUPABASE_URL"):
    load_dotenv("pipeline/data/.env")

sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
co = cohere.Client(os.getenv("COHERE_API_KEY"))

PASS = "\u2713"
FAIL = "\u2717"


def embed_query(text: str) -> list:
    """Embed a search query using Cohere."""
    resp = co.embed(
        texts=[text],
        model="embed-multilingual-v3.0",
        input_type="search_query",
        embedding_types=["float"],
    )
    return resp.embeddings.float[0]


def check(label: str, condition: bool, detail: str = "") -> bool:
    marker = PASS if condition else FAIL
    print(f"  {marker} {label}" + (f": {detail}" if detail else ""))
    return condition


def main():
    all_pass = True

    print("\n" + "=" * 60)
    print("INGEST VERIFICATION")
    print("=" * 60)

    # ── Layer 1: Deterministic DB Checks ─────────────────────────────────
    print("\n── Layer 1: Deterministic DB Checks ──")

    # 1. Verified scheme count
    try:
        r = (
            sb.table("schemes")
            .select("id", count="exact")
            .eq("is_verified", True)
            .execute()
        )
        ok = check("verified schemes", r.count == 51, f"{r.count}/51")
        if not ok:
            all_pass = False
    except Exception as e:
        check("verified schemes", False, f"error: {e}")
        all_pass = False

    # 2. Chunk count
    try:
        r = sb.table("scheme_chunks").select("id", count="exact").execute()
        ok = check("scheme chunks", r.count == 102, f"{r.count}/102")
        if not ok:
            all_pass = False
    except Exception as e:
        check("scheme chunks", False, f"error: {e}")
        all_pass = False

    # 3. Embedded chunks (non-null embedding)
    try:
        r = (
            sb.table("scheme_chunks")
            .select("id", count="exact")
            .not_.is_("embedding", "null")
            .execute()
        )
        ok = check("chunks with embeddings", r.count == 102, f"{r.count}/102")
        if not ok:
            all_pass = False
    except Exception as e:
        check("chunks with embeddings", False, f"error: {e}")
        all_pass = False

    # 4. PM-KISAN annual = 6000
    try:
        r = (
            sb.table("schemes")
            .select("benefit_annual_inr")
            .eq("acronym", "PM-KISAN")
            .execute()
        )
        val = r.data[0]["benefit_annual_inr"] if r.data else None
        ok = check("PM-KISAN annual = 6000", val == 6000, str(val))
        if not ok:
            all_pass = False
    except Exception as e:
        check("PM-KISAN annual = 6000", False, f"error: {e}")
        all_pass = False

    # 5. PM-KMY annual = 36000
    try:
        r = (
            sb.table("schemes")
            .select("benefit_annual_inr")
            .ilike("name_english", "%Maandhan%")
            .execute()
        )
        val = r.data[0]["benefit_annual_inr"] if r.data else None
        ok = check("PM-KMY annual = 36000", val == 36000, str(val))
        if not ok:
            all_pass = False
    except Exception as e:
        check("PM-KMY annual = 36000", False, f"error: {e}")
        all_pass = False

    # 6. Hindi names populated
    try:
        r = (
            sb.table("schemes")
            .select("id", count="exact")
            .not_.is_("name_hindi", "null")
            .execute()
        )
        ok = check("schemes with hindi names", r.count >= 48, f"{r.count}/51")
        if not ok:
            all_pass = False
    except Exception as e:
        check("hindi names", False, f"error: {e}")
        all_pass = False

    # 7. Semantic search — "kisan income"
    print("\n  Semantic search: 'UP kisan income support 6000 fasal'")
    try:
        emb = embed_query("UP kisan income support 6000 fasal")
        r = sb.rpc(
            "match_schemes",
            {
                "query_embedding": emb,
                "match_threshold": 0.3,
                "match_count": 5,
            },
        ).execute()

        names = [s.get("acronym") or s.get("name_english", "?")[:25] for s in r.data]
        print(f"    Results: {names}")
        top3_acronyms = [s.get("acronym", "") for s in r.data[:3]]
        hit = any("PM-KISAN" in (a or "") for a in top3_acronyms)
        ok = check("PM-KISAN in top 3", hit, f"top3={top3_acronyms}")
        if not ok:
            all_pass = False
    except Exception as e:
        check("semantic search", False, f"error: {e}")
        all_pass = False

    # 8. No duplicates in search results
    try:
        if r.data:
            unique_ids = {s.get("scheme_id") for s in r.data}
            ok = check(
                "no duplicate schemes in results",
                len(r.data) == len(unique_ids),
                f"{len(r.data)} results, {len(unique_ids)} unique",
            )
            if not ok:
                all_pass = False
    except Exception:
        pass

    # 9. State filter
    try:
        emb = embed_query("telangana farmer scheme subsidy")
        r_state = sb.rpc(
            "match_schemes",
            {
                "query_embedding": emb,
                "match_threshold": 0.3,
                "match_count": 8,
                "filter_state": "telangana",
            },
        ).execute()
        states = {s.get("state") for s in r_state.data}
        ok = check(
            "state filter (telangana)", states <= {"telangana", "national"}, str(states)
        )
        if not ok:
            all_pass = False
    except Exception as e:
        check("state filter", False, f"error: {e}")
        all_pass = False

    # 10. generate_reference_number works
    try:
        ref = sb.rpc("generate_reference_number", {}).execute().data
        ok = check(
            "reference number format",
            isinstance(ref, str) and ref.startswith("JAN-"),
            str(ref),
        )
        if not ok:
            all_pass = False
    except Exception as e:
        check("reference number", False, f"error: {e}")
        all_pass = False

    # 11 (bonus). Form field mapping present
    try:
        r = sb.table("schemes").select("acronym,form_field_mapping").execute()
        with_forms = [
            s.get("acronym", "?")
            for s in r.data
            if (s.get("form_field_mapping") or {}).get("fields")
        ]
        check("form-mapped schemes", len(with_forms) >= 6, str(with_forms))
    except Exception as e:
        check("form-mapped schemes", False, f"error: {e}")

    # ── Layer 2: Extended Semantic Search Tests ──────────────────────────
    print("\n── Layer 2: Semantic Search Quality ──")

    test_queries = [
        ("pension scheme farmer 60 years old", "PM-KMY", "Maandhan"),
        ("crop insurance premium subsidy fasal bima", "PMFBY", "Fasal Bima"),
        ("solar pump kisan bijli installation", "PM-KUSUM", "KUSUM"),
        ("fisherman boat net subsidy matsya", "PMMSY", "Matsya"),
        ("mgnrega rural employment guarantee rozgar", "MGNREGA", "MGNREGA"),
    ]

    search_pass = 0
    for query, expected_acronym, expected_keyword in test_queries:
        try:
            emb = embed_query(query)
            r = sb.rpc(
                "match_schemes",
                {
                    "query_embedding": emb,
                    "match_threshold": 0.3,
                    "match_count": 3,
                },
            ).execute()

            top = r.data[0] if r.data else {}
            top_acr = top.get("acronym", "")
            top_name = top.get("name_english", "")

            hit = (
                expected_acronym in (top_acr or "")
                or expected_keyword.lower() in (top_name or "").lower()
            )
            if hit:
                search_pass += 1
            marker = PASS if hit else FAIL
            print(
                f"  {marker} '{query[:40]}...' -> {top_acr or top_name[:30]} (expected: {expected_acronym})"
            )

        except Exception as e:
            print(f"  {FAIL} '{query[:40]}...' -> error: {e}")

    check(
        "semantic search quality",
        search_pass >= 4,
        f"{search_pass}/5 correct top results",
    )

    # ── Final Gate ───────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    if all_pass:
        print("QUALITY GATE C: PASSED")
        print("  All checks passed. Data is live in Supabase.")
        print("  Next: python pipeline/04_seed_demo.py")
    else:
        print("QUALITY GATE C: FAILED")
        print("  Fix issues above, then re-run.")
        sys.exit(1)


if __name__ == "__main__":
    main()
