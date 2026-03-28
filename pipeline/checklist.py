#!/usr/bin/env python3
"""Pre-submission checklist — run before demo."""
import os, requests, sys
from supabase import create_client
from dotenv import load_dotenv

# Try loading from various locations if needed
load_dotenv(".env")
load_dotenv("../.env")
load_dotenv("pipeline/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
BASE = os.getenv("BACKEND_URL", "http://localhost:8000")
FE   = os.getenv("FRONTEND_URL", "http://localhost:5173")

P, F = "✓", "✗"

def check(label, cond, detail=""):
    marker = P if cond else F
    print(f"  {marker} {label}" + (f" [{detail}]" if detail else ""))
    return cond

passed = []

print("\n=== JAN SAATHI PRE-SUBMISSION CHECKLIST ===\n")

# DB checks
print("─ Database ─")
try:
    if not SUPABASE_URL or not SUPABASE_KEY:
        check("Supabase credentials", False, "Missing in .env")
        passed.append(False)
    else:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        r = sb.table("schemes").select("id", count="exact").eq("is_verified",True).execute()
        passed.append(check("51 schemes verified", r.count == 51, str(r.count)))
        
        r = sb.table("scheme_chunks").select("id",count="exact").execute()
        passed.append(check("102 chunks with embeddings", r.count == 102, str(r.count)))
        
        r = sb.table("schemes").select("benefit_annual_inr").eq("acronym","PM-KISAN").execute()
        val = r.data[0]["benefit_annual_inr"] if r.data else None
        passed.append(check("PM-KISAN = ₹6,000/year", val == 6000, str(val)))
        
        r = sb.table("schemes").select("benefit_annual_inr").ilike("name_english","%Maandhan%").execute()
        val = r.data[0]["benefit_annual_inr"] if r.data else None
        passed.append(check("PM-KMY = ₹36,000/year", val == 36000, str(val)))
except Exception as e:
    check("Database connection failed", False, str(e))
    passed.append(False)

# Backend checks
print("\n─ Backend ─")
try:
    r = requests.get(f"{BASE}/health", timeout=5)
    passed.append(check("Backend /health returns 200", r.status_code == 200))
except Exception as e:
    passed.append(check("Backend /health returns 200", False, "Connection refused"))

try:
    r = requests.post(f"{BASE}/api/chat", json={
        "message":"Main UP se hoon kisan hoon 45 saal fasal ugata hoon",
        "session_id":"checklist-test-001","language":"hi"
    }, timeout=15)
    if r.status_code == 200:
        d = r.json()
        passed.append(check("Chat intake→match transition", d.get("state") in ("intake","match")))
        if d.get("state") == "match":
            passed.append(check("Gap value > 0", d.get("gap_value",0) > 0, str(d.get("gap_value"))))
            schemes = d.get("schemes",[])
            passed.append(check("PM-KISAN in top results", any(s.get("acronym")=="PM-KISAN" for s in schemes)))
    else:
        passed.append(check("Chat endpoint works", False, f"Status code {r.status_code}"))
except Exception as e:
    passed.append(check("Chat endpoint works", False, str(e)))

# Admin
print("\n─ Admin ─")
try:
    sys.path.insert(0, os.path.dirname(__file__)+"/../backend")
    from app.routers.auth import make_token
    token = make_token("admin","aniruddhvijay2k7@gmail.com","admin")
    r = requests.get(f"{BASE}/api/admin/integrations", headers={"Authorization":f"Bearer {token}"}, timeout=5)
    passed.append(check("APISetu integrations panel accessible", r.status_code == 200))
except Exception as e:
    passed.append(check("APISetu integrations panel accessible", False, str(e)))

# Frontend
print("\n─ Frontend ─")
try:
    r = requests.get(FE, timeout=5)
    passed.append(check("Frontend loads", r.status_code == 200))
except Exception as e:
    passed.append(check("Frontend loads", False, "not running"))

# Summary
print(f"\n{'─'*40}")
ok = sum(1 for p in passed if p)
total = len(passed)
print(f"\n  {ok}/{total} checks passed")
if ok == total:
    print("\n  ✓ READY FOR DEMO\n")
else:
    print(f"\n  ✗ {total-ok} issues to fix before demo\n")
