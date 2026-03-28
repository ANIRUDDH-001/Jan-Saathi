#!/usr/bin/env python3
"""
01_enrich.py — 4-pass Gemini enrichment for 51 agriculture schemes.

Pass 1: Helplines + Launched Year (factual gaps)
Pass 2: Regional spoken content (9 languages for all 51 schemes)
Pass 3: Form Hindi questions (7 form-mapped schemes via Gemini Flash)
Pass 4: Embedding text refresh (all 51 schemes)

Run:  python pipeline/01_enrich.py
Time: ~35 minutes (rate-limited by Gemma 27B's 15K TPM)

Uses: GeminiRouter (Gemma 27B primary, 12B/4B fallback, Flash for forms)
"""

import copy
import json
import os
import re
import time
from datetime import datetime

from dotenv import load_dotenv
from tqdm import tqdm

# Load env from pipeline/.env (spec location)
load_dotenv("pipeline/.env")
# Fallback: also try the old location
if not os.getenv("GEMINI_API_KEY"):
    load_dotenv("pipeline/data/.env")

from model_router import GeminiRouter

router = GeminiRouter(api_key=os.getenv("GEMINI_API_KEY"))


# ══════════════════════════════════════════════════════════════════════════════
# HARDCODED GROUND TRUTH — never overridden by any LLM
# ══════════════════════════════════════════════════════════════════════════════

PATCHES = {
    "pradhan-mantri-kisan-samman-nidhi-pm-kisan-nationa": {
        "benefits.monetary.amount_inr": 6000,
        "benefits.monetary.annual_value_inr": 6000,
        "benefits.monetary.frequency": "annual",
        "eligibility.land_size_max_hectares": None,
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "application.helpline_number": "155261",
        "application.helpline_number_alt": "011-23381092",
        "launched_year": 2019,
        "_correct_rupee": "6000",
    },
    "pm-kisan-maandhan-yojana-pm-kmy-national": {
        "benefits.monetary.amount_inr": 3000,
        "benefits.monetary.annual_value_inr": 36000,
        "benefits.monetary.frequency": "monthly",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "application.helpline_number": "1800-3000-3468",
        "form_field_mapping.form_name": "PM-KMY-APPLICATION-CUM-MANDATE-UIN512G312V01",
        "form_field_mapping.pdf_template_url": "https://pmkmy.gov.in/",
        "launched_year": 2019,
        "_correct_rupee": "36000",
    },
    "kisan-credit-card-kcc-national": {
        "ministry": "Ministry of Finance",
        "application.helpline_number": "1800-200-0053",
        "launched_year": 1998,
        "_correct_rupee": "300000",
    },
}

MINISTRY_MAP = {
    "pmfby": "Ministry of Agriculture and Farmers Welfare",
    "pmksy": "Ministry of Jal Shakti",
    "pm-kusum": "Ministry of New and Renewable Energy",
    "soil-health": "Ministry of Agriculture and Farmers Welfare",
    "e-nam": "Ministry of Agriculture and Farmers Welfare",
    "rkvy": "Ministry of Agriculture and Farmers Welfare",
    "pkvy": "Ministry of Agriculture and Farmers Welfare",
    "smam": "Ministry of Agriculture and Farmers Welfare",
    "nfsm": "Ministry of Agriculture and Farmers Welfare",
    "nbhm": "Ministry of Agriculture and Farmers Welfare",
    "mgnrega": "Ministry of Rural Development",
    "midh": "Ministry of Agriculture and Farmers Welfare",
    "bamboo": "Ministry of Agriculture and Farmers Welfare",
    "pm-aasha": "Ministry of Agriculture and Farmers Welfare",
    "aif": "Ministry of Agriculture and Farmers Welfare",
    "pm-fme": "Ministry of Food Processing Industries",
    "pmmsy": "Ministry of Fisheries Animal Husbandry and Dairying",
    "gokul": "Ministry of Fisheries Animal Husbandry and Dairying",
    "livestock": "Ministry of Fisheries Animal Husbandry and Dairying",
    "blue-revolution": "Ministry of Fisheries Animal Husbandry and Dairying",
    "dairy": "Ministry of Fisheries Animal Husbandry and Dairying",
    "nmsa": "Ministry of Agriculture and Farmers Welfare",
    "nrlm": "Ministry of Rural Development",
}

