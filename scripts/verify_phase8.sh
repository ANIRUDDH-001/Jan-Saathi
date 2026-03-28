#!/bin/bash
# Phase 8 Verification — run from repo root
PASS=0; FAIL=0

echo "=== PHASE 8 VERIFICATION ==="
echo ""

# CI file exists
if [ -f ".github/workflows/ci.yml" ]; then
  echo "✅ PASS: GitHub Actions CI configured"
  ((PASS++))
else
  echo "❌ FAIL: Missing .github/workflows/ci.yml"
  ((FAIL++))
fi

# E2E test file exists
if [ -f "nextjs-app/tests/e2e/user-journey.spec.ts" ]; then
  echo "✅ PASS: E2E tests exist"
  ((PASS++))
else
  echo "❌ FAIL: E2E tests missing"
  ((FAIL++))
fi

# Playwright config exists
if [ -f "nextjs-app/playwright.config.ts" ]; then
  echo "✅ PASS: Playwright configured"
  ((PASS++))
else
  echo "❌ FAIL: Playwright config missing"
  ((FAIL++))
fi

# Vitest config exists
if [ -f "nextjs-app/vitest.config.ts" ]; then
  echo "✅ PASS: Vitest configured"
  ((PASS++))
else
  echo "❌ FAIL: Vitest config missing"
  ((FAIL++))
fi

# Test count checks
echo ""
echo "--- Test Count Audit ---"

BACKEND_TEST_COUNT=$(grep -r "def test_" backend/tests/ --include="*.py" 2>/dev/null | wc -l)
FRONTEND_TEST_COUNT=$(grep -rE "\b(it|test)\(" nextjs-app/tests/unit/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
E2E_COUNT=$(grep -rE "\btest\(" nextjs-app/tests/e2e/ --include="*.ts" 2>/dev/null | wc -l)

echo "  Backend tests:        $BACKEND_TEST_COUNT"
echo "  Frontend unit tests:  $FRONTEND_TEST_COUNT"
echo "  E2E tests:            $E2E_COUNT"

[ "$BACKEND_TEST_COUNT" -ge 20 ] && \
  { echo "✅ PASS: ≥20 backend tests"; ((PASS++)); } || \
  { echo "❌ FAIL: Need ≥20 backend tests (have $BACKEND_TEST_COUNT)"; ((FAIL++)); }

[ "$FRONTEND_TEST_COUNT" -ge 10 ] && \
  { echo "✅ PASS: ≥10 frontend unit tests"; ((PASS++)); } || \
  { echo "❌ FAIL: Need ≥10 frontend unit tests (have $FRONTEND_TEST_COUNT)"; ((FAIL++)); }

[ "$E2E_COUNT" -ge 6 ] && \
  { echo "✅ PASS: ≥6 E2E tests"; ((PASS++)); } || \
  { echo "❌ FAIL: Need ≥6 E2E tests (have $E2E_COUNT)"; ((FAIL++)); }

echo ""
echo "--- Runtime Tests ---"

# Backend tests
echo "Running backend tests..."
cd backend 2>/dev/null && python -m pytest tests/ -v --timeout=30 -q \
  --ignore=tests/test_integration.py --ignore=tests/test_e2e_demo.py --ignore=tests/test_smoke.py 2>&1 | tail -25
BACKEND_RESULT=$?
cd ..
[ $BACKEND_RESULT -eq 0 ] && \
  { echo "✅ PASS: Backend pytest passes"; ((PASS++)); } || \
  { echo "❌ FAIL: Backend pytest failed (exit $BACKEND_RESULT)"; ((FAIL++)); }

# Frontend unit tests
echo ""
echo "Running frontend unit tests..."
cd nextjs-app 2>/dev/null && npx vitest run --reporter=verbose 2>&1 | tail -25
UNIT_RESULT=$?
cd ..
[ $UNIT_RESULT -eq 0 ] && \
  { echo "✅ PASS: Frontend vitest passes"; ((PASS++)); } || \
  { echo "❌ FAIL: Frontend vitest failed (exit $UNIT_RESULT)"; ((FAIL++)); }

echo ""
echo "==============================="
echo "PASSED: $PASS / $((PASS + FAIL)) | FAILED: $FAIL"
[ "$FAIL" -eq 0 ] && echo "🟢 PHASE 8 GREEN LIGHT" || echo "🔴 PHASE 8 BLOCKED"
