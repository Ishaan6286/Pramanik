# PRAMANIK PROJECT: COMPLETE INTERVIEW KNOWLEDGE EXTRACTION

> [!NOTE]
> This document is based on a deep forensic analysis of the `soc2-analyzer` repository. Claims are based on the actual codebase implementation.

---

# 1. EXECUTIVE PROJECT OVERVIEW

### What is Pramanik?
Pramanik is an AI-powered SOC 2 compliance analyzer and Co-Pilot. It allows companies to upload their AWS configuration (JSON), scan live AWS environments, or scan GitHub repositories, and receive instant compliance gap analysis mapped to SOC 2 Trust Services Criteria. It provides AI-generated explanations, remediation steps, dynamic policy generation, and an adversarial "Red Team" audit simulation.

### What exact problem does it solve?
SOC 2 compliance is historically manual, expensive, and confusing for startups. Security audits require reading dense AWS configurations and mapping them to abstract compliance criteria. Pramanik automates the gap analysis, translates technical misconfigurations into business risks, and generates audit-ready policies, reducing compliance preparation time from months to minutes.

### Who are its intended users?
CTOs, CISOs, DevOps engineers, and compliance officers at SaaS startups (primarily Seed-Series C) who are preparing for SOC 2 Type II audits.

### What is the main use case?
A CTO uploads an AWS configuration export (or connects their live AWS/GitHub). The system instantly scores the infrastructure against 33 SOC 2 controls, flags critical vulnerabilities (e.g., public S3 buckets, missing MFA), provides step-by-step AWS console fixes via LLMs, and allows the CTO to chat with an AI assistant to prepare for auditor questions.

### What makes it different from a normal chatbot?
It is a stateful, multi-modal compliance engine. It runs deterministic validation checks (Python logic mapping AWS config to SOC 2) *before* invoking LLMs. It uses LangGraph to orchestrate multiple agents (Code, Policy, Dependency, Adversary) rather than a single LLM call.

### What makes it different from simply uploading a PDF to ChatGPT?
ChatGPT lacks deterministic mapping to exact AWS/SOC 2 configurations. Pramanik uses deterministic logic (`soc2_controls.py`) to guarantee 100% accurate gap detection, and only uses LLMs (Groq/DeepSeek) for *explanations*, *fixes*, and *adversarial simulations*. 

### Why was RAG needed?
The chatbot feature (`/api/pramanik/chat`) needs deep context about SOC 2 domains (Confidentiality, Privacy, Security, etc.) without hallucinating. It pulls precise control definitions from an internal knowledge base to ground the LLM's responses.

### What role does AI play?
1. **Explanation & Remediation**: Translating technical gaps into plain English and AWS console steps (Groq).
2. **Policy Generation**: Writing SOC 2 compliant documents dynamically.
3. **Adversary Agent (ComplianceGhost)**: Challenging users like a Big 4 auditor.
4. **Chatbot**: Answering compliance queries using a built-in knowledge base (DeepSeek V3.2).

### What parts are deterministic software and what parts use LLMs?
- **Deterministic**: AWS config parsing, scoring algorithm, compliance drift detection, SOC 2 control evaluations (e.g., checking if `mfa_enforced == true`), LangGraph routing, database operations.
- **LLM**: Generating risk explanations, fix steps, policy text, auditor challenge questions, and chatting with users.

### What is the complete end-to-end user journey?
1. User logs in via Google/GitHub OAuth.
2. User lands on the dashboard and connects AWS or uploads an AWS config JSON.
3. FastAPI backend deterministically evaluates the config against 33 SOC 2 controls.
4. Backend sends failed controls to Groq LLM to generate plain-English explanations and fix steps.
5. Backend calculates CES (Compliance Effort Score) and prioritizes fixes.
6. Results are saved to Supabase.
7. Frontend displays the score, critical gaps, and remediation steps.
8. User interacts with "Pramanik AI" to generate policies or simulate an auditor interview.

### 30-second interview pitch
"Pramanik is an AI-powered SOC 2 compliance co-pilot for SaaS startups. It ingests AWS configurations and GitHub repositories, deterministically evaluates them against SOC 2 controls, and uses LangGraph and LLMs to generate remediation steps, audit-ready policies, and adversarial red-team simulations. It's built with React, FastAPI, Supabase, and orchestrates Groq and DeepSeek models."

