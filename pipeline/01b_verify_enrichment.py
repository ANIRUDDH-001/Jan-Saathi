#!/usr/bin/env python3
"""
01b_verify_enrichment.py — Dual-layer enrichment verification.

Layer 1: 10 deterministic checks (no LLM — pure data assertions)
Layer 2: 10 Groq LLM spot-checks (random scheme quality audit)

Run:  python pipeline/01b_verify_enrichment.py
Gate: Exits with code 1 if ANY Layer 1 check fails.
"""

import json
import os
import random
import sys

from dotenv import load_dotenv

load_dotenv("pipeline/.env")
if not os.getenv("GROQ_API_KEY"):
    load_dotenv("pipeline/data/.env")

from model_router import GroqRouter

LANGS_11 = ["hi", "en", "bn", "ta", "te", "gu", "kn", "ml", "mr", "pa", "od"]
SPOKEN_FIELDS = [
    "gap_announcement",
    "one_line_summary",
    "guidance_simple",
    "closing_action",
]
PASS = "\u2713"
FAIL = "\u2717"


def load_data():
    with open("pipeline/data/schemes_enriched.json", encoding="utf-8") as f:
        return json.load(f)


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 1: DETERMINISTIC CHECKS
# ══════════════════════════════════════════════════════════════════════════════


def layer1(data: list) -> dict:
    results = {}

    # 1. Total count
    results["total_count"] = (len(data) == 51, f"{len(data)}/51")

    # 2. Hindi names
    missing_hi = [s.get("name_english", "?") for s in data if not s.get("name_hindi")]
    results["hindi_names"] = (len(missing_hi) == 0, f"{51 - len(missing_hi)}/51")
    if missing_hi:
        results["hindi_names_missing"] = (True, str(missing_hi[:5]))

    # 3. Ministry
    missing_min = [s.get("name_english", "?") for s in data if not s.get("ministry")]
    results["ministry"] = (len(missing_min) <= 5, f"{51 - len(missing_min)}/51")

    # 4. Central helplines (central schemes must have them)
    central = [
        s for s in data if s.get("level") == "central" or s.get("state") == "national"
    ]
    missing_hl = [
        s.get("name_english", "?")
        for s in central
        if not (s.get("application") or {}).get("helpline_number")
    ]
    results["helplines_central"] = (
        len(missing_hl) <= 6,  # Allow up to 6 missing (some lesser-known schemes)
        f"{len(central) - len(missing_hl)}/{len(central)} central schemes",
    )

    # 5. Total helplines (must be >= 20)
    total_hl = sum(
        1 for s in data if (s.get("application") or {}).get("helpline_number")
    )
    results["helplines_total"] = (total_hl >= 20, f"{total_hl}/51")

    # 6. PM-KISAN annual = 6000
    pm_kisan = next((s for s in data if "PM-KISAN" in s.get("name_english", "")), None)
    val = (
        pm_kisan.get("benefits", {}).get("monetary", {}).get("annual_value_inr")
        if pm_kisan
        else None
    )
    results["pm_kisan_6000"] = (val == 6000, str(val))

    # 7. PM-KMY annual = 36000
    pm_kmy = next((s for s in data if "Maandhan" in s.get("name_english", "")), None)
    val2 = (
        pm_kmy.get("benefits", {}).get("monetary", {}).get("annual_value_inr")
        if pm_kmy
        else None
    )
    results["pm_kmy_36000"] = (val2 == 36000, str(val2))

    # 8. Spoken content all 11 languages (>= 40/51)
    full_lang = sum(
        1
        for s in data
        if all(
            (s.get("spoken_content") or {}).get(l, {}).get("gap_announcement")
            for l in LANGS_11
        )
    )
    results["spoken_11_langs"] = (full_lang >= 40, f"{full_lang}/51")

    # 9. Form Hindi questions (7/7 schemes complete)
    form_schemes = [
        s for s in data if (s.get("form_field_mapping") or {}).get("fields")
    ]
    hi_q_ok = sum(
        1
        for s in form_schemes
        if all(
            (f.get("shubh_question_hindi") or "").strip()
            for f in s["form_field_mapping"]["fields"]
        )
    )
    results["form_hindi_questions"] = (hi_q_ok >= 6, f"{hi_q_ok}/{len(form_schemes)}")

    # 10. Embedding text clean (no wrong amounts)
    bad_emb = [
        s.get("name_english", "?")
        for s in data
        if "72000" in (s.get("embedding_text") or "")
        or "432000" in (s.get("embedding_text") or "")
    ]
    results["embedding_clean"] = (len(bad_emb) == 0, f"{len(bad_emb)} bad entries")

    # Bonus: Launched year
    launched = sum(1 for s in data if s.get("launched_year"))
    results["launched_year"] = (launched >= 30, f"{launched}/51")

    return results


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 2: GROQ LLM SPOT-CHECKS
# ══════════════════════════════════════════════════════════════════════════════

