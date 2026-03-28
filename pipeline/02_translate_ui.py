#!/usr/bin/env python3
"""
02_translate_ui.py — Translate 126 LanguageContext keys to 9 languages via Sarvam Mayura.

Reads:  frontend/src/app/context/LanguageContext.tsx
Output: pipeline/data/ui_translations.json

Run:  python pipeline/02_translate_ui.py
Time: ~4 minutes (990 API calls at 200ms each)
"""

import json
import os
import re
import time

import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv("pipeline/.env")
if not os.getenv("SARVAM_API_KEY"):
    load_dotenv("pipeline/data/.env")

API_KEY = os.getenv("SARVAM_API_KEY")
TRANSLATE_URL = "https://api.sarvam.ai/translate"

TARGET_LANGS = {
    "bn": "bn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "pa": "pa-IN",
    "od": "od-IN",
}


def translate_text(text: str, target_code: str, retries: int = 3) -> str:
    """Translate Hindi text to target language via Sarvam Mayura API."""
    if not text or not text.strip():
        return text

    for attempt in range(retries):
        try:
            resp = requests.post(
                TRANSLATE_URL,
                headers={
                    "API-Subscription-Key": API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "input": text,
                    "source_language_code": "hi-IN",
                    "target_language_code": target_code,
                    "speaker_gender": "Male",
                    "mode": "formal",
                    "model": "mayura:v1",
                    "enable_preprocessing": True,
                },
                timeout=20,
            )
            resp.raise_for_status()
            result = resp.json().get("translated_text", "")
            if result and result.strip():
                return result.strip()
            # Empty result — fall through to retry
        except requests.exceptions.HTTPError as e:
            if resp.status_code == 429:
                wait = 10 * (attempt + 1)
                tqdm.write(f"  Rate limited — waiting {wait}s")
                time.sleep(wait)
            else:
                tqdm.write(f"  HTTP error ({target_code}): {e}")
                time.sleep(2)
        except Exception as e:
            tqdm.write(f"  Translate error ({target_code}): {e}")
            time.sleep(2)

    # All retries failed — return Hindi as fallback
    return text


def extract_translation_keys(filepath: str) -> dict:
    """Parse LanguageContext.tsx and extract {key: {hi: ..., en: ...}}."""
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    result = {}

    # Match translation entries: 'key': { hi: '...', en: '...' [, ...] }
    # Handle multi-line blocks between the translations object braces
    pattern = r"'([^']+)':\s*\{([^}]+)\}"
    for m in re.finditer(pattern, content, re.DOTALL):
        key = m.group(1)
        block = m.group(2)

        # Only process keys that look like translation keys (contain a dot)
        if "." not in key:
            continue

        langs = {}
        # Extract all language values
        for lang_match in re.finditer(r"\b(\w+):\s*'((?:[^'\\]|\\.)*)'", block):
            lang_code = lang_match.group(1)
            lang_val = lang_match.group(2).replace("\\'", "'")
            langs[lang_code] = lang_val

        if langs.get("hi") or langs.get("en"):
            result[key] = langs

    return result


def main():
    ctx_path = "frontend/src/app/context/LanguageContext.tsx"
    out_path = "pipeline/data/ui_translations.json"

    print("Extracting translation keys from LanguageContext.tsx...")
    all_keys = extract_translation_keys(ctx_path)
    print(f"  Found {len(all_keys)} translation keys")

    # Load existing progress (crash recovery)
    if os.path.exists(out_path):
        with open(out_path, encoding="utf-8") as f:
            output = json.load(f)
        print(f"  Resuming from {len(output)} existing keys")
    else:
        output = {}

    # Count how many need translation
    needs_translation = 0
    for key, langs in all_keys.items():
        for lang_code in TARGET_LANGS:
            existing = output.get(key, {}).get(lang_code, "")
            if not existing or not existing.strip():
                needs_translation += 1

    print(f"  {needs_translation} translations needed")

    if needs_translation == 0:
        print("\n  All translations already complete!")
        return

    completed = 0
    for key_idx, (key, langs) in enumerate(tqdm(all_keys.items(), desc="Translating")):
        if key not in output:
            output[key] = dict(langs)

        hi_text = langs.get("hi", "")
        if not hi_text:
            continue

        for lang_code, api_code in TARGET_LANGS.items():
            # Skip if already translated
            existing = output[key].get(lang_code, "")
            if existing and existing.strip():
                continue

            translated = translate_text(hi_text, api_code)
            output[key][lang_code] = translated
            completed += 1
            time.sleep(0.2)  # Rate limit buffer

        # Save progress every 10 keys
        if (key_idx + 1) % 10 == 0:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(output, f, indent=2, ensure_ascii=False)

    # Final save
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n  Translations completed: {completed}")
    print(f"  Output: {out_path}")
    print(f"  Total keys: {len(output)}")
    print("\n  Next: python pipeline/02b_patch_language_context.py")


if __name__ == "__main__":
    main()