HELPLINE_MAP = {
    "pmfby": "14447",
    "pmksy": "1800-180-1551",
    "e-nam": "1800-270-0224",
    "mgnrega": "1800-345-2244",
    "pmmsy": "1800-425-1660",
    "midh": "1800-180-1551",
}

OCCUPATION_FIXES = {
    "national-beekeeping-and-honey-mission-nbhm-national": ["beekeeper", "farmer"],
    "blue-revolution-integrated-development-of-fisherie": [
        "fisherman",
        "aquaculture_farmer",
    ],
    "national-livestock-mission-national": ["dairy_farmer", "livestock_farmer"],
    "national-dairy-plan-ndp-national": ["dairy_farmer"],
    "pradhan-mantri-matsya-sampada-yojana-pmmsy-national": [
        "fisherman",
        "aquaculture_farmer",
    ],
}


PLAIN_LANG = """
PLAIN LANGUAGE MANDATORY — every string you write must obey:
- Max 15 words per sentence
- No jargon: no submission/verification/disbursement/beneficiary/documentation/facilitate
- Active voice: "Aap jaao" not "Jana chahiye"
- Concrete: "CSC wala bharta hai" not "VLE processes the application"
- Numbers <= 10 spelled as Hindi words: "teen saal" not "3 saal"
- Every sentence must be speakable and clear on first hearing
"""

LANGS_11 = ["hi", "en", "bn", "ta", "te", "gu", "kn", "ml", "mr", "pa", "od"]
LANGS_REGIONAL = ["bn", "ta", "te", "gu", "kn", "ml", "mr", "pa", "od"]
SPOKEN_FIELDS = [
    "gap_announcement",
    "one_line_summary",
    "guidance_simple",
    "closing_action",
]


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════


def apply_nested_patch(obj: dict, path: str, value) -> None:
    """Apply a dot-notation patch to a nested dict."""
    parts = path.split(".")
    for part in parts[:-1]:
        obj = obj.setdefault(part, {})
    obj[parts[-1]] = value


def apply_hardcoded_patches(scheme: dict) -> dict:
    """Apply all hardcoded patches + ministry/helpline/occupation maps."""
    scheme = copy.deepcopy(scheme)
    sid = scheme.get("scheme_id", "")

    # Hardcoded patches
    if sid in PATCHES:
        for path, val in PATCHES[sid].items():
            if path.startswith("_"):
                continue
            apply_nested_patch(scheme, path, val)

    # Occupation fixes
    if sid in OCCUPATION_FIXES:
        scheme.setdefault("eligibility", {})["occupation"] = OCCUPATION_FIXES[sid]

    # Ministry from map
    if not scheme.get("ministry"):
        for key, ministry in MINISTRY_MAP.items():
            if key in sid.lower():
                scheme["ministry"] = ministry
                break

    # Helpline from map
    app = scheme.setdefault("application", {})
    if not app.get("helpline_number"):
        for key, num in HELPLINE_MAP.items():
            if key in sid.lower():
                app["helpline_number"] = num
                break

    return scheme


def save_progress(schemes: list, path: str) -> None:
    """Atomic save: write to temp then rename."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(schemes, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


def log_entry(
    log: list, sid: str, pass_name: str, model: str, fields: list, error: str = ""
) -> None:
    log.append(
        {
            "scheme_id": sid,
            "pass": pass_name,
            "model": model,
            "fields_filled": fields,
            "error": error,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


# ══════════════════════════════════════════════════════════════════════════════
# PASS 1: HELPLINES + LAUNCHED YEAR
# ══════════════════════════════════════════════════════════════════════════════

PASS1_PROMPT = """You are a factual database of Indian government schemes.

