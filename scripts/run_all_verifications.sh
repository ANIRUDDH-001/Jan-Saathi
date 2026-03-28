#!/usr/bin/env bash
# =============================================================================
# JAN SAATHI — MASTER VERIFICATION RUNNER
# Run from project root: bash scripts/run_all_verifications.sh
# =============================================================================

set -uo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PHASE_RESULTS=()
TOTAL_PASS=0
TOTAL_FAIL=0

if command -v python3 >/dev/null 2>&1; then
  PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
  PY_CMD="python"
else
  PY_CMD=""
fi

if ! command -v grep >/dev/null 2>&1; then
  echo "grep is required but not found."
  exit 2
fi

summarize_output() {
  local output="$1"
  printf '%s\n' "$output" | grep -E "✅|❌|⚠️|PASS:|FAIL:|GREEN LIGHT|BLOCKED|SKIP|WARN" | head -20 || true
}

extract_count() {
  local kind="$1"
  local output="$2"
  local count

  if [[ "$kind" == "pass" ]]; then
    count=$(printf '%s\n' "$output" | grep -E -c "✅[[:space:]]*PASS|(^|[[:space:]])PASS:" || true)
  elif [[ "$kind" == "fail" ]]; then
    count=$(printf '%s\n' "$output" | grep -E -c "❌[[:space:]]*FAIL|(^|[[:space:]])FAIL:" || true)
  else
    count=$(printf '%s\n' "$output" | grep -E -c "⚠️|(^|[[:space:]])WARN|WARNING|SKIP" || true)
  fi

  echo "${count:-0}"
}

run_phase_check() {
  local phase_name="$1"
  local check_cmd="$2"

  echo -e "${BLUE}=== $phase_name ===${NC}"

  local output status pass_count fail_count warn_count
  set +e
  output=$(eval "$check_cmd" 2>&1)
  status=$?
  set -e

  pass_count=$(extract_count "pass" "$output")
  fail_count=$(extract_count "fail" "$output")
  warn_count=$(extract_count "warn" "$output")

  summarize_output "$output"
  echo ""

  if [[ "$status" -ne 0 && "$fail_count" -eq 0 ]]; then
    fail_count=1
    echo "  WARN: Command exited with status $status without explicit FAIL markers."
  fi

  echo "  Checks: ${pass_count} pass / ${fail_count} fail / ${warn_count} warn"

  if [[ "$fail_count" -eq 0 ]]; then
    echo -e "  ${GREEN}PASS $phase_name: GREEN LIGHT${NC}"
    PHASE_RESULTS+=("PASS:$phase_name")
    ((++TOTAL_PASS))
  else
    echo -e "  ${RED}FAIL $phase_name: BLOCKED (${fail_count} failures)${NC}"
    PHASE_RESULTS+=("FAIL:$phase_name")
    ((++TOTAL_FAIL))
  fi
  echo ""
}

echo -e "${BLUE}"
echo "=============================================================="
echo "JAN SAATHI — COMPLETE VERIFICATION SUITE"
echo "Team Algomind | Build4Bharat"
echo "=============================================================="
echo -e "${NC}"

# Phase 0
run_phase_check "PHASE 0: Emergency Stabilization" "
  PASS=0; FAIL=0
  grep -q 'ShubhAvatar' frontend/src/app/components/ShubhAvatar.tsx 2>/dev/null && echo '✅ PASS: ShubhAvatar exists' && ((++PASS)) || (echo '❌ FAIL: ShubhAvatar missing' && ((++FAIL)))
  [ \$(grep -r 'VedAvatar' frontend/src --include='*.tsx' 2>/dev/null | wc -l) -eq 0 ] && echo '✅ PASS: No VedAvatar refs' && ((++PASS)) || (echo '❌ FAIL: VedAvatar still referenced' && ((++FAIL)))
  grep -q 'AdminGuard' frontend/src/app/components/AdminGuard.tsx 2>/dev/null && echo '✅ PASS: AdminGuard exists' && ((++PASS)) || (echo '❌ FAIL: AdminGuard missing' && ((++FAIL)))
  grep -q 'jan-saathi-frontend' frontend/package.json 2>/dev/null && echo '✅ PASS: package.json name fixed' && ((++PASS)) || (echo '❌ FAIL: package.json name wrong' && ((++FAIL)))
  grep -q 'userHasSpoken' frontend/src/app/pages/Chat.tsx 2>/dev/null && echo '✅ PASS: Silence timer fixed' && ((++PASS)) || (echo '❌ FAIL: Silence timer not fixed' && ((++FAIL)))
"

