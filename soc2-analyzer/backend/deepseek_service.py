"""
Deepseek V3.2 AI Service — Ultimate RAG Layer for Pramanik Chatbot
Uses NVIDIA-hosted Deepseek V3.2 for intelligent compliance Q&A.
Multi-modal RAG with streaming, reasoning, and audit-friendly responses.
"""

import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Initialize Deepseek client via NVIDIA's integration API
def _get_client():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://integrate.api.nvidia.com/v1")
    if not api_key:
        raise Exception("DEEPSEEK_API_KEY not set in .env")
    
    return OpenAI(
        base_url=base_url,
        api_key=api_key
    )


# SOC 2 Knowledge Base for RAG context
SOC2_KNOWLEDGE_BASE = {
    "cc1": {
        "title": "Governance and Organization",
        "controls": [
            "CC1.1: Commitment to Competence",
            "CC1.2: Board/Management Accountability",
            "CC1.3: Security Objectives & Responsibilities",
            "CC1.4: Competency & Accountability"
        ]
    },
    "cc2": {
        "title": "External Requirements & Risk Assessment",
        "controls": [
            "CC2.1: External Requirements Knowledge",
            "CC2.2: Risk Assessment",
            "CC2.3: Fraud Risk Assessment"
        ]
    },
    "cc3": {
        "title": "Strategic Planning",
        "controls": [
            "CC3.1: Objectives Definition",
            "CC3.2: Risk Tolerance"
        ]
    },
    "cc4": {
        "title": "Information & Communications",
        "controls": [
            "CC4.1: Quality Information",
            "CC4.2: Internal Communications"
        ]
    },
    "cc5": {
        "title": "Risk Assessment & Monitoring",
        "controls": [
            "CC5.1: Risk Identification",
            "CC5.2: Fraud Risk"
        ]
    },
    "cc6": {
        "title": "Logical & Physical Access Control (CRITICAL)",
        "controls": [
            "CC6.1: Access Authorization (MFA, Password Policies)",
            "CC6.2: Access based on Least Privilege",
            "CC6.3: Job Function vs Access Control",
            "CC6.4: Physical Access Restrictions",
            "CC6.5: Timely Access Discontinuation (Offboarding)",
            "CC6.6: Logical Access Security (VPC, Security Groups, WAF)",
            "CC6.7: User & Service Account Management",
            "CC6.8: Authentication & Identification",
            "CC6.9: Change Management Controls"
        ]
    },
    "cc7": {
        "title": "System Monitoring & Logging",
        "controls": [
            "CC7.1: System Activity Detection (CloudTrail, CloudWatch)",
            "CC7.2: Monitoring & Recording",
            "CC7.3: Response to Security Incidents",
            "CC7.4: Disaster Recovery & Business Continuity"
        ]
    },
    "cc8": {
        "title": "Change Management",
        "controls": [
            "CC8.1: Design & Development Changes",
            "CC8.2: Change Authorization & Recording",
            "CC8.3: Infrastructure Changes (IaC, CI/CD)"
        ]
    },
    "cc9": {
        "title": "Third-Party Management",
        "controls": [
            "CC9.1: Vendor Selection",
            "CC9.2: Vendor Risk Assessment & DPA"
        ]
    },
    "a1": {
        "title": "Availability",
        "controls": [
            "A1.1: Availability Monitoring",
            "A1.2: Uptime & Performance Targets"
        ]
    },
    "c1": {
        "title": "Confidentiality",
        "controls": [
            "C1.1: Data Classification",
            "C1.2: Secure Data Disposal"
        ]
    },
    "pi1": {
        "title": "Processing Integrity",
        "controls": [
            "PI1.1: Infrastructure & Development Controls"
        ]
    },
    "p1": {
        "title": "Privacy",
        "controls": [
            "P1.1: Privacy Notice & Consent"
        ]
    }
}