SCHEME: {name}
ACRONYM: {acronym}
MINISTRY: {ministry}
STATE: {state}
PORTAL: {portal}

Return ONLY valid JSON — no markdown, no explanation:
{{
  "helpline_number": "toll-free number as string, or null if unknown",
  "launched_year": integer year the scheme was launched, or null if unknown
}}

RULES:
- Do NOT invent numbers. Real helplines only.
- If a state scheme has no known national helpline, return null.
- launched_year: use your training data. PM-KISAN is 2019, PMFBY is 2016, etc.
"""


def pass1_helplines_and_years(schemes: list, log: list) -> list:
    """Fill missing helpline_number and launched_year."""
    print("\n══ Pass 1: Helplines + Launched Years ══")

    needs_work = [
        i
        for i, s in enumerate(schemes)
        if not (s.get("application") or {}).get("helpline_number")
        or not s.get("launched_year")
    ]
    print(f"  {len(needs_work)} schemes need helpline or launched_year")

    for idx in tqdm(needs_work, desc="Pass 1"):
        s = schemes[idx]
        sid = s.get("scheme_id", "")

        # Skip hardcoded schemes (they already have correct values)
        if sid in PATCHES:
            continue

        prompt = PASS1_PROMPT.format(
            name=s.get("name_english", ""),
            acronym=s.get("acronym", ""),
            ministry=s.get("ministry", ""),
            state=s.get("state", "national"),
            portal=(s.get("application") or {}).get("portal_url", ""),
        )

        result, meta = router.generate_json(prompt, temperature=0.05)

        fields_filled = []
        if result:
            # Helpline — only fill if missing
            hl = result.get("helpline_number")
            if hl and isinstance(hl, str) and hl.strip() and hl.lower() != "null":
                if not (s.get("application") or {}).get("helpline_number"):
                    s.setdefault("application", {})["helpline_number"] = hl.strip()
                    fields_filled.append("helpline_number")

            # Launched year — only fill if missing
            ly = result.get("launched_year")
            if ly and isinstance(ly, int) and 1947 <= ly <= 2026:
                if not s.get("launched_year"):
                    s["launched_year"] = ly
                    fields_filled.append("launched_year")

        log_entry(
            log,
            sid,
            "pass1",
            meta.get("model", "?"),
            fields_filled,
            meta.get("error", ""),
        )

        # Rate limit buffer (Gemma 27B: 15K TPM → ~3 calls/min)
        time.sleep(3)

        # Save every 10 schemes
        if len([i2 for i2 in needs_work if i2 <= idx]) % 10 == 0:
            save_progress(schemes, "pipeline/data/schemes_enriched.json")

    save_progress(schemes, "pipeline/data/schemes_enriched.json")
    return schemes


# ══════════════════════════════════════════════════════════════════════════════
# PASS 2: REGIONAL SPOKEN CONTENT (9 languages)
# ══════════════════════════════════════════════════════════════════════════════

PASS2_PROMPT = """Translate the Hindi and English spoken content for this government scheme to 9 Indian languages.
Maintain plain language — speakable by a farmer on first hearing.

SCHEME: {name}

HINDI CONTENT:
- gap_announcement: {hi_gap}
- one_line_summary: {hi_summary}
- guidance_simple: {hi_guidance}
- closing_action: {hi_closing}

ENGLISH CONTENT:
- gap_announcement: {en_gap}
- one_line_summary: {en_summary}
- guidance_simple: {en_guidance}
- closing_action: {en_closing}

{plain_lang}

Return ONLY valid JSON — no markdown:
{{
  "bn": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "ta": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "te": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "gu": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "kn": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "ml": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "mr": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "pa": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}},
  "od": {{"gap_announcement": "...", "one_line_summary": "...", "guidance_simple": "...", "closing_action": "..."}}
}}