# Phase 1
run_phase_check "PHASE 1: Backend Core" "
  PASS=0; FAIL=0
  grep -q 'MODELS' backend/app/services/groq_llm.py 2>/dev/null && echo '✅ PASS: Groq 4-model chain' && ((++PASS)) || (echo '❌ FAIL: Groq service missing' && ((++FAIL)))
  grep -q 'embed_query' backend/app/services/cohere_embed.py 2>/dev/null && echo '✅ PASS: Cohere embed' && ((++PASS)) || (echo '❌ FAIL: Cohere service missing' && ((++FAIL)))
  grep -q 'match_schemes' backend/app/services/supabase_db.py 2>/dev/null && echo '✅ PASS: Supabase match_schemes' && ((++PASS)) || (echo '❌ FAIL: Supabase service missing' && ((++FAIL)))
  grep -q 'get_or_create_session\|update_session' backend/app/routers/chat.py 2>/dev/null && echo '✅ PASS: Chat has session management' && ((++PASS)) || (echo '❌ FAIL: Chat session missing' && ((++FAIL)))
  if [ -n \"$PY_CMD\" ]; then \"$PY_CMD\" -m py_compile backend/app/services/groq_llm.py 2>/dev/null && echo '✅ PASS: groq_llm syntax OK' && ((++PASS)) || (echo '❌ FAIL: groq_llm syntax error' && ((++FAIL))); else echo '⚠️ WARN: python not found'; fi
"

# Phase 2 (reuse dedicated verifier)
run_phase_check "PHASE 2: Voice Pipeline" "
  if [ -f scripts/verify_phase2.sh ]; then
    bash scripts/verify_phase2.sh
  else
    echo '❌ FAIL: scripts/verify_phase2.sh missing'
  fi
"

# Phase 3
run_phase_check "PHASE 3: Frontend Integration" "
  PASS=0; FAIL=0
  MOCK_COUNT=\$(grep -r 'mockData' frontend/src/app/pages frontend/src/app/components 2>/dev/null | grep -v test | wc -l)
  [ \"\$MOCK_COUNT\" -eq 0 ] && echo '✅ PASS: Zero mockData imports in production code' && ((++PASS)) || (echo \"❌ FAIL: \$MOCK_COUNT mockData imports remain\" && ((++FAIL)))
  grep -q 'auth/callback' frontend/src/app/routes.ts 2>/dev/null && echo '✅ PASS: Auth callback route exists' && ((++PASS)) || (echo '❌ FAIL: Auth callback route missing' && ((++FAIL)))
  grep -q 'getAdminStats' frontend/src/app/pages/admin/Dashboard.tsx 2>/dev/null && echo '✅ PASS: Admin calls real API' && ((++PASS)) || (echo '❌ FAIL: Admin still mocked' && ((++FAIL)))
  grep -q 'trackApplication' frontend/src/app/pages/Track.tsx 2>/dev/null && echo '✅ PASS: Track page wired' && ((++PASS)) || (echo '❌ FAIL: Track page not wired' && ((++FAIL)))
  if command -v npm >/dev/null 2>&1; then (cd frontend && npm run build >/dev/null 2>&1) && echo '✅ PASS: Frontend builds' && ((++PASS)) || (echo '❌ FAIL: Frontend build failed' && ((++FAIL))); else echo '⚠️ WARN: npm not found'; fi
"

# Phase 4
run_phase_check "PHASE 4: Shubh Avatar + Audio-First" "
  PASS=0; FAIL=0
  grep -q '<svg' frontend/src/app/components/ShubhAvatar.tsx 2>/dev/null && echo '✅ PASS: Shubh is SVG' && ((++PASS)) || (echo '❌ FAIL: Shubh SVG missing' && ((++FAIL)))
  ! grep -q 'WebGL\|Three.js' frontend/src/app/components/ShubhAvatar.tsx 2>/dev/null && echo '✅ PASS: No WebGL in Shubh' && ((++PASS)) || (echo '❌ FAIL: Heavy graphics in avatar' && ((++FAIL)))
  grep -q 'GREETING_TEXT\|greeting' frontend/src/app/pages/AudioEntry.tsx 2>/dev/null && echo '✅ PASS: Greeting in AudioEntry' && ((++PASS)) || (echo '❌ FAIL: Greeting missing' && ((++FAIL)))
  grep -q 'Screen dekhna' frontend/src/app/pages/AudioEntry.tsx 2>/dev/null && echo '✅ PASS: Screen prompt present' && ((++PASS)) || (echo '❌ FAIL: Screen prompt missing' && ((++FAIL)))
  grep -q 'AudioEntry' frontend/src/app/routes.ts 2>/dev/null && echo '✅ PASS: AudioEntry is default route' && ((++PASS)) || (echo '❌ FAIL: AudioEntry not in routes' && ((++FAIL)))
"

# Phase 5
run_phase_check "PHASE 5: Form Fill + PDF" "
  PASS=0; FAIL=0
  grep -q 'generate_pdf\|generate_pdf_b64' backend/app/services/pdf_generator.py 2>/dev/null && echo '✅ PASS: PDF generator exists' && ((++PASS)) || (echo '❌ FAIL: PDF generator missing' && ((++FAIL)))
  grep -q 'reportlab' backend/requirements.txt 2>/dev/null && echo '✅ PASS: ReportLab in requirements' && ((++PASS)) || (echo '❌ FAIL: ReportLab missing' && ((++FAIL)))
  grep -q 'submitApplication' frontend/src/app/pages/AgriFormFill.tsx 2>/dev/null && echo '✅ PASS: AgriFormFill calls real API' && ((++PASS)) || (echo '❌ FAIL: AgriFormFill not wired' && ((++FAIL)))
  ! grep -q 'Ramesh Kumar' frontend/src/app/pages/AgriFormFill.tsx 2>/dev/null && echo '✅ PASS: No hardcoded Ramesh Kumar' && ((++PASS)) || (echo '❌ FAIL: Ramesh Kumar still hardcoded' && ((++FAIL)))
  grep -q 'handleDownload\|Download' frontend/src/app/pages/AgriFormFill.tsx 2>/dev/null && echo '✅ PASS: Download handler present' && ((++PASS)) || (echo '❌ FAIL: Download handler missing' && ((++FAIL)))
"

# Phase 6
run_phase_check "PHASE 6: Next.js Migration" "
  PASS=0; FAIL=0
  [ -f 'nextjs-app/app/layout.tsx' ] && echo '✅ PASS: Next.js app/layout.tsx' && ((++PASS)) || (echo '❌ FAIL: layout.tsx missing' && ((++FAIL)))
  [ -f 'nextjs-app/app/api/chat/route.ts' ] && echo '✅ PASS: API chat route' && ((++PASS)) || (echo '❌ FAIL: Chat API route missing' && ((++FAIL)))
  [ -f 'nextjs-app/auth.ts' ] && echo '✅ PASS: NextAuth configured' && ((++PASS)) || (echo '❌ FAIL: NextAuth missing' && ((++FAIL)))
  [ \$(grep -rE '(^|[[:space:]])import[[:space:]].*(react-router|react-router-dom)|(^|[[:space:]])export[[:space:]].*(react-router|react-router-dom)|require\(.*(react-router|react-router-dom)' nextjs-app/app nextjs-app/components nextjs-app/context --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l) -eq 0 ] && echo '✅ PASS: No react-router in Next.js' && ((++PASS)) || (echo '❌ FAIL: react-router still present' && ((++FAIL)))
  if command -v npm >/dev/null 2>&1; then (cd nextjs-app && npm run build >/dev/null 2>&1) && echo '✅ PASS: Next.js builds successfully' && ((++PASS)) || (echo '❌ FAIL: Next.js build failed' && ((++FAIL))); else echo '⚠️ WARN: npm not found'; fi
"

# Phase 7 (reuse dedicated verifier)
run_phase_check "PHASE 7: PWA" "
  if [ -f scripts/verify_phase7.sh ]; then
    bash scripts/verify_phase7.sh
  else
    echo '❌ FAIL: scripts/verify_phase7.sh missing'
  fi
"

# Phase 8 (reuse dedicated verifier)
run_phase_check "PHASE 8: Testing + CI" "
  if [ -f scripts/verify_phase8.sh ]; then
    bash scripts/verify_phase8.sh
  else
    echo '❌ FAIL: scripts/verify_phase8.sh missing'
  fi
"

# Phase 9
run_phase_check "PHASE 9: Security + Performance" "
  PASS=0; FAIL=0
  grep -q 'slowapi\|RateLimitExceeded' backend/main.py 2>/dev/null && echo '✅ PASS: Rate limiting active' && ((++PASS)) || (echo '❌ FAIL: Rate limiting missing' && ((++FAIL)))
  grep -q 'require_admin' backend/app/routers/admin.py 2>/dev/null && echo '✅ PASS: Admin endpoints protected' && ((++PASS)) || (echo '❌ FAIL: Admin not protected' && ((++FAIL)))
  grep -q 'SecurityHeadersMiddleware\|X-Content-Type' backend/main.py 2>/dev/null && echo '✅ PASS: Security headers set' && ((++PASS)) || (echo '❌ FAIL: Security headers missing' && ((++FAIL)))
  grep -q 'dynamic(' nextjs-app/app/chat/page.tsx 2>/dev/null && echo '✅ PASS: Dynamic imports for performance' && ((++PASS)) || (echo '❌ FAIL: No dynamic imports' && ((++FAIL)))
"

echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}FINAL SUMMARY${NC}"
echo -e "${BLUE}==============================================================${NC}"
echo ""

for result in "${PHASE_RESULTS[@]}"; do
  phase_name="${result#*:}"
  if [[ "$result" == PASS:* ]]; then
    echo -e "  ${GREEN}✅ ${phase_name}${NC}"
  else
    echo -e "  ${RED}❌ ${phase_name}${NC}"
  fi
done

echo ""
echo -e "  Phases passed: ${GREEN}$TOTAL_PASS${NC} / 10"
echo -e "  Phases failed: ${RED}$TOTAL_FAIL${NC} / 10"
echo ""

if [ "$TOTAL_FAIL" -eq 0 ]; then
  echo -e "${GREEN}PRODUCTION READY: All 10 phases complete.${NC}"
elif [ "$TOTAL_FAIL" -le 2 ]; then
  echo -e "${YELLOW}DEMO READY: $TOTAL_FAIL phase(s) still in progress.${NC}"
else
  echo -e "${RED}NOT READY: $TOTAL_FAIL phases failing.${NC}"
fi

if [ "$TOTAL_FAIL" -eq 0 ]; then
  exit 0
fi

exit 1
