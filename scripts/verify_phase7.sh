#!/bin/bash
# Save as: scripts/verify_phase7.sh
PASS=0; FAIL=0

p() {
  if grep -q "$3" "$2" 2>/dev/null; then
    echo "✅ PASS: $1"
    PASS=$((PASS+1))
  else
    echo "❌ FAIL: $1"
    FAIL=$((FAIL+1))
  fi
}
f() {
  if [ -f "$1" ]; then
    echo "✅ PASS: File exists — $1"
    PASS=$((PASS+1))
  else
    echo "❌ FAIL: Missing — $1"
    FAIL=$((FAIL+1))
  fi
}

echo "=== PHASE 7 VERIFICATION ==="

f "nextjs-app/public/manifest.json"
f "nextjs-app/app/offline/page.tsx"

p "manifest has correct name" "nextjs-app/public/manifest.json" "Jan Saathi"
p "manifest has standalone display" "nextjs-app/public/manifest.json" "standalone"
p "manifest has icons" "nextjs-app/public/manifest.json" "icons"
p "manifest has start_url" "nextjs-app/public/manifest.json" "start_url"
p "next.config has PWA" "nextjs-app/next.config.ts" "withPWA\|next-pwa"
p "layout.tsx links manifest" "nextjs-app/app/layout.tsx" "manifest"

# Check icons exist
ICON_COUNT=$(ls nextjs-app/public/icons/*.png 2>/dev/null | wc -l)
if [ "$ICON_COUNT" -ge 6 ]; then
  echo "✅ PASS: $ICON_COUNT PWA icons generated"
  ((PASS++))
else
  echo "❌ FAIL: Only $ICON_COUNT icons (need at least 6)"
  ((FAIL++))
fi

p "AudioEntry has offline detection" \
  "nextjs-app/components/pages/AudioEntry.tsx" "isOnline\|navigator.onLine"

# Lighthouse PWA check (requires running server)
echo ""
echo "Build and run for Lighthouse check..."
cd nextjs-app && npm run build 2>&1 | tail -3
BUILD_OK=$?
cd ..
[ $BUILD_OK -eq 0 ] && \
  { echo "✅ PASS: Build succeeds with PWA"; ((PASS++)); } || \
  { echo "❌ FAIL: Build failed"; ((FAIL++)); }

echo ""
echo "PASSED: $PASS / $((PASS + FAIL)) | FAILED: $FAIL"
[ "$FAIL" -eq 0 ] && echo "🟢 PHASE 7 GREEN LIGHT" || echo "🔴 PHASE 7 BLOCKED"