RULES:
- Translate from Hindi primarily, use English as reference
- Keep sentences under 15 words
- Keep proper nouns (PM-KISAN, CSC) in original form
- Do NOT return empty strings — every field must have content
"""


def _needs_regional(s: dict) -> bool:
    """True if any regional language is missing any spoken_content field."""
    sc = s.get("spoken_content") or {}
    for lang in LANGS_REGIONAL:
        lang_obj = sc.get(lang)
        if not isinstance(lang_obj, dict):
            return True
        for field in SPOKEN_FIELDS:
            if not (lang_obj.get(field) or "").strip():
                return True
    return False


def pass2_regional_translations(schemes: list, log: list) -> list:
    """Fill missing regional spoken_content for all 51 schemes."""
    print("\n══ Pass 2: Regional Spoken Content (9 languages) ══")

    needs_work = [i for i, s in enumerate(schemes) if _needs_regional(s)]
    print(f"  {len(needs_work)} schemes need regional translations")

    for idx in tqdm(needs_work, desc="Pass 2"):
        s = schemes[idx]
        sid = s.get("scheme_id", "")
        sc = s.get("spoken_content") or {}
        hi = sc.get("hi") or {}
        en = sc.get("en") or {}

        # Skip if no source content
        if not hi.get("gap_announcement") and not en.get("gap_announcement"):
            log_entry(log, sid, "pass2", "skip", [], "no hi/en source content")
            continue

        prompt = PASS2_PROMPT.format(
            name=s.get("name_english", ""),
            hi_gap=hi.get("gap_announcement", ""),
            hi_summary=hi.get("one_line_summary", ""),
            hi_guidance=hi.get("guidance_simple", ""),
            hi_closing=hi.get("closing_action", ""),
            en_gap=en.get("gap_announcement", ""),
            en_summary=en.get("one_line_summary", ""),
            en_guidance=en.get("guidance_simple", ""),
            en_closing=en.get("closing_action", ""),
            plain_lang=PLAIN_LANG,
        )

        result, meta = router.generate_json(prompt, temperature=0.15)

        fields_filled = []
        if result:
            s.setdefault("spoken_content", {})
            for lang in LANGS_REGIONAL:
                lang_data = result.get(lang)
                if not isinstance(lang_data, dict):
                    continue
                s["spoken_content"].setdefault(lang, {})
                for field in SPOKEN_FIELDS:
                    val = lang_data.get(field, "")
                    if isinstance(val, str) and val.strip():
                        # Only fill if currently empty
                        existing = s["spoken_content"][lang].get(field, "")
                        if not existing or not existing.strip():
                            s["spoken_content"][lang][field] = val.strip()
                            fields_filled.append(f"{lang}.{field}")

        log_entry(
            log,
            sid,
            "pass2",
            meta.get("model", "?"),
            fields_filled,
            meta.get("error", ""),
        )
        time.sleep(3)

        if len([i2 for i2 in needs_work if i2 <= idx]) % 5 == 0:
            save_progress(schemes, "pipeline/data/schemes_enriched.json")

    save_progress(schemes, "pipeline/data/schemes_enriched.json")
    return schemes


# ══════════════════════════════════════════════════════════════════════════════
# PASS 3: FORM HINDI QUESTIONS (7 form-mapped schemes)
# ══════════════════════════════════════════════════════════════════════════════

PASS3_PROMPT = """Generate Hindi voice questions for a government scheme form.
These questions are asked by "Ved" — Jan Saathi's Hindi voice assistant — to collect form data from farmers by phone.

SCHEME: {name}
MINISTRY: {ministry}

FORM FIELDS (labels from the official form):
{field_list}

{plain_lang}

Return ONLY valid JSON — keys are EXACT form field labels, values are Hindi questions:
{{
  "Field Label 1": "plain Hindi question Ved asks the farmer (max 15 words, speakable)",
  "Field Label 2": "..."
}}

