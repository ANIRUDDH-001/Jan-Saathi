import json
import os
import re
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import google.generativeai as genai


def _utc_day_key(ts: Optional[float] = None) -> str:
    dt = datetime.fromtimestamp(ts or time.time(), tz=timezone.utc)
    return dt.strftime("%Y-%m-%d")


def _utc_minute_key(ts: Optional[float] = None) -> str:
    dt = datetime.fromtimestamp(ts or time.time(), tz=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M")


def _approx_tokens(text: str) -> int:
    # Simple approximation suitable for quota planning.
    return max(1, len(text) // 4)


def _extract_json_object(raw_text: str) -> Optional[Dict]:
    text = (raw_text or "").strip()
    if not text:
        return None

    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            candidate = parts[1].strip()
            if candidate.lower().startswith("json"):
                candidate = candidate[4:].strip()
            text = candidate

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
        return None
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start : end + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return None

    return None


class ModelRouter:
    def __init__(self, state_path: str = "pipeline/data/model_usage_state.json"):
        self.state_path = state_path
        self.models = [
            {
                "id": "gemini-3.1-flash-lite",
                "rpm": 15,
                "tpm": 250000,
                "rpd": 500,
                "priority": 1,
            },
            {
                "id": "gemini-2.5-flash-lite",
                "rpm": 10,
                "tpm": 250000,
                "rpd": 20,
                "priority": 2,
            },
            {
                "id": "gemini-3-flash",
                "rpm": 5,
                "tpm": 250000,
                "rpd": 20,
                "priority": 3,
            },
            {
                "id": "gemini-2.5-flash",
                "rpm": 5,
                "tpm": 250000,
                "rpd": 20,
                "priority": 4,
            },
            {
                "id": "gemma-3-27b-it",
                "rpm": 30,
                "tpm": 15000,
                "rpd": 14400,
                "priority": 5,
            },
            {
                "id": "gemma-3-12b-it",
                "rpm": 30,
                "tpm": 15000,
                "rpd": 14400,
                "priority": 6,
            },
            {
                "id": "gemma-3-4b-it",
                "rpm": 30,
                "tpm": 15000,
                "rpd": 14400,
                "priority": 7,
            },
            {
                "id": "gemma-3-1b-it",
                "rpm": 30,
                "tpm": 15000,
                "rpd": 14400,
                "priority": 8,
            },
        ]

        self.state = self._load_state()
        self._ensure_state_shape()

    def _load_state(self) -> Dict:
        if not os.path.exists(self.state_path):
            return {
                "day_key": _utc_day_key(),
                "minute_key": _utc_minute_key(),
                "models": {},
            }

        try:
            with open(self.state_path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {
                "day_key": _utc_day_key(),
                "minute_key": _utc_minute_key(),
                "models": {},
            }

    def _save_state(self) -> None:
        os.makedirs(os.path.dirname(self.state_path), exist_ok=True)
        with open(self.state_path, "w", encoding="utf-8") as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)

    def _ensure_state_shape(self) -> None:
        self.state.setdefault("day_key", _utc_day_key())
        self.state.setdefault("minute_key", _utc_minute_key())
        self.state.setdefault("models", {})

        for spec in self.models:
            model_state = self.state["models"].setdefault(
                spec["id"],
                {
                    "minute_requests": 0,
                    "minute_tokens": 0,
                    "day_requests": 0,
                    "cooldown_until": 0,
                    "disabled": False,
                    "last_error": "",
                },
            )
            model_state.setdefault("minute_requests", 0)
            model_state.setdefault("minute_tokens", 0)
            model_state.setdefault("day_requests", 0)
            model_state.setdefault("cooldown_until", 0)
            model_state.setdefault("disabled", False)
            model_state.setdefault("last_error", "")

        self._roll_windows_if_needed()
        self._save_state()

    def _roll_windows_if_needed(self) -> None:
        day_key_now = _utc_day_key()
        minute_key_now = _utc_minute_key()

        if self.state.get("day_key") != day_key_now:
            self.state["day_key"] = day_key_now
            for st in self.state["models"].values():
                st["day_requests"] = 0

        if self.state.get("minute_key") != minute_key_now:
            self.state["minute_key"] = minute_key_now
            for st in self.state["models"].values():
                st["minute_requests"] = 0
                st["minute_tokens"] = 0

    def _is_quota_error(self, message: str) -> bool:
        msg = (message or "").lower()
        return any(
            token in msg
            for token in [
                "429",
                "quota",
                "rate",
                "exceeded",
                "generaterequestsperday",
                "rpd",
                "rpm",
                "tpm",
            ]
        )

    def _select_model(self, estimated_tokens: int) -> Optional[Dict]:
        self._roll_windows_if_needed()
        now = time.time()

        for spec in sorted(self.models, key=lambda x: x["priority"]):
            st = self.state["models"][spec["id"]]
            if st.get("disabled"):
                continue
            if now < float(st.get("cooldown_until", 0)):
                continue
            if st.get("minute_requests", 0) >= spec["rpm"]:
                continue
            if st.get("day_requests", 0) >= spec["rpd"]:
                continue
            if st.get("minute_tokens", 0) + estimated_tokens > spec["tpm"]:
                continue
            return spec

        return None

    def _mark_success(self, model_id: str, prompt_tokens: int, response_text: str) -> None:
        self._roll_windows_if_needed()
        st = self.state["models"][model_id]
        st["minute_requests"] += 1
        st["day_requests"] += 1
        st["minute_tokens"] += prompt_tokens + _approx_tokens(response_text)
        st["last_error"] = ""
        self._save_state()

    def _mark_error(self, model_id: str, error_text: str) -> None:
        st = self.state["models"][model_id]
        st["last_error"] = error_text

        if self._is_quota_error(error_text):
            # Daily quota style errors are treated as model exhaustion for current UTC day.
            st["day_requests"] = 10**9
            st["cooldown_until"] = time.time() + 3600
        else:
            st["cooldown_until"] = time.time() + 15

        self._save_state()

    def usage_snapshot(self) -> Dict:
        self._roll_windows_if_needed()
        self._save_state()
        return self.state

    def generate_json(
        self,
        prompt: str,
        max_retries: int = 10,
        temperature: float = 0.2,
    ) -> Tuple[Optional[Dict], Dict]:
        estimated_tokens = _approx_tokens(prompt)
        last_error = ""

        for attempt in range(max_retries):
            spec = self._select_model(estimated_tokens)
            if not spec:
                return None, {
                    "attempts": attempt,
                    "error": "No eligible model available under current quotas.",
                }

            model_id = spec["id"]
            try:
                model = genai.GenerativeModel(model_id)
                result = model.generate_content(
                    prompt,
                    generation_config={"temperature": temperature},
                )
                text = (getattr(result, "text", None) or "").strip()
                parsed = _extract_json_object(text)
                self._mark_success(model_id, estimated_tokens, text)

                if parsed is not None:
                    return parsed, {
                        "model": model_id,
                        "attempts": attempt + 1,
                        "error": "",
                    }

                last_error = "Model response was not valid JSON object."
                self._mark_error(model_id, last_error)
            except Exception as e:
                err = str(e)
                last_error = err
                self._mark_error(model_id, err)

        return None, {"attempts": max_retries, "error": last_error}

    def generate_text(
        self,
        prompt: str,
        max_retries: int = 10,
        temperature: float = 0.1,
    ) -> Tuple[Optional[str], Dict]:
        estimated_tokens = _approx_tokens(prompt)
        last_error = ""

        for attempt in range(max_retries):
            spec = self._select_model(estimated_tokens)
            if not spec:
                return None, {
                    "attempts": attempt,
                    "error": "No eligible model available under current quotas.",
                }

            model_id = spec["id"]
            try:
                model = genai.GenerativeModel(model_id)
                result = model.generate_content(
                    prompt,
                    generation_config={"temperature": temperature},
                )
                text = (getattr(result, "text", None) or "").strip()
                self._mark_success(model_id, estimated_tokens, text)
                if text:
                    return text, {
                        "model": model_id,
                        "attempts": attempt + 1,
                        "error": "",
                    }
                last_error = "Empty response text."
                self._mark_error(model_id, last_error)
            except Exception as e:
                err = str(e)
                last_error = err
                self._mark_error(model_id, err)

        return None, {"attempts": max_retries, "error": last_error}


def normalize_phone_candidate(raw: str) -> Optional[str]:
    text = (raw or "").strip()
    if not text:
        return None

    # Keep first line only if model added extra narration.
    text = text.splitlines()[0].strip()
    text = text.replace("phone:", "").replace("Phone:", "").strip()

    # Preserve digits, spaces, + and hyphens.
    cleaned = re.sub(r"[^0-9+\-\s]", "", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    digit_count = sum(ch.isdigit() for ch in cleaned)
    if digit_count < 3:
        return None

    return cleaned
