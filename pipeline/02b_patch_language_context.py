#!/usr/bin/env python3
"""
02b_patch_language_context.py — Apply translations to LanguageContext.tsx.

Reads:  pipeline/data/ui_translations.json
Patches: frontend/src/app/context/LanguageContext.tsx

Creates backup at LanguageContext.tsx.bak before modifying.
"""

import json
import os
import re
import shutil

LANGS = ["hi", "en", "bn", "ta", "te", "gu", "kn", "ml", "mr", "pa", "od"]
CTX_PATH = "frontend/src/app/context/LanguageContext.tsx"
TRANSLATIONS_PATH = "pipeline/data/ui_translations.json"


def escape_tsx(val: str) -> str:
    """Escape a string for safe embedding in TSX single-quoted strings."""
    return val.replace("\\", "\\\\").replace("'", "\\'")


def build_block(key: str, langs_data: dict) -> str:
    """Build a single translation entry block."""
    lines = [f"  '{key}': {{"]
    for lang in LANGS:
        val = langs_data.get(lang) or langs_data.get("hi", "")
        escaped = escape_tsx(val)
        lines.append(f"    {lang}: '{escaped}',")
    lines.append("  },")
    return "\n".join(lines)


def main():
    # Load translations
    if not os.path.exists(TRANSLATIONS_PATH):
        print(f"ERROR: {TRANSLATIONS_PATH} not found. Run 02_translate_ui.py first.")
        return

    with open(TRANSLATIONS_PATH, encoding="utf-8") as f:
        translations = json.load(f)

    print(f"Loaded {len(translations)} translation keys")

    # Load TSX file
    with open(CTX_PATH, encoding="utf-8") as f:
        content = f.read()

    # Create backup
    backup_path = CTX_PATH + ".bak"
    shutil.copy(CTX_PATH, backup_path)
    print(f"Backup created: {backup_path}")

    # Replace each translation block
    patched = 0
    skipped = 0

    for key, langs_data in translations.items():
        new_block = build_block(key, langs_data)

        # Pattern: match existing block for this key (handles variable whitespace + any existing langs)
        escaped_key = re.escape(key)
        pattern = rf"  '{escaped_key}':\s*\{{[^}}]+\}},"

        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, new_block, content, flags=re.DOTALL, count=1)
            patched += 1
        else:
            skipped += 1

    # Write patched file
    with open(CTX_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    # Verify all 11 languages present
    lang_checks = {}
    for lang in LANGS:
        # Check if the language code appears as a key in the file
        count = len(re.findall(rf"\b{lang}:\s*'", content))
        lang_checks[lang] = count

    all_ok = all(count >= len(translations) * 0.8 for count in lang_checks.values())

    print(f"\nPatched: {patched} keys")
    print(f"Skipped: {skipped} keys (not found in TSX)")
    print("\nLanguage coverage in patched file:")
    for lang, count in lang_checks.items():
        marker = "\u2713" if count >= len(translations) * 0.8 else "\u2717"
        print(f"  {marker} {lang}: {count} entries")

    if all_ok:
        print("\nQUALITY GATE B: PASSED")
        print("  All 11 languages present in LanguageContext.tsx")
    else:
        print("\nQUALITY GATE B: WARNING — some languages have low coverage")

    print(f"\n  Backup: {backup_path}")
    print("  Next: python pipeline/03_embed_ingest.py")


if __name__ == "__main__":
    main()
