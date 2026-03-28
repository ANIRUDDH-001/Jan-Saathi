#!/usr/bin/env python3
"""
03_embed_ingest.py — Embed schemes with Cohere + ingest to Supabase.
"""

import json
import os
import time

import cohere
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

load_dotenv("pipeline/.env")
if not os.getenv("COHERE_API_KEY"):
    load_dotenv("pipeline/data/.env")

co = cohere.Client(os.getenv("COHERE_API_KEY"))
sb = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)

EMBED_MODEL = "embed-multilingual-v3.0"
BATCH_SIZE = 96  # Cohere max per request


def build_eligibility_chunk(s: dict) -> str:
    e = s.get("eligibility") or {}
    parts = [
        s.get("name_english", ""),
        s.get("name_hindi", "") or "",
        s.get("acronym", "") or "",
        f"state:{s.get('state', 'national')}",
        f"occupation:{' '.join(e.get('occupation', ['farmer']))}",
        e.get("eligibility_summary_english", "") or e.get("eligibility_summary", ""),
    ]
    if e.get("income_max_annual_inr"):
        parts.append(f"income_limit:{e['income_max_annual_inr']}")
    if e.get("bpl_card_required"):
        parts.append("bpl_required")
    return " | ".join(filter(None, parts))


def to_db_row(s: dict) -> dict:
    e = s.get("eligibility") or {}
    b = s.get("benefits") or {}
    mon = b.get("monetary") or {}
    nm = b.get("non_monetary") or {}
    app = s.get("application") or {}
    ffm = s.get("form_field_mapping") or {}
    src = s.get("source") or {}
    dq = s.get("data_quality") or {}
    la = s.get("live_api") or {}

    return {
        "scheme_id": s.get("scheme_id"),
        "name_english": s.get("name_english"),
        "name_hindi": s.get("name_hindi"),
        "name_short": s.get("name_short"),
        "acronym": s.get("acronym"),
        "level": s.get("level", "central"),
        "state": s.get("state", "national"),
        "states_applicable": s.get("states_applicable", ["all"]),
        "sector": s.get("sector", "agriculture"),
        "sub_sector": s.get("sub_sector"),
        "ministry": s.get("ministry"),
        "department": s.get("department"),
        "implementing_agency": s.get("implementing_agency"),
        "launched_year": s.get("launched_year"),
        "scheme_status": s.get("scheme_status", "active"),
        "scheme_type": s.get("scheme_type"),
        "occupation": e.get("occupation", ["farmer"]),
        "occupation_subtypes": e.get("occupation", ["crop_farmer"]),
        "land_ownership_req": e.get("land_ownership_required", False),
        "land_size_max_ha": e.get("land_size_max_hectares"),
        "land_size_min_ha": e.get("land_size_min_hectares"),
        "income_max_annual": e.get("income_max_annual_inr"),
        "age_min": e.get("age_min"),
        "age_max": e.get("age_max"),
        "aadhaar_required": e.get("aadhaar_required", False),
        "bank_account_required": e.get("bank_account_required", False),
        "bpl_required": e.get("bpl_card_required", False),
        "excluded_categories": e.get("excluded_categories", []),
        "eligibility_summary": e.get("eligibility_summary_english")
        or e.get("eligibility_summary", ""),
        "eligibility_notes": e.get("eligibility_notes", ""),
        "has_monetary_benefit": b.get("has_monetary_benefit", False),
        "benefit_amount_inr": mon.get("amount_inr") or 0,
        "benefit_annual_inr": mon.get("annual_value_inr") or 0,
        "benefit_frequency": mon.get("frequency"),
        "benefit_payment_mode": mon.get("payment_mode"),
        "benefit_description": mon.get("benefit_description_english", ""),
        "has_non_monetary": nm.get("has_non_monetary_benefit", False),
        "non_monetary_desc": nm.get("description_english"),
        "application_modes": app.get("mode", ["offline"]),
        "portal_url": app.get("portal_url"),
        "portal_url_direct": app.get("portal_url_direct_register"),
        "form_name": ffm.get("form_name"),
        "form_pdf_url": ffm.get("pdf_template_url"),
        "application_fee": app.get("application_fee_inr", 0),
        "helpline_number": app.get("helpline_number"),
        "helpline_alt": app.get("helpline_number_alt"),
        "grievance_portal": app.get("grievance_portal"),
        "processing_days": app.get("processing_time_days"),
        "auto_renewal": app.get("auto_renewal", False),
        "status_check_url": app.get("status_check_url"),
        "status_check_method": app.get("status_check_method"),
        "spoken_guidance": app.get("spoken_guidance_english"),
        "spoken_content": s.get("spoken_content", {}),
        "form_field_mapping": ffm,
        "embedding_text": s.get("embedding_text", ""),
        "keywords": s.get("keywords", []),
        "tags": s.get("tags", []),
        "has_public_api": la.get("has_public_api", False),
        "api_type": la.get("api_type"),
        "source_url": src.get("primary_url"),
        "scraped_at": src.get("scraped_at"),
        "data_source_type": src.get("data_source_type", "official_portal"),
        "eligibility_complete": dq.get("eligibility_complete", True),
        "benefits_complete": dq.get("benefits_complete", True),
        "application_complete": dq.get("application_complete", True),
        "documents_complete": dq.get("documents_complete", True),
        "completeness_score": dq.get("completeness_score", 0.8),
        "demo_ready": dq.get("demo_ready", False),
        "is_verified": True,
        "review_notes": dq.get("review_notes", ""),
    }