RULES:
- Questions must be natural spoken Hindi — as if asking a farmer grandfather
- Max 15 words per question
- Use "aap" (आप) not "tum"
- Use familiar terms: "gaon" not "village", "khet" not "agricultural land"
- Do NOT skip any field — generate a question for every label listed above
"""


def pass3_form_questions(schemes: list, log: list) -> list:
    """Generate shubh_question_hindi for all form fields using Gemini Flash."""
    print("\n══ Pass 3: Form Hindi Questions (Gemini Flash) ══")

    form_schemes = [
        (i, s)
        for i, s in enumerate(schemes)
        if (s.get("form_field_mapping") or {}).get("fields")
    ]
    print(f"  {len(form_schemes)} form-mapped schemes")

    for idx, s in tqdm(form_schemes, desc="Pass 3"):
        sid = s.get("scheme_id", "")
        ffm = s["form_field_mapping"]
        fields = ffm["fields"]

        # Check how many fields need questions
        needs = [f for f in fields if not (f.get("shubh_question_hindi") or "").strip()]
        if not needs:
            log_entry(
                log, sid, "pass3", "skip", [], "all fields already have questions"
            )
            continue

        field_labels = [
            f.get("form_field_label", "") for f in fields if f.get("form_field_label")
        ]
        field_list = "\n".join(f"- {label}" for label in field_labels)

        prompt = PASS3_PROMPT.format(
            name=s.get("name_english", ""),
            ministry=s.get("ministry", ""),
            field_list=field_list,
            plain_lang=PLAIN_LANG,
        )

        # Use Gemini Flash for highest quality Hindi
        result, meta = router.generate_json(prompt, use_flash=True, temperature=0.1)

        fields_filled = []
        if result:
            for field in fields:
                label = field.get("form_field_label", "")
                if not label:
                    continue
                question = result.get(label)
                if isinstance(question, str) and question.strip():
                    field["shubh_question_hindi"] = question.strip()
                    fields_filled.append(label)

        log_entry(
            log,
            sid,
            "pass3",
            meta.get("model", "?"),
            fields_filled,
            meta.get("error", ""),
        )
        time.sleep(5)  # Flash has 5 RPM limit

    save_progress(schemes, "pipeline/data/schemes_enriched.json")
    return schemes


# ══════════════════════════════════════════════════════════════════════════════
# PASS 4: EMBEDDING TEXT REFRESH
# ══════════════════════════════════════════════════════════════════════════════

PASS4_PROMPT = """Generate search-optimized embedding text for this government scheme.
This text will be used for semantic search — farmers search in Hindi, English, and Hinglish.

SCHEME:
- English name: {name_en}
- Hindi name: {name_hi}
- Acronym: {acronym}
- Ministry: {ministry}
- State: {state}
- Benefit: {benefit} rupees {frequency}
- Sector: {sector}
- Occupation types: {occupation}

Return ONLY a single line of text (NOT JSON). Include ALL of:
1. Full English name
2. Full Hindi name
3. Acronym/short name
4. EXACT benefit amount in rupees (use {benefit} — do NOT change this number)
5. State or "national all states"
6. Occupation keywords
7. Ministry name
8. Hinglish synonyms farmers would use (e.g., "kisan", "fasal bima", "pension")

