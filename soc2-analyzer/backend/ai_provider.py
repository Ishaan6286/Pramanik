"""
AI Provider Switcher — route between Groq and AWS Bedrock via env var.

Set AI_PROVIDER=groq (default) or AI_PROVIDER=bedrock in your .env / Render dashboard.
Swap providers in 30 seconds without changing any code.

Usage:
    from ai_provider import ai
    ai.generate_explanations(failed_controls, company_name)
    ai.generate_policies(company_name)
    ai.generate_audit_questions(failed_controls, company_name)
    ai.call_llm(prompt, max_tokens=2000, temperature=0.3)  # raw LLM call
"""

import os
import json
import time

AI_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()
MAX_RETRIES = int(os.getenv("AI_MAX_RETRIES", "2"))


def _retry(fn, retries=MAX_RETRIES):
    """Retry a function with exponential backoff."""
    last_err = None
    for attempt in range(retries + 1):
        try:
            return fn()
        except Exception as e:
            last_err = e
            if attempt < retries:
                wait = (attempt + 1) * 1.5
                print(f"[AI Provider] Retry {attempt + 1}/{retries} after {wait:.1f}s: {e}")
                time.sleep(wait)
    raise last_err


class GroqProvider:
    """Groq Cloud — LLaMA 3.3 70B (free tier, fast)"""

    name = "groq"
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from groq import Groq
            self._client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        return self._client

    def call_llm(self, prompt: str, system: str = None, max_tokens: int = 2000, temperature: float = 0.3) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        def _call():
            resp = self._get_client().chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return resp.choices[0].message.content

        return _retry(_call)

    def generate_explanations(self, failed_controls: list, company_name: str) -> list:
        import groq_service
        return groq_service.generate_explanations(failed_controls, company_name)

    def generate_audit_questions(self, failed_controls: list, company_name: str) -> dict:
        import groq_service
        return groq_service.generate_audit_questions(failed_controls, company_name)

    def generate_policies(self, company_name: str) -> dict:
        import groq_service
        return groq_service.generate_policies(company_name)


class BedrockProvider:
    """AWS Bedrock — Amazon Nova Micro (pay-per-use, enterprise)"""

    name = "bedrock"
    model = os.getenv("BEDROCK_MODEL", "amazon.nova-micro-v1:0")

    def call_llm(self, prompt: str, system: str = None, max_tokens: int = 2000, temperature: float = 0.3) -> str:
        import bedrock_service
        full_prompt = prompt
        if system:
            full_prompt = f"{system}\n\n{prompt}"

        def _call():
            return bedrock_service._call_bedrock(full_prompt, max_tokens=max_tokens, temperature=temperature)

        return _retry(_call)

    def generate_explanations(self, failed_controls: list, company_name: str) -> list:
        import bedrock_service
        return bedrock_service.generate_explanations(failed_controls, company_name)

    def generate_audit_questions(self, failed_controls: list, company_name: str) -> dict:
        import bedrock_service
        return bedrock_service.generate_audit_questions(failed_controls, company_name)

    def generate_policies(self, company_name: str) -> dict:
        import bedrock_service
        return bedrock_service.generate_policies(company_name)


# ═══════════════════════════════════════════════════════════════════════════════
# Initialize the provider based on env var
# ═══════════════════════════════════════════════════════════════════════════════

def _init_provider():
    if AI_PROVIDER == "bedrock":
        print(f"[AI Provider] Using AWS Bedrock ({BedrockProvider.model})")
        return BedrockProvider()
    else:
        print(f"[AI Provider] Using Groq ({GroqProvider.model})")
        return GroqProvider()


# Singleton — created once at import time
ai = _init_provider()
