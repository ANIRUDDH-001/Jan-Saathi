"""
E2E test replicating the 90-second hackathon demo flow.
Run: pytest backend/tests/test_e2e_demo.py -v -m e2e -s
Requires live backend + seeded Supabase.
"""
import pytest, requests, uuid, time, os

BASE = os.getenv("TEST_API_URL", "http://localhost:8000")

@pytest.mark.e2e
class TestHackathonDemoFlow:
    """Replicates the exact demo narrative step by step."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.sid = f"test-e2e-{uuid.uuid4().hex[:8]}"

    def step(self, n, desc):
        print(f"\n[Step {n}] {desc}")

    def test_complete_demo_flow(self):
        # Step 1: Backend alive
        self.step(1, "Backend health check")
        try:
            r = requests.get(f"{BASE}/health", timeout=5)
            assert r.status_code == 200, f"Backend not running: {r.text}"
        except requests.exceptions.ConnectionError:
            pytest.skip(f"Backend not running at {BASE}")

        # Step 2: IP detection
        self.step(2, "IP detection")
        r = requests.post(f"{BASE}/api/chat/ip-detect")
        assert r.status_code == 200

        # Step 3: First message — farmer introduces himself
        self.step(3, "Farmer introduces: UP, kisan, 48 saal")
        r = requests.post(f"{BASE}/api/chat", json={
            "message": "Main Uttar Pradesh ke Varanasi se hoon. Kisan hoon, fasal ugata hoon. Meri umar 48 saal hai.",
            "session_id": self.sid,
            "language": "hi"
        }, timeout=20)
        assert r.status_code == 200
        d = r.json()
        print(f"  State: {d['state']} | Reply: {d['reply'][:80]}")

        # Allow up to 2 more turns to reach match state
        turns = 0
        while d["state"] == "intake" and turns < 3:
            r = requests.post(f"{BASE}/api/chat", json={
                "message": "Haan kisan hoon, main fasal ugata hoon, UP Varanasi 48 saal",
                "session_id": self.sid, "language": "hi"
            }, timeout=20)
            d = r.json()
            turns += 1

        # Step 4: Should be in match state now
        self.step(4, f"Verify match state (turns used: {turns})")
        assert d["state"] == "match", f"Still in {d['state']} after {turns} turns: {d['reply']}"
        assert d["gap_value"] > 0, "Gap value must be positive"
        
        # Step 5: PM-KISAN must be in results
        self.step(5, "PM-KISAN in scheme results")
        schemes = d["schemes"]
        acronyms = [s.get("acronym","") for s in schemes]
        print(f"  Schemes: {acronyms[:5]}")
        assert "PM-KISAN" in acronyms, f"PM-KISAN not found in: {acronyms}"
        
        # Step 6: Ask about PM-KISAN
        self.step(6, "Ask about PM-KISAN")
        r = requests.post(f"{BASE}/api/chat", json={
            "message": "PM-KISAN ke baare mein batao. Kaise milega?",
            "session_id": self.sid, "language": "hi"
        }, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["state"] in ("match","guide"), f"Unexpected state: {d['state']}"
        assert len(d["reply"]) > 10
        print(f"  Guidance: {d['reply'][:100]}")

        # Step 7: Goodbye summary
        self.step(7, "Goodbye trigger")
        r = requests.post(f"{BASE}/api/chat", json={
            "message": "theek hai bas dhanyawaad",
            "session_id": self.sid, "language": "hi"
        }, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["state"] == "goodbye", f"Expected goodbye, got {d['state']}"
        assert len(d["reply"]) > 20, "Summary too short"
        print(f"  Summary: {d['reply'][:120]}")

        print("\n✓ DEMO FLOW COMPLETE — all 7 steps passed")