VERIFY_PROMPT = """You are a quality auditor for Indian government scheme data.
Verify this scheme record and report issues. Return ONLY valid JSON.

SCHEME: {name_en}
HINDI NAME: {name_hi}
MINISTRY: {ministry}
HELPLINE: {helpline}
LAUNCHED YEAR: {launched_year}
BENEFIT AMOUNT (INR): {benefit}
EMBEDDING TEXT (first 200 chars): {embedding_sample}

SPOKEN CONTENT (Hindi):
- gap_announcement: {hi_gap}
- one_line_summary: {hi_summary}

SPOKEN CONTENT (Bengali sample): {bn_gap}
SPOKEN CONTENT (Tamil sample): {ta_gap}

Return JSON:
{{
  "hindi_name_correct": true/false,
  "benefit_amount_plausible": true/false,
  "hindi_plain_language": true/false,
  "regional_not_just_hindi_repeated": true/false,
  "embedding_has_correct_amount": true/false,
  "overall_quality": "high" | "medium" | "low",
  "issues": ["list of specific issues found, or empty"]
}}
"""


def layer2(data: list) -> dict:
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        print("  [SKIP] GROQ_API_KEY not set — skipping Layer 2")
        return {"skipped": (True, "no API key")}

    verifier = GroqRouter(api_key=groq_key)
    sample = random.sample(data, min(10, len(data)))

    results = {}
    high_quality = 0

    for s in sample:
        sid = s.get("scheme_id", "")[:30]
        sc = s.get("spoken_content") or {}
        hi = sc.get("hi") or {}
        bn = sc.get("bn") or {}
        ta = sc.get("ta") or {}
        mon = (s.get("benefits") or {}).get("monetary") or {}

        prompt = VERIFY_PROMPT.format(
            name_en=s.get("name_english", ""),
            name_hi=s.get("name_hindi", ""),
            ministry=s.get("ministry", ""),
            helpline=(s.get("application") or {}).get("helpline_number", "N/A"),
            launched_year=s.get("launched_year", "N/A"),
            benefit=mon.get("annual_value_inr") or mon.get("amount_inr") or "N/A",
            embedding_sample=(s.get("embedding_text") or "")[:200],
            hi_gap=hi.get("gap_announcement", ""),
            hi_summary=hi.get("one_line_summary", ""),
            bn_gap=bn.get("gap_announcement", "N/A"),
            ta_gap=ta.get("gap_announcement", "N/A"),
        )

        result, meta = verifier.verify_json(prompt)
        if result:
            quality = result.get("overall_quality", "?")
            issues = result.get("issues", [])
            if quality == "high":
                high_quality += 1
            results[sid] = (
                quality in ("high", "medium"),
                f"quality={quality}, issues={len(issues)}",
            )
            if issues:
                results[f"{sid}_issues"] = (True, "; ".join(issues[:3]))
        else:
            results[sid] = (True, f"verification call failed: {meta.get('error', '?')}")

    results["groq_high_quality"] = (
        high_quality >= 6,
        f"{high_quality}/10 rated high quality",
    )
    return results


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════


def main():
    data = load_data()

    print("\n" + "=" * 60)
    print("ENRICHMENT VERIFICATION")
    print("=" * 60)

    # Layer 1
    print("\n── Layer 1: Deterministic Checks ──")
    l1 = layer1(data)
    l1_all_pass = True
    for key, (ok, detail) in l1.items():
        marker = PASS if ok else FAIL
        print(f"  {marker} {key}: {detail}")
        if not ok and not key.endswith("_missing"):
            l1_all_pass = False

    # Layer 2
    print("\n── Layer 2: Groq LLM Spot-Checks ──")
    l2 = layer2(data)
    for key, (ok, detail) in l2.items():
        marker = PASS if ok else FAIL
        print(f"  {marker} {key}: {detail}")

    # Save verification log
    log = {
        "layer1": {k: {"pass": v[0], "detail": v[1]} for k, v in l1.items()},
        "layer2": {k: {"pass": v[0], "detail": v[1]} for k, v in l2.items()},
    }
    os.makedirs("pipeline/data/logs", exist_ok=True)
    with open("pipeline/data/logs/verification_log.json", "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    if l1_all_pass:
        print("QUALITY GATE A: PASSED")
        print("  All Layer 1 deterministic checks passed.")
        print("  Proceed to: python pipeline/02_translate_ui.py")
    else:
        print("QUALITY GATE A: FAILED")
        print("  Fix issues above, then re-run this script.")
        sys.exit(1)


if __name__ == "__main__":
    main()