# System prompt for multi-modal RAG assistant
SYSTEM_PROMPT = """You are an advanced AI-powered RAG (Retrieval Augmented Generation) assistant for a compliance and audit platform.

Your role is to act as an intelligent, multilingual, multi-modal assistant that can understand imperfect human language and provide accurate, structured, and useful responses.

--------------------------------------
1. LANGUAGE UNDERSTANDING (CRITICAL)
--------------------------------------
- You MUST understand:
  - Normal English (formal/informal)
  - Hinglish (Hindi + English mix)
  - Basic Hindi queries

- Always interpret user intent even if:
  - Grammar is incorrect
  - Sentence is incomplete
  - Query is vague

- If unclear:
  - Ask a short clarification question instead of guessing

--------------------------------------
2. QUERY HANDLING STRATEGY
--------------------------------------
For every query:

STEP 1: Try to map the query to:
- Compliance (SOC 2, security, audits)
- Platform-related features
- Uploaded documents / knowledge base

STEP 2:
- If relevant context is found → use RAG data
- If partial context → combine RAG + general knowledge
- If no context → provide a general but accurate answer

NEVER say only "I don't know" unless absolutely necessary.

--------------------------------------
3. DOMAIN INTELLIGENCE (SOC 2 + PLATFORM)
--------------------------------------
- Be strong in:
  - SOC 2 controls (CC6, CC7, etc.)
  - Audit workflows
  - Evidence collection
  - Security best practices

- When answering compliance queries:
  - Map answers to controls if applicable
  - Suggest evidence/examples
  - Keep responses audit-friendly

--------------------------------------
4. GENERIC QUESTION HANDLING
--------------------------------------
- You ARE allowed to answer general questions:
  - Definitions
  - Explanations
  - Platform usage help

- But:
  - Keep answers slightly aligned to compliance/security when possible
  - Avoid going completely unrelated (e.g., entertainment, gossip)

--------------------------------------
5. MULTI-MODAL INPUT HANDLING
--------------------------------------
You can process:

A. Documents:
- Extract key information
- Answer based on content
- Analyze policies, procedures, configs

B. Images:
- Describe image content
- Extract text (OCR)
- Answer based on visual data
- Analyze screenshots, diagrams, charts

C. Audio:
- Assume transcription is provided
- Treat as user query
- Extract key compliance information

--------------------------------------
6. IMAGE GENERATION SUPPORT
--------------------------------------
If user asks to generate an image:
- Generate a detailed prompt for an image model
- Describe expected output clearly

--------------------------------------
7. RESPONSE STRUCTURE
--------------------------------------
Always structure answers as:

1. Short Answer / Summary
2. Key Points
3. (Optional) Actionable Steps / Suggestions

Keep responses:
- Clear
- Concise
- Professional

--------------------------------------
8. EDGE CASE HANDLING (IMPORTANT)
--------------------------------------
- If query is vague → clarify
- If query is partially relevant → guide user
- If query is outside domain → gently redirect

--------------------------------------
9. ANTI-HALLUCINATION RULE
--------------------------------------
- Do NOT fabricate compliance claims
- If unsure:
  - Say: "Based on available data..." or
  - "Typically..." instead of asserting false certainty

--------------------------------------
10. PERSONALITY
--------------------------------------
- Smart, calm, helpful
- Not robotic
- Not overly verbose
- Feels like an intelligent assistant inside a serious product

--------------------------------------

FINAL OBJECTIVE:
You are not just answering questions.
You are helping users navigate compliance, audits, and platform usage intelligently — even when their questions are unclear, mixed-language, or incomplete."""


def build_rag_context(query: str) -> str:
    """Build knowledge base context for the query."""
    query_lower = query.lower()
    relevant_topics = []
    
    for key, value in SOC2_KNOWLEDGE_BASE.items():
        if key in query_lower or value["title"].lower() in query_lower:
            title = value["title"]
            controls_str = "\n".join(f"  • {c}" for c in value["controls"])
            relevant_topics.append(f"{key.upper()}: {title}\n{controls_str}")
    
    if not relevant_topics:
        # If no specific match, include core controls
        cc6_controls = SOC2_KNOWLEDGE_BASE["cc6"]["controls"]
        cc7_controls = SOC2_KNOWLEDGE_BASE["cc7"]["controls"]
        controls_str = "\n".join(f"  • {c}" for c in cc6_controls + cc7_controls)
        relevant_topics.append(f"CRITICAL CONTROLS:\n{controls_str}")
    
    context = "SOC 2 COMPLIANCE KNOWLEDGE BASE:\n" + "\n\n".join(relevant_topics)
    return context


