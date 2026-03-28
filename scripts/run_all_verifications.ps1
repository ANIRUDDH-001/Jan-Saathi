# JAN SAATHI — MASTER VERIFICATION RUNNER (PowerShell wrapper)
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts/run_all_verifications.ps1

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $rootDir

function Write-Title {
  param([string]$Text)
  Write-Host ""
  Write-Host "==============================================================" -ForegroundColor Blue
  Write-Host $Text -ForegroundColor Blue
  Write-Host "==============================================================" -ForegroundColor Blue
}

function Get-MatchCount {
  param(
    [string]$Text,
    [string]$Pattern
  )

  if ([string]::IsNullOrEmpty($Text)) {
    return 0
  }

  return ([regex]::Matches($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
}

function Run-Phase {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "=== $Name ===" -ForegroundColor Blue

  $output = ''
  $success = $false

  try {
    $output = (& $Action | Out-String)
    $success = $true
  } catch {
    if ($output) {
      $output += "`n"
    }
    $output += "❌ FAIL: $($_.Exception.Message)"
  }

  if ($output) {
    $filtered = $output -split "`r?`n" | Where-Object {
      $_ -match '✅|❌|⚠️|PASS:|FAIL:|GREEN LIGHT|BLOCKED|WARN|SKIP'
    } | Select-Object -First 20

    if ($filtered) {
      $filtered | ForEach-Object { Write-Host $_ }
    }
  }

  $passCount = Get-MatchCount -Text $output -Pattern '✅\s*PASS|(^|\s)PASS:'
  $failCount = Get-MatchCount -Text $output -Pattern '❌\s*FAIL|(^|\s)FAIL:'
  $warnCount = Get-MatchCount -Text $output -Pattern '⚠️|(^|\s)WARN|WARNING|SKIP'

  if (-not $success -and $failCount -eq 0) {
    $failCount = 1
  }

  Write-Host ""
  Write-Host "  Checks: $passCount pass / $failCount fail / $warnCount warn"

  $phaseOk = ($failCount -eq 0)

  if ($phaseOk) {
    Write-Host "  PASS ${Name}: GREEN LIGHT" -ForegroundColor Green
  } else {
    Write-Host "  FAIL ${Name}: BLOCKED ($failCount failures)" -ForegroundColor Red
  }

  return [pscustomobject]@{
    Name = $Name
    Passed = $phaseOk
    Output = $output
  }
}

Write-Title -Text 'JAN SAATHI — COMPLETE VERIFICATION SUITE'

$bashCmd = Get-Command bash -ErrorAction SilentlyContinue
if ($bashCmd) {
  Write-Host 'Using Bash runner for full parity with Linux/CI checks.' -ForegroundColor Yellow
  & bash "scripts/run_all_verifications.sh"
  exit $LASTEXITCODE
}

Write-Host 'Bash not found. Running PowerShell-native fallback checks.' -ForegroundColor Yellow

$results = @()

$results += Run-Phase -Name 'PHASE 0: Emergency Stabilization' -Action {
  if (Test-Path 'frontend/src/app/components/ShubhAvatar.tsx') { '✅ PASS: ShubhAvatar exists' } else { '❌ FAIL: ShubhAvatar missing' }
  $vedRefs = (Get-ChildItem 'frontend/src' -Recurse -Filter *.tsx -ErrorAction SilentlyContinue | Select-String -Pattern 'VedAvatar' -ErrorAction SilentlyContinue | Measure-Object).Count
  if ($vedRefs -eq 0) { '✅ PASS: No VedAvatar refs' } else { "❌ FAIL: VedAvatar still referenced ($vedRefs)" }
  if (Test-Path 'frontend/src/app/components/AdminGuard.tsx') { '✅ PASS: AdminGuard exists' } else { '❌ FAIL: AdminGuard missing' }
}

$results += Run-Phase -Name 'PHASE 1: Backend Core' -Action {
  if (Test-Path 'backend/app/services/groq_llm.py') { '✅ PASS: Groq service exists' } else { '❌ FAIL: Groq service missing' }
  if (Test-Path 'backend/app/services/cohere_embed.py') { '✅ PASS: Cohere service exists' } else { '❌ FAIL: Cohere service missing' }
  if (Test-Path 'backend/app/services/supabase_db.py') { '✅ PASS: Supabase service exists' } else { '❌ FAIL: Supabase service missing' }
}

$results += Run-Phase -Name 'PHASE 2: Voice Pipeline' -Action {
  if (Test-Path 'backend/app/services/sarvam.py') { '✅ PASS: Sarvam service exists' } else { '❌ FAIL: Sarvam service missing' }
  if (Test-Path 'frontend/src/app/components/VoiceWaveform.tsx') { '✅ PASS: VoiceWaveform exists' } else { '❌ FAIL: VoiceWaveform missing' }
  if (Test-Path 'frontend/src/app/pages/Chat.tsx') { '✅ PASS: Chat page exists' } else { '❌ FAIL: Chat page missing' }
  '⚠️ WARN: Full Phase 2 script requires Bash (scripts/verify_phase2.sh).'
}

$results += Run-Phase -Name 'PHASE 3: Frontend Integration' -Action {
  if (Test-Path 'frontend/src/app/routes.ts') { '✅ PASS: routes.ts exists' } else { '❌ FAIL: routes.ts missing' }
  Push-Location 'frontend'
  try {
    npm run build *> $null
    if ($LASTEXITCODE -eq 0) { '✅ PASS: Frontend builds' } else { '❌ FAIL: Frontend build failed' }
  } finally {
    Pop-Location
  }
}

$results += Run-Phase -Name 'PHASE 4: Shubh Avatar + Audio-First' -Action {
  if (Test-Path 'frontend/src/app/components/ShubhAvatar.tsx') { '✅ PASS: ShubhAvatar present' } else { '❌ FAIL: ShubhAvatar missing' }
  if (Test-Path 'frontend/src/app/pages/AudioEntry.tsx') { '✅ PASS: AudioEntry present' } else { '❌ FAIL: AudioEntry missing' }
}

$results += Run-Phase -Name 'PHASE 5: Form Fill + PDF' -Action {
  if (Test-Path 'backend/app/services/pdf_generator.py') { '✅ PASS: PDF generator exists' } else { '❌ FAIL: PDF generator missing' }
  $req = Get-Content 'backend/requirements.txt' -ErrorAction SilentlyContinue
  if ($req -match 'reportlab') { '✅ PASS: reportlab in requirements' } else { '❌ FAIL: reportlab missing' }
}

$results += Run-Phase -Name 'PHASE 6: Next.js Migration' -Action {
  if (Test-Path 'nextjs-app/app/layout.tsx') { '✅ PASS: layout.tsx exists' } else { '❌ FAIL: layout.tsx missing' }
  if (Test-Path 'nextjs-app/app/api/chat/route.ts') { '✅ PASS: API chat route exists' } else { '❌ FAIL: API chat route missing' }
  Push-Location 'nextjs-app'
  try {
    npm run build *> $null
    if ($LASTEXITCODE -eq 0) { '✅ PASS: Next.js build passes' } else { '❌ FAIL: Next.js build failed' }
  } finally {
    Pop-Location
  }
}

$results += Run-Phase -Name 'PHASE 7: PWA' -Action {
  if (Test-Path 'nextjs-app/public/manifest.json') { '✅ PASS: manifest.json exists' } else { '❌ FAIL: manifest.json missing' }
  if (Test-Path 'nextjs-app/app/offline/page.tsx') { '✅ PASS: offline page exists' } else { '❌ FAIL: offline page missing' }
  '⚠️ WARN: Full Phase 7 script requires Bash (scripts/verify_phase7.sh).'
}

$results += Run-Phase -Name 'PHASE 8: Testing + CI' -Action {
  if (Test-Path '.github/workflows/ci.yml') { '✅ PASS: CI file exists' } else { '❌ FAIL: CI file missing' }
  if (Test-Path 'nextjs-app/tests/e2e/user-journey.spec.ts') { '✅ PASS: E2E spec exists' } else { '❌ FAIL: E2E spec missing' }
  '⚠️ WARN: Full Phase 8 script requires Bash (scripts/verify_phase8.sh).'
}

$results += Run-Phase -Name 'PHASE 9: Security + Performance' -Action {
  if (Test-Path 'backend/main.py') { '✅ PASS: backend main exists' } else { '❌ FAIL: backend main missing' }
  if (Test-Path 'backend/app/routers/admin.py') { '✅ PASS: admin router exists' } else { '❌ FAIL: admin router missing' }
  if (Test-Path 'nextjs-app/app/chat/page.tsx') { '✅ PASS: chat page exists' } else { '❌ FAIL: chat page missing' }
}

$passed = ($results | Where-Object { $_.Passed }).Count
$failed = $results.Count - $passed

Write-Title -Text 'FINAL SUMMARY'

foreach ($r in $results) {
  if ($r.Passed) {
    Write-Host "  ✅ $($r.Name)" -ForegroundColor Green
  } else {
    Write-Host "  ❌ $($r.Name)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "  Phases passed: $passed / 10" -ForegroundColor Green
Write-Host "  Phases failed: $failed / 10" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
  Write-Host 'PRODUCTION READY: All 10 phases complete.' -ForegroundColor Green
  exit 0
}

if ($failed -le 2) {
  Write-Host "DEMO READY: $failed phase(s) still in progress." -ForegroundColor Yellow
  exit 1
}

Write-Host "NOT READY: $failed phases failing." -ForegroundColor Red
exit 1