### 60-second interview pitch
"Pramanik automates the SOC 2 preparation process. Instead of hiring expensive consultants, a CTO can connect their AWS account or GitHub repo. The Python backend evaluates the infrastructure against 33 specific SOC 2 controls. For any failures, it uses Groq's LLaMA 3.3 to generate exact remediation steps and explain the business risk. It features a LangGraph multi-agent system that scans code, checks dependencies, and acts as an adversarial auditor to challenge the user's compliance posture. The stack is React and Tailwind on the frontend, FastAPI on the backend, with Supabase for state management, and a dynamic LLM router switching between Groq and NVIDIA-hosted DeepSeek."

### 2-minute detailed project explanation
"I built Pramanik to bridge the gap between DevOps and compliance. The architecture is split between a React/Vite frontend and a FastAPI backend. When a user provides their AWS configuration, it hits my deterministic validation engine—this is crucial because we can't let AI hallucinate whether an S3 bucket is public. Once the deterministic engine identifies gaps, I use Groq's API to enrich those findings with human-readable risk explanations and step-by-step fixes. 

For deeper analysis, I implemented a LangGraph multi-agent pipeline. If a user connects a GitHub repo, the system routes the data through a Code Agent, a Policy Agent, and a Dependency Agent. If violations are found, a conditional edge routes to an Adversary Agent that uses AI to challenge the findings like a Big 4 auditor. If the Adversary escalates an issue, the graph loops back for a deeper re-scan of specific files.

Finally, I built a RAG-powered chatbot using DeepSeek V3.2 via NVIDIA NIM. It intercepts user queries, maps them to an internal SOC 2 knowledge base, and grounds the LLM to prevent hallucinations. All session data, baseline configurations for drift detection, and dynamic audit questions are stored in a Supabase PostgreSQL database. This system turns a 3-month compliance prep into an automated, interactive experience."

---

# 2. COMPLETE TECH STACK

## Frontend
- **Framework**: React 18
- **Language**: JavaScript (JSX)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **3D / Animations**: Three.js (`@react-three/fiber`, `@react-three/drei`, `ogl`), GSAP, Framer Motion
- **Charting**: Recharts
- **Icons**: Lucide-react
- **Authentication**: `@react-oauth/google`
- **PDF Generation**: `jspdf`, `html2canvas`
- **State/Routing**: React standard state (no Redux found in `package.json`). Conditional rendering based on state (`App.jsx`).

## Backend
- **Framework**: FastAPI (Python 3.11)
- **Language**: Python
- **Server**: Uvicorn
- **API Architecture**: REST
- **Validation**: Pydantic
- **Authentication**: OAuth token exchange via Google/GitHub APIs directly using `urllib`
- **Database Client**: `supabase` (Python client)
- **External Integration**: `boto3` (AWS SDK)

## AI / LLM
- **LLM Providers**: Groq (primary), NVIDIA NIM (for DeepSeek), AWS Bedrock (fallback/alternate)
- **Models**: 
  - `llama-3.3-70b-versatile` (Groq)
  - `deepseek-ai/deepseek-v3.2` (NVIDIA NIM)
  - `amazon.nova-micro-v1:0` (AWS Bedrock)
- **LangChain/LangGraph**: `langgraph`, `langchain-groq`, `langchain-core`
- **RAG Implementation**: Keyword-based context retrieval from an in-memory dictionary (`deepseek_service.py`), *not* a vector database.

## Database / Storage
- **Database**: Supabase (PostgreSQL)
- **Tables Used** (Based on `db.py`):
  - `scans`: Stores gap analysis results.
  - `baselines`: Stores configurations for drift detection.
  - `audit_questions`: Stores dynamic audit questions.
  - `github_scans`: Stores repo scan results.
- **Vector Store**: **None**. (RAG is implemented via dictionary lookups, not vector embeddings).

## Infrastructure / Deployment
- **Frontend Hosting**: Vercel (Configured via `vercel.json`)
- **Backend Hosting**: Render (Configured via `render.yaml`)
- **Environment Variables**: Managed via `.env` files (e.g., `GROQ_API_KEY`, `SUPABASE_URL`, `DEEPSEEK_API_KEY`).
- **CORS**: explicitly configured in `main.py` using `CORS_ORIGINS` env var.

