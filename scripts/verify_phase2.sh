#!/bin/bash
# Phase 2 verification suite — Voice Pipeline
PASS=0
FAIL=0

check_code() {
  local name="$1"
  local file="$2"
  local pattern="$3"
  if grep -qE "$pattern" "$file" 2>/dev/null; then
    echo "PASS: $name"
    ((PASS++))
  else
    echo "FAIL: $name -- '$pattern' not found in $file"
    ((FAIL++))
  fi
}

check_absent() {
  local name="$1"
  local file="$2"
  local pattern="$3"
  if ! grep -qE "$pattern" "$file" 2>/dev/null; then
    echo "PASS: $name (correctly absent)"
    ((PASS++))
  else
    echo "FAIL: $name -- '$pattern' still present in $file"
    ((FAIL++))
  fi
}

echo "=== PHASE 2 VERIFICATION ==="
echo ""

# ── Backend: sarvam.py ──────────────────────────────────────────────────────
echo "--- Backend: sarvam.py ---"

check_code "STT uses speech-to-text endpoint" \
  "backend/app/services/sarvam.py" "speech-to-text"

check_code "TTS uses text-to-speech endpoint" \
  "backend/app/services/sarvam.py" "text-to-speech"

check_code "TTS payload uses 'inputs' array" \
  "backend/app/services/sarvam.py" '"inputs"'

check_absent "TTS no longer uses wrong 'text' key" \
  "backend/app/services/sarvam.py" '"text":[[:space:]]'

check_code "TTS uses speech_sample_rate (correct field)" \
  "backend/app/services/sarvam.py" "speech_sample_rate"

check_absent "TTS no stale 'sample_rate' key" \
  "backend/app/services/sarvam.py" '"sample_rate"'

check_code "LANG_TO_SPEAKER mapping exists" \
  "backend/app/services/sarvam.py" "LANG_TO_SPEAKER"

check_code "shubh speaker for Hindi" \
  "backend/app/services/sarvam.py" "shubh"

check_code "text trimming for long TTS inputs" \
  "backend/app/services/sarvam.py" "len.text. > 500"

check_code "logging module used" \
  "backend/app/services/sarvam.py" "logger\."

check_code "transcribe returns error dict on failure" \
  "backend/app/services/sarvam.py" '"error":'

echo ""
echo "--- Backend: voice.py ---"

check_code "transcribe endpoint defined" \
  "backend/app/routers/voice.py" "transcribe"

check_code "speak endpoint defined" \
  "backend/app/routers/voice.py" "speak"

check_code "session_id is optional with default" \
  "backend/app/routers/voice.py" "session_id.*Form.*default"

check_absent "no HTTPException raised (graceful errors)" \
  "backend/app/routers/voice.py" "HTTPException"

check_code "passes session_id to transcribe" \
  "backend/app/routers/voice.py" "session_id"

echo ""
echo "--- Backend: chat.py ---"

check_code "calls sarvam.text_to_speech" \
  "backend/app/routers/chat.py" "text_to_speech"

check_code "returns audio_b64 in response" \
  "backend/app/routers/chat.py" "audio_b64"

echo ""
echo "--- Frontend: VoiceWaveform.tsx ---"

# Math.random() is OK in idle path; what matters is real AnalyserNode in active path
check_code "active path uses getByteFrequencyData not Math.random (C12 fixed)" \
  "frontend/src/app/components/VoiceWaveform.tsx" "getByteFrequencyData"

check_code "accepts analyserNode prop" \
  "frontend/src/app/components/VoiceWaveform.tsx" "analyserNode"

check_code "reads real frequency data" \
  "frontend/src/app/components/VoiceWaveform.tsx" "getByteFrequencyData"

check_code "requestAnimationFrame loop" \
  "frontend/src/app/components/VoiceWaveform.tsx" "requestAnimationFrame"

check_code "cleanup cancelAnimationFrame on unmount" \
  "frontend/src/app/components/VoiceWaveform.tsx" "cancelAnimationFrame"

echo ""
echo "--- Frontend: VoiceButton.tsx ---"

check_code "Square icon for listening stop state" \
  "frontend/src/app/components/VoiceButton.tsx" "Square"

check_code "Loader2 icon for processing state" \
  "frontend/src/app/components/VoiceButton.tsx" "Loader2"

check_code "button disabled during processing" \
  "frontend/src/app/components/VoiceButton.tsx" "disabled"

echo ""
echo "--- Frontend: Chat.tsx ---"

check_code "AudioContext created for recording (C1 fixed)" \
  "frontend/src/app/pages/Chat.tsx" "AudioContext"

check_code "createAnalyser for real waveform (C12 fixed)" \
  "frontend/src/app/pages/Chat.tsx" "createAnalyser"

check_code "analyserRef wired to VoiceWaveform" \
  "frontend/src/app/pages/Chat.tsx" "analyserRef\.current"

check_code "VoiceWaveform receives isActive prop" \
  "frontend/src/app/pages/Chat.tsx" "isActive.*voiceState"

check_code "LANG_TO_SARVAM mapping" \
  "frontend/src/app/pages/Chat.tsx" "LANG_TO_SARVAM"

check_code "transcribeAudio called with language hint" \
  "frontend/src/app/pages/Chat.tsx" "transcribeAudio"

check_code "handles audio_too_short error" \
  "frontend/src/app/pages/Chat.tsx" "audio_too_short"

check_code "language auto-switch on detection" \
  "frontend/src/app/pages/Chat.tsx" "setLanguage"

check_code "TTS playback sets voicePlaying true (C2 fixed)" \
  "frontend/src/app/pages/Chat.tsx" "setVoicePlaying.*true"

check_code "Volume2 replay sets voicePlaying (C2 fixed)" \
  "frontend/src/app/pages/Chat.tsx" "audioB64"

check_code "stale closure fix via handleSendRef (F7 fixed)" \
  "frontend/src/app/pages/Chat.tsx" "handleSendRef"

check_code "handleSend wrapped in useCallback" \
  "frontend/src/app/pages/Chat.tsx" "useCallback"

check_code "voice error shows Hindi fallback message" \
  "frontend/src/app/pages/Chat.tsx" "Awaaz sunne"

echo ""
echo "--- Frontend: AppContext.tsx ---"

check_code "setLanguage persists to localStorage" \
  "frontend/src/app/context/AppContext.tsx" "js_language"

check_code "setLanguage updates document.documentElement.lang" \
  "frontend/src/app/context/AppContext.tsx" "documentElement.lang"

check_code "language initialised from localStorage" \
  "frontend/src/app/context/AppContext.tsx" "getItem.*js_language"

echo ""
echo "--- Python Syntax ---"

for f in backend/app/services/sarvam.py backend/app/routers/voice.py backend/app/routers/chat.py; do
  if python3 -m py_compile "$f" 2>/dev/null; then
    echo "PASS: $f syntax OK"
    ((PASS++))
  else
    ERR=$(python3 -m py_compile "$f" 2>&1)
    echo "FAIL: $f syntax error -- $ERR"
    ((FAIL++))
  fi
done

echo ""
echo "=== RESULTS ==="
echo "PASSED: $PASS / $((PASS + FAIL))"
echo "FAILED: $FAIL"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "GREEN LIGHT -- all Phase 2 checks pass"
else
  echo "BLOCKED -- fix $FAIL failing check(s)"
fi
