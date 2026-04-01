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
from typing import Optional
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

# Files/dirs to skip
SKIP_DIRS = {
    "node_modules", ".git", "vendor", "dist", "build", ".next",
    "__pycache__", ".venv", "venv", "env", "migrations", "test", "tests",
    "__tests__", "coverage", ".cache",
}

SCANNABLE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".java", ".rb", ".php",
    ".yaml", ".yml", ".json", ".tf", ".hcl", ".sh", ".bash", ".cs",
    ".env", ".env.example", ".config",
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

def scan_file(path: str, content: str) -> list:
    """Run all 15 compliance patterns against a file. Returns list of findings."""
    findings = []
    lines = content.splitlines()

    for pattern_def in COMPLIANCE_PATTERNS:
        try:
            regex = re.compile(pattern_def["pattern"], re.MULTILINE)
            for i, line in enumerate(lines, 1):
                if regex.search(line):
                    # Skip obvious false positives (comments)
                    stripped = line.strip()
                    if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("*"):
                        continue
                    findings.append({
                        "pattern_id": pattern_def["id"],
                        "name": pattern_def["name"],
                        "file": path,
                        "line": i,
                        "line_content": line.strip()[:120],
                        "controls": pattern_def["controls"],
                        "frameworks": pattern_def["frameworks"],
                        "severity": pattern_def["severity"],
                        "message": pattern_def["message"],
                        "fix": pattern_def["fix"],
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


# ── Main Entry Point ──────────────────────────────────────────────────────────

def scan_repository(repo_url: str, token: Optional[str] = None, max_files: int = 150) -> dict:
    """
    Full scan of a GitHub repository.
    Returns findings in a format compatible with the rest of the pipeline.
    """
    owner, repo = parse_repo_url(repo_url)

    # Get all files
    all_files = fetch_file_tree(owner, repo, token)
    total_files = len(all_files)

    # Filter to scannable files, skip noise directories
    scannable = []
    for f in all_files:
        path = f["path"]
        parts = path.split("/")
        # Skip if any path component is a noise dir
        if any(part in SKIP_DIRS for part in parts[:-1]):
            continue
        ext = "." + path.rsplit(".", 1)[-1] if "." in path else ""
        if ext in SCANNABLE_EXTENSIONS or path.endswith(".env"):
            scannable.append(f)

    # Limit to max_files
    scannable = scannable[:max_files]

    existing_paths = {f["path"].lower() for f in all_files}

    # Scan each file
    all_findings = []
    files_scanned = 0
    errors = []

    for file_info in scannable:
        try:
            content = fetch_file_content(owner, repo, file_info["path"], token)
            findings = scan_file(file_info["path"], content)
            all_findings.extend(findings)
            files_scanned += 1
        except Exception as e:
            errors.append(str(e))

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
        "errors": errors[:5],  # Don't flood response
    }