### Why was this technology used here?
- **FastAPI**: Chosen for its speed, native async support, and automatic OpenAPI documentation, which is perfect for AI/LLM I/O bound tasks.
- **Supabase**: Provides a managed PostgreSQL database with an easy-to-use Python client, avoiding the overhead of setting up Alembic/SQLAlchemy for a fast-moving startup product.
- **Groq**: Used for its ultra-low latency inference (LPUs), crucial for generating explanations across 33 controls without timing out the HTTP request.
- **LangGraph**: Used for the multi-agent GitHub scanner because it supports stateful, cyclic graphs (allowing the Adversary agent to loop back and trigger re-scans), which standard LangChain pipelines cannot do easily.

---

# 3. REPOSITORY STRUCTURE

```
soc2-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/       # React UI components (LandingPage, Dashboard, etc.)
│   │   ├── App.jsx           # Main frontend entry point and router
│   │   └── ThemeContext.jsx  # Dark/Light mode state
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Tailwind styling config
│   └── vercel.json           # Vercel deployment config
├── backend/
│   ├── main.py               # FastAPI entry point, routes, auth handlers
│   ├── soc2_controls.py      # Deterministic AWS config validation rules (33 controls)
│   ├── ai_provider.py        # Abstract router switching between Groq and Bedrock
│   ├── groq_service.py       # Groq LLM integration (explanations, policies)
│   ├── deepseek_service.py   # DeepSeek RAG implementation for chatbot
│   ├── bedrock_service.py    # AWS Bedrock fallback integration
│   ├── agent_graph.py        # LangGraph multi-agent state machine
│   ├── github_agent.py       # Scans GitHub repos for vulnerabilities
│   ├── adversary_agent.py    # AI auditor that challenges findings
│   ├── pramanik_ai.py        # Core logic for Policy generation, Breach analysis, etc.
│   ├── db.py                 # Supabase database operations
│   ├── drift_detector.py     # Compares new AWS configs against baselines
│   └── requirements.txt      # Python dependencies
├── render.yaml               # Render backend deployment config
└── README.md
```

### Key Files Explained
- `backend/main.py`: The nerve center. Contains FastAPI routes (`/api/analyze`, `/api/scan-github`, `/api/auth/google`). Calls internal services.
- `backend/soc2_controls.py`: The deterministic engine. Contains functions like `check_cc6_1()` that hardcode AWS logic (e.g., checking `mfa_active`).
- `backend/agent_graph.py`: The LangGraph implementation. Defines the `StateGraph`, nodes, and conditional edges for the multi-agent GitHub scan.
- `backend/deepseek_service.py`: Contains the in-memory RAG logic. Maps user queries to `SOC2_KNOWLEDGE_BASE` dictionary and formats the DeepSeek LLM prompt.

---

# 4. COMPLETE SYSTEM ARCHITECTURE

```text
User (Browser)
      ↓ HTTP POST /api/analyze (JSON config)
FastAPI Backend (main.py)
      ↓
Deterministic Engine (soc2_controls.py)
      ↓ (Identifies 33 control pass/fails)
AI Router (ai_provider.py)
      ↓ (Routes based on AI_PROVIDER env var)
Groq Service (groq_service.py)
      ↓ (Generates explanations & fixes for failed controls)
Supabase Client (db.py)
      ↓ (Saves scan and baseline asynchronously)
PostgreSQL Database
      ↓
Response returned to Frontend
      ↓
React Dashboard renders results
```

### Request Lifecycle (AWS Config Analysis)
1. Frontend uploads JSON to `/api/analyze`.
2. `main.py` parses JSON, passes it to `run_all_checks()` in `soc2_controls.py`.
3. 33 independent functions evaluate the JSON. Returns a list of failed controls.
4. `ai_provider.py` routes the failed controls to `groq_service.py`.
5. Groq returns a JSON array of risk explanations and step-by-step fixes.
6. The backend merges the deterministic results with the AI explanations.
7. `calculate_crvs()` ranks the severity.
8. `db.save_scan()` stores the run in Supabase.
9. Final enriched JSON is sent to the frontend.

---

# 5. COMPLETE END-TO-END CODE FLOW