Example output for PM-KISAN:
pradhan mantri kisan samman nidhi pm-kisan प्रधानमंत्री किसान सम्मान निधि 6000 rupees income support annual farmer kisan Ministry of Agriculture national all states kisan samman nidhi paise income sarkari yojana
"""


def pass4_embedding_refresh(schemes: list, log: list) -> list:
    """Regenerate embedding_text for all 51 schemes with latest data."""
    print("\n══ Pass 4: Embedding Text Refresh ══")

    for i, s in enumerate(tqdm(schemes, desc="Pass 4")):
        sid = s.get("scheme_id", "")
        e = s.get("eligibility") or {}
        mon = (s.get("benefits") or {}).get("monetary") or {}

        benefit = mon.get("annual_value_inr") or mon.get("amount_inr") or 0
        freq = mon.get("frequency", "")

        # For hardcoded schemes, force correct rupee value
        correct_rupee = PATCHES.get(sid, {}).get("_correct_rupee")
        if correct_rupee:
            benefit = int(correct_rupee)

        prompt = PASS4_PROMPT.format(
            name_en=s.get("name_english", ""),
            name_hi=s.get("name_hindi", ""),
            acronym=s.get("acronym", ""),
            ministry=s.get("ministry", ""),
            state=s.get("state", "national"),
            benefit=benefit,
            frequency=freq,
            sector=s.get("sector", "agriculture"),
            occupation=" ".join(e.get("occupation", ["farmer"])),
        )

        result, meta = router.generate_text(prompt, temperature=0.1)

        if result:
            emb = result.strip()
            # Safety: ensure correct rupee amount is present
            if correct_rupee:
                # Remove any wrong large numbers the model might have introduced
                emb = re.sub(
                    r"\b(?!{cr}\b)\d{{5,6}}\b".format(cr=correct_rupee), "", emb
                )
                if correct_rupee not in emb:
                    emb = f"{correct_rupee} rupees {emb}"
            s["embedding_text"] = emb.strip()
            log_entry(log, sid, "pass4", meta.get("model", "?"), ["embedding_text"])
        else:
            log_entry(
                log, sid, "pass4", meta.get("model", "?"), [], meta.get("error", "")
            )

        time.sleep(3)

        if (i + 1) % 10 == 0:
            save_progress(schemes, "pipeline/data/schemes_enriched.json")

    save_progress(schemes, "pipeline/data/schemes_enriched.json")
    return schemes


# ══════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ══════════════════════════════════════════════════════════════════════════════


def main():
    os.makedirs("pipeline/data/logs", exist_ok=True)

    # Load current enriched data (preserves existing good data)
    with open("pipeline/data/schemes_enriched.json", encoding="utf-8") as f:
        schemes = json.load(f)

    print(f"Loaded {len(schemes)} schemes from schemes_enriched.json")
    print("Strategy: Preserve existing good data, fill gaps only\n")

    # Apply hardcoded patches to every scheme first
    schemes = [apply_hardcoded_patches(s) for s in schemes]
    save_progress(schemes, "pipeline/data/schemes_enriched.json")
    print("Applied hardcoded patches (PM-KISAN, PM-KMY, KCC + ministry/helpline maps)")

    enrichment_log = []

    # Run all 4 passes
    schemes = pass1_helplines_and_years(schemes, enrichment_log)
    schemes = pass2_regional_translations(schemes, enrichment_log)
    schemes = pass3_form_questions(schemes, enrichment_log)
    schemes = pass4_embedding_refresh(schemes, enrichment_log)

    # Final save
    save_progress(schemes, "pipeline/data/schemes_enriched.json")

    # Save enrichment log
    with open("pipeline/data/logs/enrichment_log.json", "w", encoding="utf-8") as f:
        json.dump(enrichment_log, f, indent=2, ensure_ascii=False)

    # Summary
    print("\n" + "=" * 60)
    print("ENRICHMENT COMPLETE")
    print("=" * 60)
    hl = sum(1 for s in schemes if (s.get("application") or {}).get("helpline_number"))
    ly = sum(1 for s in schemes if s.get("launched_year"))
    full_lang = sum(1 for s in schemes if not _needs_regional(s))
    form_ok = sum(
        1
        for s in schemes
        if (s.get("form_field_mapping") or {}).get("fields")
        and all(
            f.get("shubh_question_hindi") for f in s["form_field_mapping"]["fields"]
        )
    )
    print(f"  Helplines:       {hl}/51")
    print(f"  Launched years:  {ly}/51")
    print(f"  Full 11 langs:   {full_lang}/51")
    print(f"  Form questions:  {form_ok}/7")
    print(f"  Log entries:     {len(enrichment_log)}")
    print("\n  Output: pipeline/data/schemes_enriched.json")
    print("  Log:    pipeline/data/logs/enrichment_log.json")
    print("\n  Next:   python pipeline/01b_verify_enrichment.py")


if __name__ == "__main__":
    main()
