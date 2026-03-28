"""test_auth.py — JWT creation/decode, admin access control."""
import pytest


class TestJWT:
    def test_create_and_decode_jwt(self):
        """create_jwt + decode_jwt round-trip preserves sub/email/role."""
        from app.routers.auth import create_jwt, decode_jwt
        token = create_jwt("user123", "test@example.com", "citizen")
        payload = decode_jwt(token)
        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "citizen"

    def test_invalid_jwt_raises(self):
        """Decoding an invalid token raises JWTError."""
        from jose import JWTError
        from app.routers.auth import decode_jwt
        with pytest.raises(JWTError):
            decode_jwt("invalid.token.here")


class TestAuthEndpoints:
    def test_google_url_returns_correct_fields(self, client):
        """Google OAuth URL endpoint returns a URL with correct OAuth params."""
        r = client.get("/auth/google")
        assert r.status_code == 200
        url = r.json()["url"]
        assert "accounts.google.com" in url
        assert "openid" in url

    def test_invalid_bearer_returns_401(self, client):
        """Invalid JWT in Authorization header → 401."""
        r = client.get("/api/admin/stats",
                       headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401

    def test_missing_auth_returns_401(self, client):
        """Missing Authorization header → 401."""
        r = client.get("/api/admin/stats")
        assert r.status_code == 401


class TestAdminAccess:
    def test_admin_stats_with_valid_admin_token(self, client, mock_db):
        """Admin user can access /api/admin/stats."""
        from app.routers.auth import create_jwt
        token = create_jwt("admin-uid", "aniruddhvijay2k7@gmail.com", "admin")
        r = client.get("/api/admin/stats",
                       headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        d = r.json()
        assert d["total_schemes"] == 51

    def test_citizen_forbidden_from_admin(self, client):
        """Citizen role cannot access admin endpoints → 403."""
        from app.routers.auth import create_jwt
        token = create_jwt("user-uid", "farmer@gmail.com", "citizen")
        r = client.get("/api/admin/stats",
                       headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_integrations_panel_returns_3_apis(self, client):
        """Admin integrations panel returns exactly 3 API entries."""
        from app.routers.auth import create_jwt
        token = create_jwt("admin-uid", "aniruddhvijay2k7@gmail.com", "admin")
        r = client.get("/api/admin/integrations",
                       headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        d = r.json()
        assert "apis" in d
        assert len(d["apis"]) == 3
        names = [a["name"] for a in d["apis"]]
        assert "MyScheme API" in names
        assert "PM-KISAN Beneficiary Status" in names
