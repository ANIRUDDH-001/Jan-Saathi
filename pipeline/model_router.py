#!/usr/bin/env python3
"""
model_router.py — Dual-provider model router for Jan Saathi pipeline.

Generation:  Google Gemini (2.5 Flash, Gemma 27B/12B/4B)
Verification: Groq (llama-4-scout, llama-3.3-70b, kimi-k2, qwen3-32b)

Features:
 - Per-model RPM, TPM, RPD tracking with auto-cooldown
 - Automatic fallback on rate limits or errors
 - JSON extraction from markdown-wrapped responses
 - State persistence for crash recovery
"""

import json
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import google.generativeai as genai
from groq import Groq

# ── Helpers ──────────────────────────────────────────────────────────────────


def _utc_day_key(ts: Optional[float] = None) -> str:
    dt = datetime.fromtimestamp(ts or time.time(), tz=timezone.utc)
    return dt.strftime("%Y-%m-%d")


def _utc_minute_key(ts: Optional[float] = None) -> str:
    dt = datetime.fromtimestamp(ts or time.time(), tz=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M")


def _approx_tokens(text: str) -> int:
    """Conservative token estimate: ~4 chars per token."""
    return max(1, len(text) // 4)


def _extract_json_object(raw_text: str) -> Optional[Dict]:
    """Extract a JSON object from potentially markdown-wrapped LLM output."""
    text = (raw_text or "").strip()
    if not text:
        return None

    # Strip markdown code fences
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            candidate = parts[1].strip()
            if candidate.lower().startswith("json"):
                candidate = candidate[4:].strip()
            text = candidate

    # Direct parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    # Find first { ... last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    return None


# ── Base Model Router ────────────────────────────────────────────────────────


class _BaseRouter:
    """Shared rate-limit tracking logic for both Gemini and Groq routers."""

    def __init__(self, models: List[Dict], state_key: str, state_path: str):
        self.models = models
        self.state_key = state_key
        self.state_path = state_path
        self.state = self._load_state()
        self._ensure_state()

    def _load_state(self) -> Dict:
        if not os.path.exists(self.state_path):
            return {}
        try:
            with open(self.state_path, encoding="utf-8") as f:
                full = json.load(f)
            return full.get(self.state_key, {})
        except Exception:
            return {}

    def _save_state(self) -> None:
        os.makedirs(os.path.dirname(self.state_path), exist_ok=True)
        full = {}
        if os.path.exists(self.state_path):
            try:
                with open(self.state_path, encoding="utf-8") as f:
                    full = json.load(f)
            except Exception:
                full = {}
        full[self.state_key] = self.state
        with open(self.state_path, "w", encoding="utf-8") as f:
            json.dump(full, f, indent=2, ensure_ascii=False)

    def _ensure_state(self) -> None:
        self.state.setdefault("day_key", _utc_day_key())
        self.state.setdefault("minute_key", _utc_minute_key())
        self.state.setdefault("models", {})
        for spec in self.models:
            ms = self.state["models"].setdefault(spec["id"], {})
            for k in ("minute_requests", "minute_tokens", "day_requests"):
                ms.setdefault(k, 0)
            ms.setdefault("cooldown_until", 0)
            ms.setdefault("last_error", "")
        self._roll_windows()
        self._save_state()

    def _roll_windows(self) -> None:
        now_day = _utc_day_key()
        now_min = _utc_minute_key()
        if self.state.get("day_key") != now_day:
            self.state["day_key"] = now_day
            for ms in self.state["models"].values():
                ms["day_requests"] = 0
        if self.state.get("minute_key") != now_min:
            self.state["minute_key"] = now_min
            for ms in self.state["models"].values():
                ms["minute_requests"] = 0
                ms["minute_tokens"] = 0

    def _is_rate_error(self, msg: str) -> bool:
        m = (msg or "").lower()
        return any(
            t in m
            for t in [
                "429",
                "quota",
                "rate",
                "exceeded",
                "rpd",
                "rpm",
                "tpm",
                "resource_exhausted",
            ]
        )

    def _select_model(self, est_tokens: int) -> Optional[Dict]:
        self._roll_windows()
        now = time.time()
        for spec in sorted(self.models, key=lambda x: x["priority"]):
            ms = self.state["models"][spec["id"]]
            if now < ms.get("cooldown_until", 0):
                continue
            if ms["minute_requests"] >= spec["rpm"]:
                continue
            if ms["day_requests"] >= spec["rpd"]:
                continue
            if ms["minute_tokens"] + est_tokens > spec["tpm"]:
                continue
            return spec
        return None

    def _mark_success(self, model_id: str, tokens_used: int) -> None:
        self._roll_windows()
        ms = self.state["models"][model_id]
        ms["minute_requests"] += 1
        ms["day_requests"] += 1
        ms["minute_tokens"] += tokens_used
        ms["last_error"] = ""
        self._save_state()

    def _mark_error(self, model_id: str, error: str) -> None:
        ms = self.state["models"][model_id]
        ms["last_error"] = error[:200]
        if self._is_rate_error(error):
            # Daily exhaustion → cooldown 1 hour
            ms["day_requests"] = 10**9
            ms["cooldown_until"] = time.time() + 3600
        else:
            ms["cooldown_until"] = time.time() + 15
        self._save_state()

    def usage_snapshot(self) -> Dict:
        self._roll_windows()
        self._save_state()
        return dict(self.state)


# ── Gemini Router (Generation) ───────────────────────────────────────────────


class GeminiRouter(_BaseRouter):
    """
    Routes generation requests across Gemini models with rate-limit awareness.
    Priority: Gemma 27B (workhorse) → Gemma 12B → Gemma 4B
    Flash used only when explicitly requested (critical_only=True).
    """

    MODELS = [
        {
            "id": "gemma-3-27b-it",
            "rpm": 30,
            "tpm": 15_000,
            "rpd": 14_400,
            "priority": 2,
        },
        {
            "id": "gemma-3-12b-it",
            "rpm": 30,
            "tpm": 15_000,
            "rpd": 14_400,
            "priority": 3,
        },
        {"id": "gemma-3-4b-it", "rpm": 30, "tpm": 15_000, "rpd": 14_400, "priority": 4},
        {"id": "gemini-2.5-flash", "rpm": 5, "tpm": 250_000, "rpd": 20, "priority": 10},
    ]

    def __init__(
        self,
        api_key: str,
        state_path: str = "pipeline/data/logs/model_usage_state.json",
    ):
        super().__init__(self.MODELS, "gemini", state_path)
        genai.configure(api_key=api_key)

    def generate_json(
        self,
        prompt: str,
        max_retries: int = 8,
        temperature: float = 0.15,
        use_flash: bool = False,
    ) -> Tuple[Optional[Dict], Dict]:
        """Generate a JSON object. Returns (parsed_dict | None, metadata)."""
        est_tokens = _approx_tokens(prompt)
        last_error = ""

        for attempt in range(max_retries):
            if use_flash:
                # Force flash if available
                spec = next(
                    (s for s in self.models if s["id"] == "gemini-2.5-flash"),
                    None,
                )
                ms = self.state["models"].get("gemini-2.5-flash", {})
                if not spec or ms.get("day_requests", 0) >= spec["rpd"]:
                    spec = self._select_model(est_tokens)  # fallback to Gemma
            else:
                spec = self._select_model(est_tokens)

            if not spec:
                # All models exhausted — wait 60s and retry
                if attempt < max_retries - 1:
                    time.sleep(60)
                    self._roll_windows()
                    continue
                return None, {
                    "attempts": attempt + 1,
                    "error": "All Gemini models exhausted",
                }

            model_id = spec["id"]
            try:
                model = genai.GenerativeModel(model_id)
                result = model.generate_content(
                    prompt,
                    generation_config={"temperature": temperature},
                )
                text = (getattr(result, "text", None) or "").strip()
                total_tokens = est_tokens + _approx_tokens(text)
                self._mark_success(model_id, total_tokens)

                parsed = _extract_json_object(text)
                if parsed is not None:
                    return parsed, {
                        "model": model_id,
                        "attempts": attempt + 1,
                        "error": "",
                    }

                last_error = "Response was not valid JSON"
                # Don't hard-fail the model for bad JSON — just retry
                if attempt < max_retries - 1:
                    time.sleep(2)

            except Exception as e:
                last_error = str(e)
                self._mark_error(model_id, last_error)
                if attempt < max_retries - 1:
                    wait = 5 if not self._is_rate_error(last_error) else 30
                    time.sleep(wait)

        return None, {"attempts": max_retries, "error": last_error}

    def generate_text(
        self,
        prompt: str,
        max_retries: int = 6,
        temperature: float = 0.1,
    ) -> Tuple[Optional[str], Dict]:
        """Generate plain text. Returns (text | None, metadata)."""
        est_tokens = _approx_tokens(prompt)
        last_error = ""

        for attempt in range(max_retries):
            spec = self._select_model(est_tokens)
            if not spec:
                if attempt < max_retries - 1:
                    time.sleep(60)
                    self._roll_windows()
                    continue
                return None, {
                    "attempts": attempt + 1,
                    "error": "All Gemini models exhausted",
                }

            model_id = spec["id"]
            try:
                model = genai.GenerativeModel(model_id)
                result = model.generate_content(
                    prompt,
                    generation_config={"temperature": temperature},
                )
                text = (getattr(result, "text", None) or "").strip()
                self._mark_success(model_id, est_tokens + _approx_tokens(text))
                if text:
                    return text, {
                        "model": model_id,
                        "attempts": attempt + 1,
                        "error": "",
                    }
                last_error = "Empty response"
            except Exception as e:
                last_error = str(e)
                self._mark_error(model_id, last_error)
                time.sleep(5)

        return None, {"attempts": max_retries, "error": last_error}


# ── Groq Router (Verification) ──────────────────────────────────────────────


class GroqRouter(_BaseRouter):
    """
    Routes verification requests across Groq models.
    Priority: llama-4-scout → llama-3.3-70b → kimi-k2 → qwen3-32b

    Uses structured JSON mode when available (Groq supports response_format).
    """

    MODELS = [
        {
            "id": "meta-llama/llama-4-scout-17b-16e-instruct",
            "rpm": 30,
            "tpm": 30_000,
            "rpd": 1_000,
            "priority": 1,
        },
        {
            "id": "llama-3.3-70b-versatile",
            "rpm": 30,
            "tpm": 12_000,
            "rpd": 1_000,
            "priority": 2,
        },
        {
            "id": "moonshotai/kimi-k2-instruct",
            "rpm": 60,
            "tpm": 10_000,
            "rpd": 1_000,
            "priority": 3,
        },
        {"id": "qwen/qwen3-32b", "rpm": 60, "tpm": 6_000, "rpd": 1_000, "priority": 4},
    ]

    def __init__(
        self,
        api_key: str,
        state_path: str = "pipeline/data/logs/model_usage_state.json",
    ):
        super().__init__(self.MODELS, "groq", state_path)
        self.client = Groq(api_key=api_key)

    def verify_json(
        self,
        prompt: str,
        max_retries: int = 6,
        temperature: float = 0.1,
    ) -> Tuple[Optional[Dict], Dict]:
        """Send verification prompt, expect JSON back. Returns (parsed | None, meta)."""
        est_tokens = _approx_tokens(prompt)
        last_error = ""

        for attempt in range(max_retries):
            spec = self._select_model(est_tokens)
            if not spec:
                if attempt < max_retries - 1:
                    time.sleep(60)
                    self._roll_windows()
                    continue
                return None, {
                    "attempts": attempt + 1,
                    "error": "All Groq models exhausted",
                }

            model_id = spec["id"]
            try:
                response = self.client.chat.completions.create(
                    model=model_id,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=3000,
                )
                text = response.choices[0].message.content or ""
                total_tokens = est_tokens + _approx_tokens(text)
                self._mark_success(model_id, total_tokens)

                parsed = _extract_json_object(text)
                if parsed is not None:
                    return parsed, {
                        "model": model_id,
                        "attempts": attempt + 1,
                        "error": "",
                    }

                last_error = "Groq response not valid JSON"
                if attempt < max_retries - 1:
                    time.sleep(2)

            except Exception as e:
                last_error = str(e)
                self._mark_error(model_id, last_error)
                wait = 30 if self._is_rate_error(last_error) else 5
                if attempt < max_retries - 1:
                    time.sleep(wait)

        return None, {"attempts": max_retries, "error": last_error}

    def verify_text(
        self,
        prompt: str,
        max_retries: int = 4,
        temperature: float = 0.1,
    ) -> Tuple[Optional[str], Dict]:
        """Send verification prompt, get text back."""
        est_tokens = _approx_tokens(prompt)
        last_error = ""

        for attempt in range(max_retries):
            spec = self._select_model(est_tokens)
            if not spec:
                if attempt < max_retries - 1:
                    time.sleep(60)
                    self._roll_windows()
                    continue
                return None, {
                    "attempts": attempt + 1,
                    "error": "All Groq models exhausted",
                }

            model_id = spec["id"]
            try:
                response = self.client.chat.completions.create(
                    model=model_id,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=2000,
                )
                text = (response.choices[0].message.content or "").strip()
                self._mark_success(model_id, est_tokens + _approx_tokens(text))
                if text:
                    return text, {
                        "model": model_id,
                        "attempts": attempt + 1,
                        "error": "",
                    }
                last_error = "Empty response"
            except Exception as e:
                last_error = str(e)
                self._mark_error(model_id, last_error)
                time.sleep(5)

        return None, {"attempts": max_retries, "error": last_error}