def ingest():
    os.makedirs("pipeline/data/logs", exist_ok=True)
    ingest_log = []

    with open("pipeline/data/schemes_enriched.json", encoding="utf-8") as f:
        schemes = json.load(f)

    print(f"Ingesting {len(schemes)} schemes into Supabase...")

    chunks_to_embed = []

    print("\n── Upserting schemes ──")
    for s in tqdm(schemes, desc="Upsert"):
        row = to_db_row(s)
        try:
            result = sb.table("schemes").upsert(row, on_conflict="scheme_id").execute()
            db_id = result.data[0]["id"]

            chunks_to_embed.append(
                {
                    "db_id": db_id,
                    "type": "full",
                    "content": s.get("embedding_text", ""),
                }
            )
            chunks_to_embed.append(
                {
                    "db_id": db_id,
                    "type": "eligibility",
                    "content": build_eligibility_chunk(s),
                }
            )

            docs = (s.get("application") or {}).get("documents_required", [])
            if docs:
                try:
                    sb.table("scheme_documents").delete().eq(
                        "scheme_id", db_id
                    ).execute()
                    sb.table("scheme_documents").insert(
                        [
                            {
                                "scheme_id": db_id,
                                "document": d.get("document", ""),
                                "mandatory": d.get("mandatory", True),
                                "notes": d.get("notes"),
                            }
                            for d in docs
                        ]
                    ).execute()
                except Exception as e:
                    tqdm.write(f"  Doc insert warning: {e}")

            ingest_log.append(
                {
                    "scheme_id": s.get("scheme_id"),
                    "db_id": db_id,
                    "status": "ok",
                    "docs": len(docs),
                }
            )

        except Exception as e:
            tqdm.write(f"  Upsert error ({s.get('scheme_id', '?')}): {e}")
            ingest_log.append(
                {
                    "scheme_id": s.get("scheme_id"),
                    "status": "error",
                    "error": str(e)[:200],
                }
            )

    print(f"\n── Embedding {len(chunks_to_embed)} chunks ──")

    try:
        # Clear old chunks using a safely identifiable dummy check to delete all rows.
        sb.table("scheme_chunks").delete().neq(
            "chunk_type", "invalid_type_to_clear_all"
        ).execute()
        print("  Cleared old chunks")
    except Exception as e:
        print(f"  Warning clearing chunks: {e}")

    for i in tqdm(range(0, len(chunks_to_embed), BATCH_SIZE), desc="Embedding"):
        batch = chunks_to_embed[i : i + BATCH_SIZE]
        texts = [c["content"] for c in batch]

        non_empty = [(j, t) for j, t in enumerate(texts) if t.strip()]
        if not non_empty:
            continue

        try:
            resp = co.embed(
                texts=[t for _, t in non_empty],
                model=EMBED_MODEL,
                input_type="search_document",
                embedding_types=["float"],
            )
            embeddings = resp.embeddings.float

            rows = []
            emb_idx = 0
            for j, t in non_empty:
                rows.append(
                    {
                        "scheme_id": batch[j]["db_id"],
                        "chunk_type": batch[j]["type"],
                        "content": batch[j]["content"],
                        "embedding": embeddings[emb_idx],
                    }
                )
                emb_idx += 1

            sb.table("scheme_chunks").insert(rows).execute()

        except Exception as e:
            tqdm.write(f"  Embed batch error: {e}")
        time.sleep(1)

    with open("pipeline/data/logs/ingest_log.json", "w", encoding="utf-8") as f:
        json.dump(ingest_log, f, indent=2, ensure_ascii=False)

    ok_count = sum(1 for l in ingest_log if l.get("status") == "ok")
    err_count = sum(1 for l in ingest_log if l.get("status") == "error")

    print(f"\n{'=' * 60}")
    print("INGEST COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Schemes upserted: {ok_count}/51")
    print(f"  Errors: {err_count}")
    print(f"  Chunks created: {len(chunks_to_embed)}")
    print("  Log: pipeline/data/logs/ingest_log.json")
    print("\n  Next: python pipeline/03b_verify_ingest.py")


if __name__ == "__main__":
    ingest()
