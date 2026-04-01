"""
Auto-Fix PR Generator — AI-powered compliance fix engine.

Flow:
  1. Fetch the vulnerable file from GitHub
  2. Send file + finding to Groq → generates fixed code
  3. Create branch → commit fix → open PR on GitHub

Requires a GitHub token with `repo` scope (write access).
"""

import json
import base64
import time
import urllib.request
import urllib.error
from typing import Optional

import github_agent
import groq_service
from ai_provider import ai as ai_service


# ═══════════════════════════════════════════════════════════════════════════════
# GitHub Write API Helper
# ═══════════════════════════════════════════════════════════════════════════════

def _github_api(method: str, url: str, token: str, body: dict = None) -> dict:
    """Make a GitHub API request (GET/POST/PUT/PATCH)."""
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("Authorization", f"Bearer {token}")
    if body:
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode()
        except Exception:
            pass

        if e.code == 401:
            raise Exception("GitHub token is invalid or expired. Check your token.")
        if e.code == 403:
            raise Exception(
                "Token lacks required permissions. "
                "Create a token with `repo` scope at github.com/settings/tokens"
            )
        if e.code == 404:
            raise Exception(f"Not found: {url}")
        if e.code == 422:
            raise Exception(f"GitHub validation error: {error_body}")
        raise Exception(f"GitHub API error {e.code}: {error_body}")


# ═══════════════════════════════════════════════════════════════════════════════
# AI Code Fix Generation (uses ai_provider switcher)
# ═══════════════════════════════════════════════════════════════════════════════

MAX_FILE_CHARS = 32000  # ~8K tokens — beyond this, use windowed context


def _window_around_line(content: str, line_num: int, window: int = 50) -> tuple:
    """Extract a window of lines around the vulnerable line for large files."""
    lines = content.splitlines()
    start = max(0, line_num - window)
    end = min(len(lines), line_num + window)
    windowed = "\n".join(lines[start:end])
    return windowed, start, end, lines