def chat_with_rag(user_question: str, conversation_history: list = None) -> dict:
    """
    Execute RAG-enhanced chat with Deepseek V3.2 for intelligent compliance Q&A.
    
    Args:
        user_question: User's compliance question
        conversation_history: List of previous messages for context (optional)
    
    Returns:
        dict with 'response', 'sources', 'reasoning', 'confidence'
    """
    try:
        # Build RAG context from knowledge base
        rag_context = build_rag_context(user_question)
        
        # Prepare messages with RAG context
        messages = []
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current question with RAG context
        messages.append({
            "role": "user",
            "content": f"KNOWLEDGE BASE CONTEXT:\n{rag_context}\n\nUSER QUESTION:\n{user_question}"
        })
        
        # Call Deepseek V3.2 API via NVIDIA
        client = _get_client()
        response = client.chat.completions.create(
            model="deepseek-ai/deepseek-v3.2",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
            temperature=0.7,
            top_p=0.95,
            max_tokens=2000,
            extra_body={"chat_template_kwargs": {"thinking": True}},
            stream=False
        )
        
        assistant_response = response.choices[0].message.content
        
        # Extract sources from RAG context
        sources = []
        for key, value in SOC2_KNOWLEDGE_BASE.items():
            if key in user_question.lower() or key.upper() in assistant_response:
                sources.append({
                    "control": key.upper(),
                    "title": value["title"]
                })
        
        return {
            "response": assistant_response,
            "sources": sources[:3] if sources else [],
            "confidence": "high" if sources else "medium",
            "model": "deepseek-v3.2 (NVIDIA hosted)",
            "timestamp": str(__import__('datetime').datetime.utcnow().isoformat())
        }
    
    except Exception as e:
        return {
            "error": str(e),
            "fallback": "Unable to reach Deepseek V3.2. Please try again or contact support.",
            "response": "I apologize, but I'm temporarily unavailable. Please use the knowledge base or try asking a simpler question."
        }


def generate_compliance_report(scan_results: list, company_name: str) -> str:
    """Generate intelligent compliance report using Deepseek V3.2 reasoning."""
    try:
        prompt = f"""Based on these SOC 2 compliance scan results for {company_name}, 
generate a brief executive summary with:
1. Current compliance level (%)
2. Critical gaps (top 3)
3. 30-day action plan with estimated effort
4. Resource recommendations
5. Risk prioritization

Results: {json.dumps(scan_results, indent=2)}"""
        
        client = _get_client()
        response = client.chat.completions.create(
            model="deepseek-ai/deepseek-v3.2",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=1500,
            extra_body={"chat_template_kwargs": {"thinking": True}}
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        return f"Report generation failed: {str(e)}"


def generate_audit_questions(failed_controls: list, company_name: str) -> list:
    """Generate intelligent audit questions using Deepseek V3.2 reasoning."""
    try:
        failed_summary = "\n".join(
            f"• {c['id']}: {c['title']}"
            for c in failed_controls[:5]
        )
        
        prompt = f"""Generate 5-7 challenging auditor questions for {company_name} 
        
These are their failed controls:
{failed_summary}

Questions should:
1. Challenge their remediation claims
2. Ask for evidence/documentation
3. Probe process maturity
4. Be realistic for SOC 2 Type II audit
5. Focus on AWS/cloud infrastructure specifics

Format: Return a JSON array with "question" and "category" fields."""
        
        client = _get_client()
        response = client.chat.completions.create(
            model="deepseek-ai/deepseek-v3.2",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=1000,
            extra_body={"chat_template_kwargs": {"thinking": True}}
        )
        
        response_text = response.choices[0].message.content
        # Try to extract JSON from response
        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "[" in response_text:
                json_str = response_text[response_text.index("["):response_text.rindex("]")+1]
            else:
                json_str = response_text
            
            return json.loads(json_str)
        except:
            # Fallback to structured response
            return [{
                "question": response_text,
                "category": "audit"
            }]
    
    except Exception as e:
        return [{
            "question": f"Error generating questions: {str(e)}",
            "category": "error"
        }]