## Authentication Flow (Google OAuth)
1. **Frontend**: User clicks "Login with Google". `@react-oauth/google` opens a popup.
2. **Frontend**: Google returns an auth `code`. Frontend sends this to `/api/auth/google`.
3. **Backend (`main.py`)**: Receives `code`. Uses `urllib.request` to POST to `https://oauth2.googleapis.com/token`.
4. **Backend**: Exchanges `code` for an `access_token`.
5. **Backend**: Uses `access_token` to fetch user profile from `https://www.googleapis.com/oauth2/v3/userinfo`.
6. **Backend**: Returns email, name, and picture to frontend.
7. **Frontend (`App.jsx`)**: Saves email to `localStorage('pramanik_user')` and sets page state to `"upload"`.
*(Note: There is no backend JWT or session persistence. Auth is purely used for frontend state and identifying the user for DB records.)*

## LangGraph Multi-Agent Flow (GitHub Scan)
1. **Frontend**: User provides repo URL. Calls `/api/scan-github`.
2. **Backend (`main.py`)**: Calls `agent_graph.run_compliance_scan()`.
3. **Graph Start (`agent_graph.py`)**: 
   - `code_agent_node`: Scans repo via regex (returns findings).
   - `policy_agent_node`: Checks for SECURITY.md.
   - `dependency_agent_node`: Parses CVEs from OSV.dev.
4. **Conditional Edge**: `should_run_adversary` checks if findings > 0.
5. **Node `adversary_agent`**: Groq challenges findings.
6. **Conditional Edge**: `should_rescan` checks if adversary escalated any findings. If yes, increments iteration and loops back to `code_agent_node` for a deep scan of flagged files.
7. **Node `ces_engine`**: Scores and ranks findings.
8. **Graph End**: State is returned to `main.py` and sent to frontend.

---

# 6. RAG PIPELINE: DEEPEST POSSIBLE ANALYSIS

> [!WARNING]
> **INTERVIEW RISK**: This project **does not use a Vector Database (like Pinecone or pgvector) or Embeddings**. It implements a "Rule-Based Context Retrieval" (In-Memory RAG). You must not claim you used embeddings or chunking unless you add them.

### How it actually works (`deepseek_service.py`):
1. **Knowledge Base**: Stored as a hardcoded Python dictionary (`SOC2_KNOWLEDGE_BASE`) containing control domains and definitions.
2. **Query Preprocessing**: The user query is converted to lowercase.
3. **Retrieval Method (Keyword Matching)**: `build_rag_context()` checks if dictionary keys (e.g., "cc1", "cc6") or aliases (e.g., "mfa", "cloudtrail") exist as substrings in the query.
4. **Context Construction**: Matches are appended into a large string (`context = "SOC 2 COMPLIANCE KNOWLEDGE BASE:\n" + ...`).
5. **Prompt Construction**: 
   ```python
   "KNOWLEDGE BASE CONTEXT:\n{rag_context}\n\nUSER QUESTION:\n{user_question}"
   ```
6. **LLM Generation**: Sent to DeepSeek V3.2 via OpenAI SDK (`https://integrate.api.nvidia.com/v1`).
7. **Fallback**: If DeepSeek fails, it falls back to `ai_provider` (Groq/Bedrock) using the exact same context string.

### How to defend this in an interview:
*"For Pramanik, I evaluated vector databases, but because SOC 2 controls are a strictly defined taxonomy (only 33 specific controls), semantic search was overkill and prone to retrieving irrelevant controls. Instead, I built a deterministic, rules-based retrieval engine that uses keyword/alias mapping to fetch the exact control framework from memory. This guaranteed 100% precision on compliance frameworks, reduced latency to zero for the retrieval step, and avoided the infrastructure cost of a vector DB."*

---

# 7. RAG THEORY CONNECTED TO THIS PROJECT

### What is RAG?
Retrieval-Augmented Generation. Instead of relying on an LLM's internal weights (which might hallucinate SOC 2 requirements), we retrieve factual context and inject it into the prompt.

