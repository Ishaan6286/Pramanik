"""
GitHub Compliance Code Agent
Scans a GitHub repository for compliance violations across SOC 2, ISO 27001, HIPAA, and DPDP Act 2023.

Finds 15 categories of violations using static analysis (regex).
Also acts as a Policy Agent — checks for security documentation.
"""

import re
import base64
import json
import os
import tempfile
import shutil
import subprocess
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error

# Optional: set GITHUB_DEFAULT_TOKEN in .env to avoid rate limits on public repos
_DEFAULT_TOKEN = os.getenv("GITHUB_DEFAULT_TOKEN", "")


# ── 15 Compliance Violation Patterns ─────────────────────────────────────────

COMPLIANCE_PATTERNS = [
    {
        "id": "CRED-001",
        "name": "Hardcoded AWS Credentials",
        "pattern": r'AKIA[0-9A-Z]{16}',
        "controls": ["CC6.1", "CC9.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "CRITICAL",
        "message": "AWS Access Key hardcoded in source code. Immediate rotation required.",
        "fix": "Rotate the key immediately. Use environment variables or AWS Secrets Manager.",
    },
    {
        "id": "CRED-002",
        "name": "Hardcoded Passwords/Secrets",
        "pattern": r'(?i)(password|passwd|secret|api_key|apikey)\s*=\s*["\'][^"\'\\]{4,}["\']',
        "controls": ["CC6.1", "CC6.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "CRITICAL",
        "message": "Credentials hardcoded in source code.",
        "fix": "Move to environment variables. Use AWS Secrets Manager or HashiCorp Vault.",
    },
    {
        "id": "ENC-001",
        "name": "SSL Verification Disabled",
        "pattern": r'verify\s*=\s*False|ssl_verify\s*=\s*False|InsecureRequestWarning|disable_warnings',
        "controls": ["CC6.7", "CC9.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "HIGH",
        "message": "SSL/TLS certificate verification disabled — vulnerable to MITM attacks.",
        "fix": "Remove verify=False. Add self-signed certs to trust store if needed.",
    },
    {
        "id": "ENC-002",
        "name": "Unencrypted HTTP Connection",
        "pattern": r'http://(?!localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com)',
        "controls": ["CC6.7", "CC6.6"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "HIGH",
        "message": "Unencrypted HTTP connection — data transmitted in plaintext.",
        "fix": "Replace http:// with https:// for all external connections.",
    },
    {
        "id": "SQLI-001",
        "name": "SQL Injection Risk",
        "pattern": r'execute\s*\(\s*["\'].*%s|execute\s*\(\s*f["\'].*\{.*\}|cursor\.execute\s*\(\s*"[^"]*"\s*\+',
        "controls": ["CC6.6", "CC5.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "CRITICAL",
        "message": "SQL query built from user input — SQL injection vulnerability.",
        "fix": "Use parameterized queries or ORM. Never concatenate user input into SQL.",
    },
    {
        "id": "LOG-001",
        "name": "Sensitive Data in Logs",
        "pattern": r'(?i)(logger|logging|log|print)\s*[\.\(].*(?:password|ssn|credit.?card|aadhaar|pan\b|dob\b|token)',
        "controls": ["CC7.2", "C1.1"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "HIGH",
        "message": "PII or credentials being written to logs — violates data protection rules.",
        "fix": "Remove PII from logs. Implement log masking for sensitive fields.",
    },
    {
        "id": "CORS-001",
        "name": "Wildcard CORS Policy",
        "pattern": r'Access-Control-Allow-Origin["\s:]*\*|allow_origins\s*=\s*\[\s*["\*]|origins\s*=\s*\[\s*["\']?\*',
        "controls": ["CC6.6", "CC5.2"],
        "frameworks": ["soc2", "iso27001"],
        "severity": "MEDIUM",
        "message": "CORS allows all origins (*) — cross-origin requests unrestricted.",
        "fix": "Specify exact allowed origins. Never use wildcard * in production.",
    },
    {
        "id": "DEBUG-001",
        "name": "Debug Mode in Production Code",
        "pattern": r'DEBUG\s*=\s*True|app\.run\s*\([^)]*debug\s*=\s*True|"debug"\s*:\s*true',
        "controls": ["CC6.8", "CC5.1"],
        "frameworks": ["soc2", "iso27001"],
        "severity": "HIGH",
        "message": "Debug mode enabled — exposes stack traces and internal config to attackers.",
        "fix": "Set DEBUG=False in production. Control with environment variable.",
    },
    {
        "id": "RAND-001",
        "name": "Cryptographically Weak Random",
        "pattern": r'^(?!.*#).*\brandom\.random\(\)|random\.randint\(|random\.choice\(',
        "controls": ["CC6.2", "CC9.2"],
        "frameworks": ["soc2", "iso27001"],
        "severity": "MEDIUM",
        "message": "Using non-cryptographic random for security tokens or session IDs.",
        "fix": "Use secrets module (Python) or crypto.randomBytes() (Node.js) for security values.",
    },
    {
        "id": "EXCEPT-001",
        "name": "Silent Exception Handling",
        "pattern": r'except\s*:\s*pass|except\s+Exception\s*:\s*pass|catch\s*\(\w*\)\s*\{\s*\}',
        "controls": ["CC7.2", "CC7.3"],
        "frameworks": ["soc2", "iso27001"],
        "severity": "MEDIUM",
        "message": "Silent exception handling removes audit trail — security events may go undetected.",
        "fix": "Log all caught exceptions. Implement error monitoring (Sentry, CloudWatch).",
    },
    {
        "id": "S3-001",
        "name": "Public S3 Bucket in Code",
        "pattern": r'ACL\s*=\s*["\']public-read|acl\s*=\s*["\']public-read|BlockPublicAcls.*[Ff]alse',
        "controls": ["CC6.6", "C1.1"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "CRITICAL",
        "message": "Code creates or configures public S3 bucket — data exposure risk.",
        "fix": "Remove public ACLs. Enable S3 Block Public Access at account level.",
    },
    {
        "id": "IAM-001",
        "name": "Wildcard IAM Permissions",
        "pattern": r'"Action"\s*:\s*"\*"|"Resource"\s*:\s*"\*"',
        "controls": ["CC6.3", "CC6.1"],
        "frameworks": ["soc2", "iso27001", "hipaa"],
        "severity": "CRITICAL",
        "message": "IAM policy grants wildcard Action or Resource — violates least privilege.",
        "fix": "Specify exact Actions and Resources needed. Apply least-privilege principle.",
    },
    {
        "id": "PII-001",
        "name": "Indian PII Collection (DPDP)",
        "pattern": r'(?i)(aadhaar|pan_number|voter_id|passport_no|date_of_birth\b)',
        "controls": ["C1.1"],
        "frameworks": ["hipaa", "dpdp"],
        "severity": "HIGH",
        "message": "Code collects Indian PII — DPDP Act §4 requires explicit consent before collection.",
        "fix": "Implement consent management before collecting personal data. Document purpose.",
    },
    {
        "id": "TF-001",
        "name": "Unencrypted Terraform Resource",
        "pattern": r'encrypted\s*=\s*false|storage_encrypted\s*=\s*false|enable_dns_support\s*=\s*false',
        "controls": ["CC9.2", "A1.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "HIGH",
        "message": "Infrastructure-as-code defines unencrypted AWS resource.",
        "fix": "Set encrypted=true on all Terraform RDS/EBS/S3 resources.",
    },
    {
        "id": "CT-001",
        "name": "CloudTrail Not Configured",
        "pattern": r'(?i)(cloudtrail|cloud_trail).*enabled\s*=\s*false|is_logging\s*=\s*false',
        "controls": ["CC7.2", "CC8.1"],
        "frameworks": ["soc2", "iso27001", "hipaa"],
        "severity": "CRITICAL",
        "message": "CloudTrail logging disabled in infrastructure code — no audit trail.",
        "fix": "Enable CloudTrail with multi-region and log file validation enabled.",
    },
    {
        "id": "NOSQL-001",
        "name": "NoSQL Injection Risk",
        "pattern": r'(?i)(find|findOne|findMany|update|delete|aggregate)\s*\(\s*\{[^}]*req\.(body|query|params)|\$where\s*:\s*["\']|\.find\s*\(\s*\{[^}]*\+',
        "controls": ["CC6.8", "CC5.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "CRITICAL",
        "message": "NoSQL query built with unsanitized user input — allows authentication bypass and data exfiltration.",
        "fix": "Sanitize all inputs before MongoDB/NoSQL operations. Use mongoose-sanitize or express-mongo-sanitize.",
    },
    {
        "id": "EVAL-001",
        "name": "eval() with User Input (SSJI)",
        "pattern": r'eval\s*\([^)]*req\.(body|query|params)|eval\s*\([^)\n]*\+[^)\n]*\)|new\s+Function\s*\([^)]*req\.',
        "controls": ["CC6.8", "CC5.2"],
        "frameworks": ["soc2", "iso27001"],
        "severity": "CRITICAL",
        "message": "eval() called with user-controlled input — Server-Side JavaScript Injection (SSJI).",
        "fix": "Never use eval() with user input. Use JSON.parse() for data, avoid dynamic code execution.",
    },
    {
        "id": "XSS-001",
        "name": "Cross-Site Scripting (XSS) Risk",
        "pattern": r'innerHTML\s*=\s*[^;\n]*req\.(body|query|params)|document\.write\s*\([^)]*req\.|res\.send\s*\([^)]*req\.(body|query|params)|res\.render\s*\([^,]+,\s*\{[^}]*req\.(body|query|params)',
        "controls": ["CC6.8", "CC5.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "HIGH",
        "message": "User input reflected into HTML response without sanitization — XSS vulnerability.",
        "fix": "Sanitize all user input with DOMPurify (client) or xss-clean (server). Use templating engines with auto-escaping.",
    },
    {
        "id": "JWT-001",
        "name": "Insecure JWT Configuration",
        "pattern": r'algorithm\s*[=:]\s*["\']none["\']|jwt\.sign\s*\([^,]+,\s*["\'][^"\']{1,8}["\']|verify\s*\([^,]+,\s*["\'][^"\']{1,8}["\']',
        "controls": ["CC6.1", "CC6.2"],
        "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"],
        "severity": "CRITICAL",
        "message": "JWT signed with 'none' algorithm or a weak (<8 char) hardcoded secret — authentication bypass possible.",
        "fix": "Use RS256/ES256 algorithm with a strong secret (32+ chars) stored in environment variables.",
    },
    {
        "id": "CSRF-001",
        "name": "Missing CSRF Protection",
        "pattern": r'app\.(post|put|delete|patch)\s*\(["\'][^"\']*(?:login|signup|register|checkout|payment|transfer|account|profile|settings)[^"\']*["\']',
        "controls": ["CC6.8", "CC5.2"],
        "frameworks": ["soc2", "iso27001"],
        "severity": "HIGH",
        "message": "Sensitive state-changing route without visible CSRF protection — session riding attack possible.",
        "fix": "Add csurf or csrf-csrf middleware. Validate CSRF token on all POST/PUT/DELETE routes.",
    },
    {
        "id": "RATELIMIT-001",
        "name": "No Rate Limiting on Auth Endpoint",
        "pattern": r'(?i)router\.(post|get)\s*\(["\'][^"\']*(?:login|signin|auth|password|token)[^"\']*["\']|app\.(post|get)\s*\(["\'][^"\']*(?:login|signin|auth|password)[^"\']*["\']',
        "controls": ["CC6.1", "CC6.6"],
        "frameworks": ["soc2", "iso27001", "hipaa"],
        "severity": "HIGH",
        "message": "Authentication endpoint without visible rate limiting — brute force attacks possible.",
        "fix": "Add express-rate-limit or similar. Limit to 5-10 attempts per minute per IP on auth endpoints.",
    },
    {
        "id": "HEADER-001",
        "name": "Missing Security Headers (No Helmet)",
        "pattern": r'app\.listen\s*\(|createServer\s*\(',
        "controls": ["CC6.6", "CC6.8"],
        "frameworks": ["soc2", "iso27001"],
        "severity": "MEDIUM",
        "message": "HTTP server started — verify security headers (helmet.js) are configured for CSP, HSTS, X-Frame-Options.",
        "fix": "Add helmet() middleware: app.use(require('helmet')()). Prevents clickjacking, MIME sniffing, and XSS via headers.",
    },
    {
        "id": "COOKIE-001",
        "name": "Insecure Cookie Configuration",
        "pattern": r'res\.cookie\s*\([^)]*\)|session\s*\(\s*\{[^}]*secret',
        "controls": ["CC6.1", "CC6.7"],
        "frameworks": ["soc2", "iso27001", "hipaa"],
        "severity": "HIGH",
        "message": "Cookie or session set — verify secure, httpOnly, and sameSite flags are configured.",
        "fix": "Set { secure: true, httpOnly: true, sameSite: 'strict' } on all cookies. Use __Host- prefix for sensitive cookies.",
    },
    {
        "id": "GD-001",
        "name": "GuardDuty Threat Detection Disabled",
        "pattern": r'aws_guardduty_detector[^{]*\{[^}]*enable\s*=\s*false',
        "controls": ["CC7.1", "CC7.2"],
        "frameworks": ["soc2", "iso27001", "hipaa"],
        "severity": "HIGH",
        "message": "AWS GuardDuty disabled in Terraform — no threat detection active.",
        "fix": "Set enable = true on aws_guardduty_detector. Enable in all regions, not just primary.",
    },
]

# ── Policy Document Checks ────────────────────────────────────────────────────

POLICY_DOCS = [
    {"path": "SECURITY.md", "name": "Security Policy", "control": "CC2.1"},
    {"path": ".github/SECURITY.md", "name": "GitHub Security Policy", "control": "CC2.1"},
    {"path": "PRIVACY.md", "name": "Privacy Policy", "control": "C1.1"},
    {"path": "privacy-policy.md", "name": "Privacy Policy", "control": "C1.1"},
    {"path": ".github/CODEOWNERS", "name": "Code Ownership", "control": "CC6.3"},
    {"path": "INCIDENT_RESPONSE.md", "name": "Incident Response Plan", "control": "CC7.3"},
    {"path": "docs/incident-response.md", "name": "Incident Response Plan", "control": "CC7.3"},
    {"path": ".github/workflows/security-scan.yml", "name": "Automated Security Scan", "control": "CC4.1"},
    {"path": "CHANGELOG.md", "name": "Change Log", "control": "CC8.1"},
    {"path": "CONTRIBUTING.md", "name": "Contribution Guidelines", "control": "CC6.3"},
]

# Directories to skip entirely — never contain violations, waste API calls
SKIP_DIRS = {
    "node_modules", ".git", "vendor", "dist", "build", ".next",
    "__pycache__", ".venv", "venv", "env", "migrations",
    "coverage", ".cache", ".nyc_output", ".parcel-cache",
    "storybook-static", "public", "static", "assets",
}

# Specific filenames to skip — lock files, minified files, source maps
# These are large, auto-generated, and never contain real violations
SKIP_FILENAMES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "composer.lock",
    "Gemfile.lock", "poetry.lock", "Pipfile.lock", "go.sum",
}

# File suffixes to skip
SKIP_SUFFIXES = {".min.js", ".min.css", ".map", ".snap", ".lock", ".sum"}

# High-risk files — scanned FIRST regardless of position in tree
HIGH_PRIORITY_PATTERNS = {
    ".env", "config", "secret", "credential", "auth", "key",
    "password", "token", "database", "db", "routes", "middleware",
    "terraform", "cloudformation", "iam", "security",
}

SCANNABLE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".java", ".rb", ".php",
    ".yaml", ".yml", ".json", ".tf", ".hcl", ".sh", ".bash", ".cs",
    ".env", ".env.example", ".config", ".kt", ".rs", ".swift", ".cpp", ".c",
}


# ── GitHub API Helpers ────────────────────────────────────────────────────────

def _github_request(url: str, token: Optional[str] = None) -> dict:
    """Make a GitHub API GET request."""
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    effective_token = token or _DEFAULT_TOKEN
    if effective_token:
        req.add_header("Authorization", f"Bearer {effective_token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise Exception(
                "GitHub API rate limit reached (60 req/hour for unauthenticated). "
                "Add a GitHub token to get 5000 req/hour. "
                "Create one at: github.com/settings/tokens (no scopes needed for public repos)"
            )
        if e.code == 404:
            raise Exception(f"Repository not found: {url}. Check the URL is correct and the repo is public.")
        raise Exception(f"GitHub API error {e.code}: {url}")


def parse_repo_url(url: str) -> tuple[str, str]:
    """Extract owner/repo from a GitHub URL."""
    url = url.rstrip("/").replace("https://github.com/", "").replace("http://github.com/", "")
    parts = url.split("/")
    if len(parts) < 2:
        raise ValueError(f"Invalid GitHub URL: {url}")
    return parts[0], parts[1]


def fetch_file_tree(owner: str, repo: str, token: Optional[str] = None) -> list:
    """Fetch flat list of all files in the repo (recursive tree)."""
    # Get default branch
    repo_info = _github_request(f"https://api.github.com/repos/{owner}/{repo}", token)
    branch = repo_info.get("default_branch", "main")

    # Get tree
    tree_data = _github_request(
        f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
        token,
    )
    return [item for item in tree_data.get("tree", []) if item["type"] == "blob"]


def fetch_file_content(owner: str, repo: str, path: str, token: Optional[str] = None) -> str:
    """Fetch decoded content of a single file."""
    data = _github_request(f"https://api.github.com/repos/{owner}/{repo}/contents/{path}", token)
    if data.get("encoding") == "base64":
        return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    return data.get("content", "")


# ── Scanners ──────────────────────────────────────────────────────────────────

# Directories/files that indicate test code — lower severity, higher FP rate
_TEST_INDICATORS = {"test", "tests", "spec", "specs", "__tests__", "__mocks__", "fixtures", "mock", "stub", "fake", "sample", "example", "demo"}

# Files that commonly contain env examples — not real credentials
_ENV_EXAMPLE_FILES = {".env.example", ".env.sample", ".env.template", "env.example", "config.example.js", "config.sample.js"}


def _is_test_file(path: str) -> bool:
    """Check if a file is in a test directory or is a test file."""
    parts = path.lower().split("/")
    filename = parts[-1]
    if any(t in p for p in parts[:-1] for t in _TEST_INDICATORS):
        return True
    if filename.endswith((".test.js", ".test.ts", ".spec.js", ".spec.ts", "_test.py", "_test.go")):
        return True
    return False


def _is_false_positive(pattern_id: str, line: str, content: str, path: str) -> bool:
    """Context-aware false positive detection — reduces noise significantly."""
    lower_line = line.lower().strip()
    lower_content = content.lower()
    filename = path.split("/")[-1].lower()

    # Skip env example files for credential patterns
    if pattern_id in ("CRED-001", "CRED-002") and filename in _ENV_EXAMPLE_FILES:
        return True

    # CRED-002: Skip if the "password" is clearly a variable/config key name, not a value
    if pattern_id == "CRED-002":
        # Skip: password = os.environ.get(...) or process.env.PASSWORD
        if "environ" in lower_line or "process.env" in lower_line or "getenv" in lower_line:
            return True
        # Skip: password = config.get(...) or settings.PASSWORD
        if "config." in lower_line or "settings." in lower_line:
            return True
        # Skip placeholder values like "your_password_here", "changeme", "xxx"
        placeholders = ["your_", "changeme", "xxx", "todo", "fixme", "placeholder", "replace_me", "insert_"]
        if any(p in lower_line for p in placeholders):
            return True

    # HEADER-001: Only flag if helmet/security headers are NOT found anywhere in the file
    if pattern_id == "HEADER-001":
        if "helmet" in lower_content or "x-frame-options" in lower_content or "content-security-policy" in lower_content:
            return True  # Already has security headers

    # CSRF-001: Only flag if no CSRF middleware is found in the file
    if pattern_id == "CSRF-001":
        if "csurf" in lower_content or "csrf" in lower_content or "csrftoken" in lower_content:
            return True  # Already has CSRF protection
        # Skip API-only routes (they use token auth, not cookies)
        if "/api/" in lower_line:
            return True

    # COOKIE-001: Skip if secure flags are already present in the file
    if pattern_id == "COOKIE-001":
        if "secure: true" in lower_content or "httponly: true" in lower_content or "samesite" in lower_content:
            return True  # Already configured securely

    # RATELIMIT-001: Skip if rate limiting middleware exists in the file
    if pattern_id == "RATELIMIT-001":
        if "rate-limit" in lower_content or "ratelimit" in lower_content or "express-rate-limit" in lower_content or "throttle" in lower_content:
            return True

    # CORS-001: Skip if specific origins are also defined (not just wildcard)
    if pattern_id == "CORS-001":
        if "allowedorigins" in lower_content or "whitelist" in lower_content:
            return True

    # DEBUG-001: Skip if it's in a config file that checks NODE_ENV
    if pattern_id == "DEBUG-001":
        if "node_env" in lower_content or "production" in lower_content:
            return True

    # RAND-001: Skip if secrets module is also imported (they're using both)
    if pattern_id == "RAND-001":
        if "import secrets" in lower_content or "from secrets" in lower_content or "crypto.random" in lower_content:
            return True

    return False


def scan_file(path: str, content: str) -> list:
    """Run all compliance patterns against a file with context-aware false positive reduction."""
    findings = []
    lines = content.splitlines()
    is_test = _is_test_file(path)

    for pattern_def in COMPLIANCE_PATTERNS:
        try:
            regex = re.compile(pattern_def["pattern"], re.MULTILINE)
            for i, line in enumerate(lines, 1):
                if regex.search(line):
                    # Skip comments
                    stripped = line.strip()
                    if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("*"):
                        continue

                    # Skip context-aware false positives
                    if _is_false_positive(pattern_def["id"], line, content, path):
                        continue

                    # Downgrade test file findings to LOW
                    severity = pattern_def["severity"]
                    if is_test and severity in ("CRITICAL", "HIGH"):
                        severity = "LOW"

                    findings.append({
                        "pattern_id": pattern_def["id"],
                        "name": pattern_def["name"],
                        "file": path,
                        "line": i,
                        "line_content": stripped[:120],
                        "controls": pattern_def["controls"],
                        "frameworks": pattern_def["frameworks"],
                        "severity": severity,
                        "message": pattern_def["message"],
                        "fix": pattern_def["fix"],
                        "in_test_file": is_test,
                    })
                    break  # One finding per pattern per file
        except re.error:
            pass

    return findings


def check_policy_docs(owner: str, repo: str, token: Optional[str], existing_paths: set) -> dict:
    """Check which security/policy documents exist in the repo."""
    present = []
    missing = []

    for doc in POLICY_DOCS:
        if doc["path"].lower() in existing_paths:
            present.append(doc)
        else:
            missing.append(doc)

    return {
        "present": present,
        "missing": missing,
        "score": round(len(present) / len(POLICY_DOCS) * 100),
    }


def detect_aws_trails_in_code(findings: list, all_files: list) -> dict:
    """
    How we identify AWS CloudTrail config from GitHub:
    1. Terraform files with aws_cloudtrail resource → check if logging is enabled
    2. GitHub Actions workflows → check if CloudTrail is referenced
    3. CloudFormation/CDK templates → look for CloudTrail stacks
    4. Python/JS code → look for cloudtrail.create_trail or similar SDK calls
    """
    trail_info = {
        "terraform_defined": False,
        "terraform_enabled": False,
        "github_actions_configured": False,
        "cloudformation_defined": False,
        "sdk_usage": False,
        "files_with_trail_config": [],
    }

    for f in all_files:
        path = f["path"].lower()
        if ".tf" in path or "terraform" in path:
            trail_info["terraform_defined"] = True

        if ".github/workflows" in path:
            trail_info["github_actions_configured"] = True

        if "cloudformation" in path or "cfn" in path or path.endswith(".template"):
            trail_info["cloudformation_defined"] = True

    # Check findings for CT-001 (CloudTrail disabled)
    ct_findings = [f for f in findings if f.get("pattern_id") == "CT-001"]
    trail_info["terraform_enabled"] = len(ct_findings) == 0 and trail_info["terraform_defined"]
    trail_info["files_with_trail_config"] = list({f["file"] for f in ct_findings})

    return trail_info


# ── Semgrep Rule → SOC 2 Control Mapping ─────────────────────────────────────
# Maps OWASP Top 10 IDs (present in semgrep rule IDs) to SOC 2 controls + frameworks

SEMGREP_RULE_MAP = {
    # Injection (A03) — SQL, NoSQL, command, XSS
    "injection": {"controls": ["CC6.8", "CC5.2"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "CRITICAL"},
    "sql": {"controls": ["CC6.8", "CC5.2"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "CRITICAL"},
    "nosql": {"controls": ["CC6.8", "CC5.2"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "CRITICAL"},
    "xss": {"controls": ["CC6.8", "CC5.2"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "HIGH"},
    "eval": {"controls": ["CC6.8", "CC5.2"], "frameworks": ["soc2", "iso27001"], "severity": "CRITICAL"},
    "exec": {"controls": ["CC6.8", "CC5.2"], "frameworks": ["soc2", "iso27001"], "severity": "CRITICAL"},
    "command": {"controls": ["CC6.8", "CC5.2"], "frameworks": ["soc2", "iso27001"], "severity": "CRITICAL"},
    "ssrf": {"controls": ["CC6.6", "CC6.8"], "frameworks": ["soc2", "iso27001"], "severity": "HIGH"},
    # Cryptographic Failures (A02)
    "crypto": {"controls": ["CC6.7", "CC9.2"], "frameworks": ["soc2", "iso27001", "hipaa"], "severity": "HIGH"},
    "tls": {"controls": ["CC6.7"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "HIGH"},
    "hash": {"controls": ["CC6.2", "CC9.2"], "frameworks": ["soc2", "iso27001", "hipaa"], "severity": "HIGH"},
    "weak": {"controls": ["CC6.7", "CC9.2"], "frameworks": ["soc2", "iso27001"], "severity": "HIGH"},
    # Secrets / Credentials (A02)
    "secret": {"controls": ["CC6.1", "CC9.2"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "CRITICAL"},
    "hardcoded": {"controls": ["CC6.1", "CC6.2"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "CRITICAL"},
    "password": {"controls": ["CC6.1", "CC6.2"], "frameworks": ["soc2", "iso27001", "hipaa", "dpdp"], "severity": "CRITICAL"},
    "token": {"controls": ["CC6.1"], "frameworks": ["soc2", "iso27001"], "severity": "HIGH"},
    # Broken Access Control (A01)
    "auth": {"controls": ["CC6.1", "CC6.3"], "frameworks": ["soc2", "iso27001", "hipaa"], "severity": "HIGH"},
    "idor": {"controls": ["CC6.3"], "frameworks": ["soc2", "iso27001"], "severity": "HIGH"},
    "jwt": {"controls": ["CC6.1", "CC6.2"], "frameworks": ["soc2", "iso27001"], "severity": "HIGH"},
    # Security Misconfiguration (A05)
    "cors": {"controls": ["CC6.6"], "frameworks": ["soc2", "iso27001"], "severity": "MEDIUM"},
    "debug": {"controls": ["CC6.8", "CC5.1"], "frameworks": ["soc2", "iso27001"], "severity": "HIGH"},
    "error": {"controls": ["CC7.2", "CC7.3"], "frameworks": ["soc2", "iso27001"], "severity": "MEDIUM"},
    # Logging (A09)
    "log": {"controls": ["CC7.2", "C1.1"], "frameworks": ["soc2", "iso27001", "hipaa"], "severity": "MEDIUM"},
    # Default fallback
    "default": {"controls": ["CC6.8"], "frameworks": ["soc2", "iso27001"], "severity": "MEDIUM"},
}


def _semgrep_available() -> bool:
    """Check if semgrep is installed on this system."""
    return shutil.which("semgrep") is not None


def _map_semgrep_rule(rule_id: str) -> dict:
    """Map a semgrep rule ID to SOC 2 controls and severity."""
    rule_lower = rule_id.lower()
    for keyword, mapping in SEMGREP_RULE_MAP.items():
        if keyword in rule_lower:
            return mapping
    return SEMGREP_RULE_MAP["default"]


def scan_with_semgrep(file_contents: dict) -> list:
    """
    Run semgrep on fetched file contents.
    file_contents: {path: content_str}
    Returns list of findings in our standard format.
    """
    if not _semgrep_available():
        return []

    findings = []
    tmpdir = tempfile.mkdtemp(prefix="complianceai_")

    try:
        # Write files to temp directory
        for path, content in file_contents.items():
            full_path = Path(tmpdir) / path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            try:
                full_path.write_text(content, encoding="utf-8", errors="replace")
            except Exception:
                pass

        # Run semgrep with OWASP Top 10 + secrets rulesets
        result = subprocess.run(
            [
                "semgrep",
                "--config", "p/owasp-top-ten",
                "--config", "p/secrets",
                "--json",
                "--quiet",
                "--no-git-ignore",
                "--timeout", "30",
                tmpdir,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.stdout:
            data = json.loads(result.stdout)
            for r in data.get("results", []):
                rule_id = r.get("check_id", "semgrep.unknown")
                mapping = _map_semgrep_rule(rule_id)
                # Get relative path (strip tmpdir prefix)
                abs_path = r.get("path", "")
                rel_path = abs_path.replace(tmpdir + "/", "").replace(tmpdir + "\\", "")

                findings.append({
                    "pattern_id": f"SEMGREP-{rule_id.split('.')[-1].upper()[:12]}",
                    "name": r.get("extra", {}).get("message", rule_id.split(".")[-1].replace("-", " ").title()),
                    "file": rel_path,
                    "line": r.get("start", {}).get("line", 0),
                    "line_content": r.get("extra", {}).get("lines", "").strip()[:120],
                    "controls": mapping["controls"],
                    "frameworks": mapping["frameworks"],
                    "severity": mapping["severity"],
                    "message": r.get("extra", {}).get("message", "Semgrep compliance violation detected."),
                    "fix": r.get("extra", {}).get("fix", "See semgrep rule: " + rule_id),
                    "source": "semgrep",
                    "semgrep_rule": rule_id,
                })

    except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
        pass
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    return findings


# ── OSV Dependency CVE Scanner ────────────────────────────────────────────────

OSV_SEVERITY_MAP = {"CRITICAL": "CRITICAL", "HIGH": "HIGH", "MODERATE": "MEDIUM", "LOW": "LOW"}


def _osv_query(package_name: str, version: str, ecosystem: str) -> list:
    """Query OSV.dev API for known vulnerabilities in a package version. No API key needed."""
    payload = json.dumps({
        "version": version,
        "package": {"name": package_name, "ecosystem": ecosystem},
    }).encode()
    req = urllib.request.Request(
        "https://api.osv.dev/v1/query",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            return data.get("vulns", [])
    except Exception:
        return []


def _parse_package_json(content: str) -> dict:
    """Extract package name→version from package.json dependencies."""
    try:
        data = json.loads(content)
        deps = {}
        deps.update(data.get("dependencies", {}))
        deps.update(data.get("devDependencies", {}))
        # Clean version strings (^1.2.3 → 1.2.3)
        return {
            name: ver.lstrip("^~>=").split(" ")[0]
            for name, ver in deps.items()
            if isinstance(ver, str) and ver[0].isdigit() or (len(ver) > 1 and ver[1].isdigit())
        }
    except Exception:
        return {}


def _parse_requirements_txt(content: str) -> dict:
    """Extract package name→version from requirements.txt."""
    deps = {}
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Handle: package==1.2.3, package>=1.2.3, package~=1.2.3
        for sep in ["==", ">=", "<=", "~=", "!="]:
            if sep in line:
                parts = line.split(sep)
                name = parts[0].strip()
                ver = parts[1].strip().split(",")[0].strip()
                deps[name] = ver
                break
    return deps


def scan_dependencies_osv(owner: str, repo: str, token: Optional[str], all_files: list) -> list:
    """
    Check package.json and requirements.txt for known CVEs using OSV.dev (free, no key needed).
    Returns findings in our standard format.
    """
    findings = []
    dep_files = {
        "package.json": ("npm", _parse_package_json),
        "requirements.txt": ("PyPI", _parse_requirements_txt),
    }

    for file_info in all_files:
        path = file_info["path"]
        filename = path.split("/")[-1]
        if filename not in dep_files:
            continue

        ecosystem, parser = dep_files[filename]
        try:
            content = fetch_file_content(owner, repo, path, token)
            packages = parser(content)
        except Exception:
            continue

        # Query OSV for up to 30 packages in parallel
        pkg_list = list(packages.items())[:30]

        def _query_pkg(item):
            name, ver = item
            return name, ver, _osv_query(name, ver, ecosystem)

        with ThreadPoolExecutor(max_workers=10) as ex:
            osv_results = list(ex.map(_query_pkg, pkg_list))

        for pkg_name, version, vulns in osv_results:
            if not vulns:
                continue

            # Pick the highest severity vuln for this package
            worst_severity = "LOW"
            vuln_ids = []
            for v in vulns:
                vuln_ids.append(v.get("id", ""))
                for sev in v.get("database_specific", {}).get("severity", []):
                    pass
                # Check severity from affected ranges
                for affected in v.get("affected", []):
                    for db_sev in affected.get("database_specific", {}).get("severity", []):
                        mapped = OSV_SEVERITY_MAP.get(db_sev.upper(), "MEDIUM")
                        if ["LOW", "MEDIUM", "HIGH", "CRITICAL"].index(mapped) > \
                           ["LOW", "MEDIUM", "HIGH", "CRITICAL"].index(worst_severity):
                            worst_severity = mapped
                # Fallback: check CVSS score
                if worst_severity == "LOW":
                    for sev in v.get("severity", []):
                        score = sev.get("score", "")
                        if "CRITICAL" in score.upper():
                            worst_severity = "CRITICAL"
                        elif "HIGH" in score.upper():
                            worst_severity = "HIGH"

            vuln_summary = ", ".join(vuln_ids[:3])
            if len(vuln_ids) > 3:
                vuln_summary += f" (+{len(vuln_ids)-3} more)"

            findings.append({
                "pattern_id": "CVE-DEP",
                "name": f"Vulnerable Dependency: {pkg_name}@{version}",
                "file": path,
                "line": 0,
                "line_content": f'"{pkg_name}": "{version}"',
                "controls": ["CC6.8", "A1.1"],
                "frameworks": ["soc2", "iso27001", "hipaa"],
                "severity": worst_severity,
                "message": f"{pkg_name}@{version} has {len(vulns)} known CVE(s): {vuln_summary}",
                "fix": f"Upgrade {pkg_name} to the latest patched version. Run `npm audit fix` or `pip install --upgrade {pkg_name}`.",
                "source": "osv",
                "vuln_count": len(vulns),
                "vuln_ids": vuln_ids[:5],
            })

    return findings


# ── Main Entry Point ──────────────────────────────────────────────────────────

def scan_repository(repo_url: str, token: Optional[str] = None, max_files: int = 500) -> dict:
    """
    Full scan of a GitHub repository.
    Returns findings in a format compatible with the rest of the pipeline.
    """
    owner, repo = parse_repo_url(repo_url)

    # Get all files
    all_files = fetch_file_tree(owner, repo, token)
    total_files = len(all_files)

    # Filter to scannable files — skip noise dirs, lock files, minified files
    high_priority = []
    normal = []

    for f in all_files:
        path = f["path"]
        filename = path.split("/")[-1].lower()
        parts = path.split("/")

        # Skip noise directories
        if any(part in SKIP_DIRS for part in parts[:-1]):
            continue

        # Skip specific junk filenames and suffixes
        if filename in SKIP_FILENAMES:
            continue
        if any(filename.endswith(sfx) for sfx in SKIP_SUFFIXES):
            continue

        # Skip very large files (>500KB) — likely generated/binary
        if f.get("size", 0) > 500_000:
            continue

        ext = "." + path.rsplit(".", 1)[-1] if "." in path else ""
        if ext not in SCANNABLE_EXTENSIONS and not path.endswith(".env"):
            continue

        # Prioritize high-risk files (routes, config, auth, .env, terraform)
        path_lower = path.lower()
        if any(p in path_lower for p in HIGH_PRIORITY_PATTERNS):
            high_priority.append(f)
        else:
            normal.append(f)

    # Scan high-priority files first, then normal — up to max_files total
    scannable = high_priority + normal
    scannable = scannable[:max_files]

    existing_paths = {f["path"].lower() for f in all_files}

    # Fetch and scan files in parallel (10 concurrent threads)
    all_findings = []
    files_scanned = 0
    errors = []
    file_contents = {}  # Keep for semgrep

    def _fetch_and_scan(file_info):
        path = file_info["path"]
        content = fetch_file_content(owner, repo, path, token)
        return path, content, scan_file(path, content)

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(_fetch_and_scan, f): f for f in scannable}
        for future in as_completed(futures):
            try:
                path, content, findings = future.result()
                file_contents[path] = content
                all_findings.extend(findings)
                files_scanned += 1
            except Exception as e:
                errors.append(str(e))

    # Semgrep scan (if installed) — runs on all fetched file contents
    semgrep_findings = scan_with_semgrep(file_contents)
    all_findings.extend(semgrep_findings)

    # OSV dependency CVE scan — checks package.json and requirements.txt
    try:
        dep_findings = scan_dependencies_osv(owner, repo, token, all_files)
        all_findings.extend(dep_findings)
    except Exception as e:
        errors.append(f"OSV scan error: {e}")

    # Policy agent check
    policy_status = check_policy_docs(owner, repo, token, existing_paths)

    # Add missing policy docs as findings
    for doc in policy_status["missing"]:
        all_findings.append({
            "pattern_id": "POLICY-MISSING",
            "name": f"Missing: {doc['name']}",
            "file": doc["path"],
            "line": 0,
            "line_content": "File does not exist",
            "controls": [doc["control"]],
            "frameworks": ["soc2", "iso27001"],
            "severity": "MEDIUM",
            "message": f"{doc['name']} not found in repository.",
            "fix": f"Create {doc['path']} with your security/privacy policy content.",
        })

    # AWS CloudTrail detection from code
    trail_info = detect_aws_trails_in_code(all_findings, all_files)

    # Severity counts
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in all_findings:
        sev = f.get("severity", "MEDIUM")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    # Unique controls affected
    affected_controls = list({c for f in all_findings for c in f.get("controls", [])})

    # Frameworks affected
    affected_frameworks = list({fw for f in all_findings for fw in f.get("frameworks", [])})

    return {
        "repo": f"{owner}/{repo}",
        "repo_url": repo_url,
        "total_files": total_files,
        "files_scanned": files_scanned,
        "total_findings": len(all_findings),
        "findings": all_findings,
        "severity_counts": severity_counts,
        "affected_controls": affected_controls,
        "affected_frameworks": affected_frameworks,
        "policy_status": policy_status,
        "trail_info": trail_info,
        "errors": errors[:5],
        "scanners_used": {
            "regex": True,
            "semgrep": _semgrep_available(),
            "osv_cve": len([f for f in all_findings if f.get("source") == "osv"]) > 0,
            "semgrep_findings": len(semgrep_findings),
            "dep_findings": len([f for f in all_findings if f.get("source") == "osv"]),
        },
    }
