"""
GitHub App Authentication — generates installation tokens for any repo.

Flow:
  1. Load private key (.pem file)
  2. Create a JWT signed with the private key
  3. Exchange JWT for an installation access token
  4. Use that token to create PRs on any repo where the app is installed

The installation_id comes from the webhook payload automatically.
One private key works for ALL installations.
"""

import os
import json
import time
import jwt  # PyJWT library
import urllib.request
import urllib.error

# App ID from GitHub App settings
APP_ID = os.getenv("GITHUB_APP_ID", "3245199")

# Private key — loaded from file or env var
_private_key = None


def _get_private_key() -> str:
    """Load the private key from file or environment variable."""
    global _private_key
    if _private_key:
        return _private_key

    # Try file first (local dev)
    key_path = os.path.join(os.path.dirname(__file__), "private-key.pem")
    if os.path.exists(key_path):
        with open(key_path, "r") as f:
            _private_key = f.read()
        return _private_key

    # Try env var (production — Render)
    env_key = os.getenv("GITHUB_APP_PRIVATE_KEY", "")
    if env_key:
        # Render stores multiline env vars with \n as literal characters
        _private_key = env_key.replace("\\n", "\n")
        return _private_key

    raise Exception("GitHub App private key not found. Set GITHUB_APP_PRIVATE_KEY env var or place private-key.pem in backend/")


def create_jwt() -> str:
    """Create a JWT signed with the app's private key. Valid for 10 minutes."""
    now = int(time.time())
    payload = {
        "iat": now - 60,        # Issued at (60s in the past to account for clock drift)
        "exp": now + (10 * 60), # Expires in 10 minutes
        "iss": APP_ID,          # Issuer = your App ID
    }
    private_key = _get_private_key()
    return jwt.encode(payload, private_key, algorithm="RS256")


def get_installation_token(installation_id: int) -> str:
    """Exchange JWT for an installation access token. Token lasts 1 hour."""
    app_jwt = create_jwt()

    url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
    req = urllib.request.Request(url, data=b"", method="POST")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", f"Bearer {app_jwt}")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data["token"]
    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode()
        except Exception:
            pass
        raise Exception(f"Failed to get installation token: {e.code} {error_body}")


# Cache tokens per installation (they last 1 hour)
_token_cache = {}


def get_token_for_installation(installation_id: int) -> str:
    """Get an installation token with simple caching (reuse for 50 minutes)."""
    now = time.time()
    cached = _token_cache.get(installation_id)

    if cached and cached["expires_at"] > now:
        return cached["token"]

    token = get_installation_token(installation_id)
    _token_cache[installation_id] = {
        "token": token,
        "expires_at": now + (50 * 60),  # Cache for 50 min (token lasts 60 min)
    }
    return token