def generate_code_fix(file_content: str, finding: dict, file_path: str) -> str:
    """Use AI to generate a fixed version of the file. Handles large files with windowed context."""
    line_num = finding.get("line", 0)
    line_content = finding.get("line_content", "")
    vuln_name = finding.get("name", "Security vulnerability")
    message = finding.get("message", "")
    fix_hint = finding.get("fix", "")
    pattern_id = finding.get("pattern_id", "")

    # Handle large files — send only a window around the vulnerable line
    use_window = len(file_content) > MAX_FILE_CHARS
    if use_window:
        windowed, win_start, win_end, all_lines = _window_around_line(file_content, line_num)
        code_block = windowed
        rule_7 = f"7. Return ONLY the fixed window (lines {win_start+1}-{win_end}). I will splice it back."
    else:
        code_block = file_content
        rule_7 = "7. Return the COMPLETE file content with the fix applied"

    prompt = f"""You are a senior security engineer. Fix the EXACT security vulnerability described below.

FILE: {file_path}
VULNERABILITY: {vuln_name} ({pattern_id})
LINE {line_num}: {line_content}
ISSUE: {message}
FIX GUIDANCE: {fix_hint}

{"WINDOW OF" if use_window else "ORIGINAL"} FILE CONTENT:
```
{code_block}
```

RULES:
1. Fix ONLY the vulnerability at/near line {line_num}. Do NOT change anything else.
2. For hardcoded credentials: replace with environment variable reads (os.environ.get for Python, process.env for JS/TS)
3. For SQL injection: convert to parameterized queries
4. For eval(): replace with safe alternatives (JSON.parse, ast.literal_eval)
5. For missing security headers: add the appropriate middleware/headers
6. Keep all existing functionality intact — only fix the security issue
{rule_7}

Return ONLY the fixed file content. No explanations. No markdown fences. No backticks."""

    try:
        fixed = ai_service.call_llm(
            prompt=prompt,
            system="You are a security engineer that fixes code vulnerabilities. Return ONLY the fixed file content. No markdown, no explanations, no backticks.",
            temperature=0.1,
            max_tokens=4096,
        )

        # Strip accidental markdown fences
        if fixed.startswith("```"):
            lines = fixed.split("\n")
            # Remove first line (```python or ```) and last line (```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            fixed = "\n".join(lines)

        if not fixed or len(fixed.strip()) < 10:
            raise Exception("AI returned empty or too-short fix")

        # Splice windowed fix back into full file
        if use_window:
            fixed_lines = fixed.splitlines()
            full = all_lines[:win_start] + fixed_lines + all_lines[win_end:]
            fixed = "\n".join(full)

        return fixed

    except Exception as e:
        raise Exception(f"Code fix generation failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# PR Creation Workflow
# ═══════════════════════════════════════════════════════════════════════════════

def create_fix_pr(
    owner: str,
    repo: str,
    file_path: str,
    fixed_content: str,
    finding: dict,
    token: str,
) -> dict:
    """Create a branch, commit the fix, and open a PR."""
    base_url = f"https://api.github.com/repos/{owner}/{repo}"
    pattern_id = finding.get("pattern_id", "FIX")
    timestamp = int(time.time())
    branch_name = f"fix/{pattern_id.lower()}-{timestamp}"

    # 1. Get default branch
    repo_info = _github_api("GET", base_url, token)
    default_branch = repo_info.get("default_branch", "main")

    # 2. Get base SHA from default branch
    ref_data = _github_api(
        "GET",
        f"{base_url}/git/ref/heads/{default_branch}",
        token,
    )
    base_sha = ref_data["object"]["sha"]

    # 3. Create new branch
    _github_api(
        "POST",
        f"{base_url}/git/refs",
        token,
        body={"ref": f"refs/heads/{branch_name}", "sha": base_sha},
    )

    # 4. Get current file blob SHA on the new branch
    file_data = _github_api(
        "GET",
        f"{base_url}/contents/{file_path}?ref={branch_name}",
        token,
    )
    file_sha = file_data["sha"]

    # 5. Commit the fixed file
    encoded_content = base64.b64encode(fixed_content.encode()).decode()
    severity = finding.get("severity", "MEDIUM")
    vuln_name = finding.get("name", "security vulnerability")

    commit_message = (
        f"fix({pattern_id}): {vuln_name}\n\n"
        f"Severity: {severity}\n"
        f"File: {file_path}:{finding.get('line', 0)}\n"
        f"Issue: {finding.get('message', '')}\n\n"
        f"Auto-generated by ComplianceAI"
    )

    _github_api(
        "PUT",
        f"{base_url}/contents/{file_path}",
        token,
        body={
            "message": commit_message,
            "content": encoded_content,
            "sha": file_sha,
            "branch": branch_name,
        },
    )

    # 6. Open PR
    controls = ", ".join(finding.get("controls", []))
    frameworks = ", ".join(finding.get("frameworks", []))

    pr_body = (
        f"## ComplianceAI Auto-Fix\n\n"
        f"**Vulnerability:** {vuln_name}\n"
        f"**Severity:** {severity}\n"
        f"**Pattern:** `{pattern_id}`\n"
        f"**File:** `{file_path}` (line {finding.get('line', 0)})\n"
        f"**Controls:** {controls}\n"
        f"**Frameworks:** {frameworks}\n\n"
        f"### Issue\n{finding.get('message', '')}\n\n"
        f"### Fix Applied\n{finding.get('fix', '')}\n\n"
        f"---\n"
        f"*This fix was AI-generated by ComplianceAI. Please review carefully before merging.*"
    )

    pr_data = _github_api(
        "POST",
        f"{base_url}/pulls",
        token,
        body={
            "title": f"fix({pattern_id}): {vuln_name}",
            "head": branch_name,
            "base": default_branch,
            "body": pr_body,
        },
    )

    return {
        "pr_url": pr_data.get("html_url", ""),
        "pr_number": pr_data.get("number", 0),
        "branch": branch_name,
        "files_changed": 1,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════════════════════════════════

def auto_fix(repo_url: str, token: str, file_path: str, finding: dict) -> dict:
    """
    Full auto-fix pipeline:
      1. Fetch original file
      2. Generate fix with Groq
      3. Create branch + commit + PR
    """
    if not token:
        raise Exception(
            "GitHub token required for auto-fix. "
            "Create one at github.com/settings/tokens with `repo` scope."
        )

    owner, repo = github_agent.parse_repo_url(repo_url)

    # 1. Fetch original file
    print(f"[AutoFix] Fetching {file_path} from {owner}/{repo}...")
    original_content = github_agent.fetch_file_content(owner, repo, file_path, token)

    # 2. Generate fix
    print(f"[AutoFix] Generating fix for {finding.get('pattern_id', '?')}...")
    fixed_content = generate_code_fix(original_content, finding, file_path)

    # 3. Create PR
    print(f"[AutoFix] Creating PR on {owner}/{repo}...")
    pr_result = create_fix_pr(owner, repo, file_path, fixed_content, finding, token)

    print(f"[AutoFix] PR created: {pr_result['pr_url']}")
    return pr_result