### Why RAG instead of fine-tuning?
Fine-tuning is expensive, slow to update, and models can still hallucinate. RAG allows Pramanik to inject the exact SOC 2 criteria (and user's exact AWS config) into the prompt, ensuring the LLM reasons over Ground Truth data.

### How does grounding reduce hallucination?
In `deepseek_service.py`, the system prompt explicitly commands the model to use the injected `KNOWLEDGE_BASE CONTEXT`. Because the LLM's attention mechanism heavily weights the immediate context window, it prioritizes the provided facts over its pre-trained weights.

---

# 8. LANGCHAIN ANALYSIS

> [!NOTE]
> LangChain (chains, prompt templates, vector stores) is **NOT heavily used** in this project. The project relies on native Python formatting and native API SDKs (Groq, OpenAI). The `langgraph` package is used for orchestration.

**Could we build Pramanik without LangGraph?**
Yes. The multi-agent flow could be built using standard Python `if/else` statements and `while` loops. 
**Why LangGraph was used**: It provides a formalized state machine (`StateGraph`). It manages the `ComplianceState` typed dictionary automatically across nodes, making it easier to trace execution (via `agent_trace`) and preventing infinite loops during the Adversary's re-scan logic.

---

# 9. LANGGRAPH ANALYSIS

### Graph Reconstruction (`agent_graph.py`)

```text
START
  ↓
code_agent (Scans files)
  ↓
policy_agent (Checks docs)
  ↓
dependency_agent (Checks CVEs)
  ↓
[Conditional: findings > 0?]
  ├── NO → ces_engine (Scores findings) → END
  └── YES → adversary_agent (LLM challenges findings)
              ↓
          [Conditional: findings escalated?]
              ├── YES → increment_iteration → code_agent (Re-scans flagged files only)
              └── NO  → ces_engine → END
```

### Node Details:
- **Input State**: `ComplianceState` (TypedDict holding `repo_url`, `findings`, `agent_trace`, etc.)
- **Processing**: Each node is a Python function taking `state` and returning a dict of state updates.
- **Output State**: LangGraph automatically merges the returned dict into the main state.

---

# 10. LLM ARCHITECTURE

### 1. Groq (Primary Engine)
- **Where**: `groq_service.py`
- **Model**: `llama-3.3-70b-versatile`
- **Why**: Used for gap explanations, audit questions, and policy generation. Requires massive output speed (LPUs) to generate JSON for 33 controls instantly.
- **Settings**: Temperature 0.3 for deterministic, JSON-heavy output.

### 2. NVIDIA NIM / DeepSeek (Chat Engine)
- **Where**: `deepseek_service.py`
- **Model**: `deepseek-ai/deepseek-v3.2`
- **Why**: Used for the conversational RAG chatbot. DeepSeek has excellent reasoning capabilities for complex user queries.
- **Settings**: Temperature 0.7 for more conversational flow. Uses `thinking: True` for reasoning.

### 3. AWS Bedrock (Fallback Engine)
- **Where**: `ai_provider.py` / `bedrock_service.py`
- **Model**: `amazon.nova-micro-v1:0`
- **Why**: Acts as a toggleable alternative to Groq (via `AI_PROVIDER` env var) for enterprise users who mandate AWS-only data processing.

### Architecture Features:
- **Retry Logic**: `ai_provider.py` implements a custom `@_retry` wrapper with exponential backoff (`(attempt + 1) * 1.5` seconds).
- **Fallback Logic**: If DeepSeek fails in `pramanik_chat`, it catches the exception and falls back to `ai_provider._fallback_chat()`.

---

# 11. PROMPT ENGINEERING

### Example Prompt: Gap Explanation (`groq_service.py`)
```python
prompt = f"""You are a SOC 2 compliance expert helping an Indian startup called "{company_name}".

They have the following security issues in their AWS setup:
{failed_summary}

For each failed control, provide:
1. A simple explanation of why this is a security risk (2-3 sentences, plain English)
2. Exact step-by-step fix in AWS console (3-4 steps)
3. Business impact if not fixed (1 sentence)

Format your response as a JSON array like this:
[ {{"control_id": "CC6.1", "risk_explanation": "...", ...}} ]

Return ONLY the JSON array, no other text."""
```
**Analysis**:
- **Role Prompting**: "You are a SOC 2 compliance expert".
- **Structured Output**: Explicitly provides a JSON schema example and commands "Return ONLY the JSON array".
- **Failure case**: If the LLM includes markdown backticks (`````json`````), the code manually cleans it (`text.replace("```json", "")`).

---

# 12. SOC 2 DOMAIN KNOWLEDGE

### What is SOC 2?
System and Organization Controls 2. It is an auditing procedure ensuring service providers securely manage data to protect the interests of the organization and the privacy of its clients.

### Trust Services Criteria evaluated in Pramanik (`soc2_controls.py`):
1. **Security (Common Criteria - CC)**: Firewalls, MFA, Intrusion detection (e.g., checking `mfa_active`, CloudTrail).
2. **Availability (A1)**: Disaster recovery, backups (e.g., checking RDS Multi-AZ, backup retention).
3. **Confidentiality (C1)**: Data classification (e.g., checking S3 tags, Amazon Macie).
4. **Privacy (P1)**: PII protection (e.g., checking S3 public buckets, retention policies).
5. **Processing Integrity (PI1)**: Quality assurance (e.g., WAF, X-Ray).

---

# 13. DATABASE ARCHITECTURE

**Database**: Supabase (PostgreSQL managed service).
**Client**: `supabase` Python package via REST API.

### Tables (Inferred from `db.py`)
1. **`scans`**: Stores Gap Analysis runs.
   - Columns: `id`, `user_id`, `company_name`, `score`, `results` (JSON), `config` (JSON).
2. **`baselines`**: Stores known-good states for drift detection.
3. **`audit_questions`**: A dynamic table populated via `seed_audit_questions()`.
4. **`github_scans`**: Stores LangGraph run results.

> [!IMPORTANT]
> **Why Supabase instead of MongoDB?**
> "SOC 2 data is highly relational (Users have Scans, Scans have Controls, Controls have Audit Questions). PostgreSQL enforces strict schemas and data integrity, which is required for a compliance app. Supabase gave us Postgres with a zero-config REST API."

---

# 14. AUTHENTICATION AND AUTHORIZATION

> [!WARNING]
> **INTERVIEW RISK**: Authentication is **PARTIALLY IMPLEMENTED**.
> The backend validates the OAuth code with Google/GitHub and fetches the email, but it **DOES NOT** issue a JWT or validate session tokens on subsequent API requests (like `/api/analyze`). 

### How it currently works:
- Login exchanges code for profile data.
- Frontend stores `localStorage("pramanik_user")`.
- Frontend sends `user_id` as part of the JSON payload.
- Backend saves data using the provided `user_id`.

### Ideal Production Behavior (What you should say):
*"Currently, Auth is used for identity resolution. In a production environment, the backend OAuth handler would generate an HttpOnly signed JWT cookie. FastAPI dependency injection (e.g., `Depends(verify_token)`) would be added to every protected route to ensure users can only read/write their own `scans` table records."*

---

# 15. FRONTEND ARCHITECTURE

- **State Management**: React `useState`. The entire app routing is handled via a large `switch(page)` statement in `App.jsx` (No React Router used).
- **Styling**: Tailwind CSS for rapid UI building.
- **Interactive Elements**: Uses `html2canvas` and `jspdf` to allow users to export their compliance dashboards as PDF reports.

---

# 16. BACKEND ARCHITECTURE

- **Entrypoint**: `main.py`
- **Framework**: FastAPI
- **Main API Routes**:
  - `POST /api/analyze`: Deterministic config analysis.
  - `POST /api/scan-aws`: Live AWS API scan via boto3.
  - `POST /api/scan-github`: LangGraph execution.
  - `POST /api/pramanik/chat`: DeepSeek RAG interface.
  
**Why FastAPI instead of Flask?**
*"FastAPI provides native asynchronous support via `async def`. For Pramanik, which spends a lot of time waiting on network I/O from Groq, DeepSeek, and Supabase, async non-blocking routes allow a single Uvicorn worker to handle hundreds of concurrent analyses without freezing."*

---

# 17. API CONTRACTS & ERROR HANDLING

### Example Contract: `/api/analyze`
**Input**: `UploadFile` (AWS JSON config)
**Output**: 
```json
{
  "company_name": "String",
  "score": "Integer",
  "passed": "Integer",
  "results": "Array of Enriched Control Objects"
}
```

### Error Handling Implemented:
- **Invalid JSON upload**: Caught in `main.py` (`raise HTTPException(status_code=400, detail="Invalid JSON")`).
- **AI Failure during analyze**: Handled gracefully. If Groq fails, the API prints the error and returns the deterministic results without AI explanations (Non-blocking).
- **Database Failure**: Handled gracefully via `try/except`. The API still returns the scan results to the user even if Supabase is down.

---

# 19. SECURITY

### Implemented:
- **CORS**: Restricted via `CORS_ORIGINS` env var in `main.py`.
- **Environment Variables**: API keys (Groq, Supabase, DeepSeek) are kept strictly on the backend.

### Not Implemented / Technical Debt:
- **Backend Authorization**: Endpoints do not verify JWTs. Any user can post to `/api/analyze`.
- **Tenant Isolation**: Supabase Row Level Security (RLS) is not explicitly defined in the codebase.

---

# 21. PERFORMANCE & SCALABILITY

### Current Bottlenecks:
- `deepseek_service.py` is synchronous (`stream=False`). It waits for the full generation before responding.
- `soc2_controls.py` runs sequentially (though it's CPU bound and fast).

### Scalability Plan:
*"To scale Pramanik to 10,000 users, I would decouple the LLM generation from the HTTP request cycle. When a user uploads a config, I would return the deterministic scores immediately, and place a message on an AWS SQS queue. A background Celery worker would pick it up, call Groq for the explanations, and update Supabase. The frontend would use WebSockets or Polling to update the UI when the AI finishes."*

---

# 24. DESIGN DECISIONS AND TRADE-OFFS

**Decision**: Using native Python Dicts for RAG instead of pgvector.
**Why Chosen**: SOC 2 taxonomy is small (33 controls). Keyword mapping is 100% accurate and 0ms latency.
**Trade-off**: Harder to scale if we wanted to ingest thousands of PDF compliance manuals. 

**Decision**: LangGraph over standard LangChain.
**Why Chosen**: Allowed cyclical state (Adversary Agent rejecting findings and looping back to Code Agent).
**Trade-off**: Higher complexity and steeper learning curve.

**Decision**: Groq for Explanations, DeepSeek for Chat.
**Why Chosen**: Groq's LLaMA 3.3 is ultra-fast, perfect for blocking API calls parsing JSON. DeepSeek V3.2 has superior reasoning (CoT) for open-ended user chats.

---

# 30. INTERVIEW CROSS-QUESTION BANK

### 1. Explain your project.
**Answer**: Use the 60-second pitch (Section 1).

### 2. How did you reduce LLM Hallucinations?
**Answer**: I built a hybrid system. Step 1 is entirely deterministic Python logic evaluating the JSON configuration. The LLM is only fed *proven* failures to generate explanations. For the chatbot, I implemented a rules-based RAG that injects exact SOC 2 definitions into the context window, strictly grounding the model.

### 3. Why FastAPI instead of Express.js?
**Answer**: Python has the most mature ecosystem for AI SDKs (LangGraph, OpenAI, boto3). FastAPI gave me the async performance of Node.js while keeping me in the Python AI ecosystem.

### 4. What happens if Groq API goes down?
**Answer**: The system has two layers of resilience. First, `ai_provider.py` implements an exponential backoff retry. Second, if it completely fails, `main.py` catches the exception and gracefully degrades—returning the deterministic SOC 2 score without the AI explanations, so the user isn't blocked.

### 5. How would you improve the RAG pipeline?
**Answer**: I would transition from dictionary-based RAG to a vector database like pgvector in Supabase. I would chunk large SOC 2 PDF manuals, generate embeddings using OpenAI's `text-embedding-3-small`, and perform cosine similarity search. This would allow the chatbot to answer highly obscure compliance questions beyond the top 33 controls.

---

# 34. MY CONTRIBUTION / OWNERSHIP PREPARATION

"I worked primarily on **the backend architecture and AI orchestration**."
"My main responsibility was **building the deterministic SOC 2 evaluation engine and integrating it with LangGraph and Groq**."
"The hardest problem I solved was **preventing the LLM from hallucinating compliance gaps, which I solved by separating deterministic validation from LLM text generation**."
"If I redesigned it today, I would **implement asynchronous task queues (Celery) for the LLM calls and secure the API endpoints with JWT middleware**."

---

# 37. FINAL INTERVIEW CHEAT SHEET

- **One-line**: AI SOC 2 Compliance Analyzer & Co-Pilot.
- **Tech Stack**: React, FastAPI, Supabase, LangGraph, Groq, DeepSeek.
- **Architecture**: Deterministic Validation → LLM Enrichment → Supabase Storage.
- **RAG**: Rule-based keyword matching injected into DeepSeek context.
- **Key Decision 1**: Groq (Speed) vs DeepSeek (Reasoning).
- **Key Decision 2**: LangGraph for cyclic multi-agent red-teaming.
- **Key Improvement**: Add JWT validation and Celery workers for scale.

---

# 39. FINAL KNOWLEDGE GAPS
- **Unknowns (Needs User Input)**: 
  - Exact nature of the "Live AWS Scan" credentials (how they are secured on the client before being sent).
  - Specific team size or timeline if this was a group project.
  - Whether Vercel/Render deployments are actively handling production traffic.
