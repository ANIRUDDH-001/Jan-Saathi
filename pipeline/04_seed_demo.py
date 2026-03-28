#!/usr/bin/env python3
"""
04_seed_demo.py — Seed demo data for hackathon presentation.

Calls Supabase RPC `seed_demo_data()` to create:
  - Demo session: demo-ramesh-001
  - Demo application: JAN-2026-XXXXX

Run:  python pipeline/04_seed_demo.py
"""

import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv("pipeline/.env")
if not os.getenv("SUPABASE_URL"):
    load_dotenv("pipeline/data/.env")

sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def main():
    print("Seeding demo data...")

    try:
        result = sb.rpc("seed_demo_data", {}).execute()
        print(f"  Result: {result.data}")
        print("\nDemo data seeded successfully.")
    except Exception as e:
        err = str(e)
        if "does not exist" in err or "could not find" in err.lower():
            print("  WARNING: seed_demo_data() RPC not found in Supabase.")
            print("  This is expected if the RPC hasn't been deployed yet.")
            print("  The data pipeline is complete — demo seeding can be done later.")
        else:
            print(f"  Error: {e}")
            print("  Demo seeding failed but data pipeline is complete.")

    # Verify match_schemes works as final check
    print("\n── Final Verification: match_schemes() ──")
    try:
        import cohere

        co = cohere.Client(os.getenv("COHERE_API_KEY"))
        resp = co.embed(
            texts=["UP kisan income support 6000 fasal"],
            model="embed-multilingual-v3.0",
            input_type="search_query",
            embedding_types=["float"],
        )
        emb = resp.embeddings.float[0]

        r = sb.rpc(
            "match_schemes",
            {
                "query_embedding": emb,
                "match_threshold": 0.3,
                "match_count": 3,
            },
        ).execute()

        if r.data:
            top = r.data[0]
            print("  Query: 'UP kisan income support 6000 fasal'")
            print(
                f"  Top result: {top.get('acronym', '')} - {top.get('name_english', '')}"
            )
            print(f"  Similarity: {top.get('similarity', 'N/A')}")
            if "PM-KISAN" in (top.get("acronym") or ""):
                print(
                    "\n  PHASE 1 COMPLETE — PM-KISAN is top result for kisan income query."
                )
            else:
                print("\n  WARNING: Expected PM-KISAN as top result.")
        else:
            print("  No results returned from match_schemes()")

    except Exception as e:
        print(f"  Final verification error: {e}")


if __name__ == "__main__":
    main()
