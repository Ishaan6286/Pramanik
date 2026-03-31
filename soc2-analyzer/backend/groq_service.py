import os
import json
from groq import Groq

MODEL = "llama-3.3-70b-versatile"
_client = None


def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def generate_explanations(failed_controls: list, company_name: str) -> list:
    failed_summary = "\n".join(
        f"Control {c['id']} ({c['title']}): {'; '.join(c['issues'])}"
        for c in failed_controls
    )

    prompt = f"""You are a SOC 2 compliance expert helping an Indian startup called "{company_name}".

They have the following security issues in their AWS setup:
{failed_summary}

For each failed control, provide:
1. A simple explanation of why this is a security risk (2-3 sentences, plain English)
2. Exact step-by-step fix in AWS console (3-4 steps)
3. Business impact if not fixed (1 sentence)

Format your response as a JSON array like this:
[
  {{
    "control_id": "CC6.1",
    "risk_explanation": "explanation here",
    "fix_steps": ["Step 1", "Step 2", "Step 3"],
    "business_impact": "impact here"
  }}
]

Return ONLY the JSON array, no other text."""

    response = _get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )
    text = response.choices[0].message.content
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


def generate_audit_questions(failed_controls: list, company_name: str) -> dict:
    failed_summary = "\n".join(
        f"Control {c['id']} ({c['title']}): {'; '.join(c['issues'])}"
        for c in failed_controls
    )

    prompt = f"""You are a SOC 2 auditor preparing to audit "{company_name}", an Indian SaaS startup.

Based on their failed controls:
{failed_summary}

Generate realistic audit questions that an auditor would ask during a SOC 2 Type II audit.

For each failed control area, provide:
1. The exact question the auditor will ask
2. What the auditor is really looking for (the intent behind the question)
3. A sample "good answer" that would satisfy the auditor
4. A red flag answer that would raise concerns
5. Evidence the auditor will request

Group questions by category. Generate 12-15 questions total covering the most critical gaps.

Format as JSON:
{{
  "categories": [
    {{
      "category": "Access Management",
      "icon": "lock",
      "questions": [
        {{
          "question": "How do you manage user access to production systems?",
          "intent": "Auditor wants to verify least privilege access",
          "good_answer": "We use IAM roles with...",
          "red_flag": "Everyone has admin access...",
          "evidence_needed": ["IAM policy documents", "Access review logs"]
        }}
      ]
    }}
  ]
}}

Return ONLY the JSON, no other text."""

    response = _get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=3000,
    )
    text = response.choices[0].message.content
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


def generate_policies(company_name: str) -> dict:
    prompt = f"""You are a compliance expert. Write 3 professional SOC 2 policy documents for "{company_name}", an Indian SaaS startup using AWS.

Write these exact 3 policies:
1. Access Control Policy
2. Data Encryption Policy
3. Incident Response Policy

Each policy should:
- Be 300-400 words
- Sound professional and audit-ready
- Reference AWS services specifically
- Include the company name "{company_name}"
- Include sections: Purpose, Scope, Policy Statement, Responsibilities, Review Period

Format as JSON:
{{
  "policies": [
    {{
      "title": "Access Control Policy",
      "content": "full policy text here"
    }},
    {{
      "title": "Data Encryption Policy",
      "content": "full policy text here"
    }},
    {{
      "title": "Incident Response Policy",
      "content": "full policy text here"
    }}
  ]
}}

Return ONLY the JSON, no other text."""

    response = _get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=3000,
    )
    text = response.choices[0].message.content
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)
