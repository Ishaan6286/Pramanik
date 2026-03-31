# Pramanik AI — SOC 2 Compliance RAG Assistant

A comprehensive Retrieval-Augmented Generation (RAG) system that powers AI-driven SOC 2 compliance assistance for SaaS startups. Pramanik AI provides 7 specialized operating modes to guide users through compliance gap analysis, policy generation, adversarial auditing, vendor inheritance mapping, and more.

## 🎯 System Overview

**Pramanik AI** is a multi-modal RAG engine that combines:
- **Large Language Models** (Deepseek via NVIDIA API, AWS Bedrock, Groq fallback)
- **SOC 2 Control Knowledge Base** (35+ granular controls with category mappings)
- **Compliance Risk Vectorization** (CES Algorithm for prioritizing remediation)
- **Database persistence** (Supabase for scan history and evidence tracking)
- **Frontend Integration** (React component with real-time chat and mode switching)

---

## 📋 The 7 Operating Modes

### Mode 1: 🔍 **Gap Analysis**
Scans your AWS configuration against SOC 2 controls and identifies compliance gaps.

**Input:** AWS config JSON or checkbox survey
**Output:** 
- Compliance score (0-100%)
- List of failed controls with severity (Critical/High/Medium)
- Remediation steps for each failed control
- Industry benchmark comparison

**API Endpoint:** `POST /api/pramanik/gap-analysis`

**Example Request:**
```json
{
  "mfa_enforced": true,
  "cloudtrail_enabled": false,
  "s3_public_access": true,
  "public_s3_buckets": ["my-uploads-bucket"],
  "rds_encryption": true,
  "tls_enabled": true,
  "security_groups_configured": true,
  "least_privilege_applied": false,
  "cloudwatch_enabled": false
}
```

**Example Response:**
```json
{
  "score": 45,
  "passed": 5,
  "total": 9,
  "criticial_issues": [
    {
      "control_id": "CC7.2",
      "title": "Monitoring for anomalies (CloudTrail)",
      "status": "FAILED",
      "risk_explanation": "Without CloudTrail, you have no audit trail of API calls...",
      "fix_steps": ["Enable CloudTrail", "Store logs in S3 with versioning", "Set up CloudWatch alerts"],
      "business_impact": "Audit failure — cannot prove compliance to customers"
    }
  ]
}
```

---

### Mode 2: 📄 **Policy Generator**
Generates professional, SOC 2-compliant policy documents tailored to your company and tech stack.

**Supported Policy Types:**
- Access Control Policy
- Incident Response Policy
- Data Encryption Policy
- Password and Authentication Policy
- Vendor Management Policy
- Change Management Policy
- Business Continuity Policy
- Asset Management Policy
- Risk Assessment Policy
- Security Awareness Training Policy

**API Endpoint:** `POST /api/pramanik/policy`

**Example Request:**
```json
{
  "policyType": "Incident Response Policy",
  "companyName": "PayFlow Fintech",
  "stackTech": "AWS, Stripe, Supabase, GitHub",
  "policyOwner": "Chief Security Officer"
}
```

**Output:** Full policy document with:
- Purpose & Scope
- Incident categories and severity levels
- Response timelines and escalation procedures
- Technical playbooks (AWS-specific incidents)
- Investigation procedures
- Post-incident review checklist
- Signature block with approval dates

---

### Mode 3: 👻 **Ghost Audit (ComplianceGhost)**
Role-plays as a Big 4 auditor and challenges your compliance claims with adversarial questions.

**Auditor Profile:**
- 15+ years SOC 2 audit experience
- Skeptical of assertions without evidence
- Focuses on continuous control implementation, not one-time fixes

**API Endpoint:** `POST /api/pramanik/ghost-audit`

**Example Request:**
```json
{
  "companyName": "PayFlow",
  "controls": ["CC6.1", "CC7.2", "CC6.5"],
  "evidence_files": ["cloudtrail_logs.json", "iam_policy.json"]
}
```

**Output:** 10 adversarial challenge questions such as:
1. "You claim MFA is enforced. Show me CloudTrail logs of 10 failed MFA attempts AND proof users cannot disable MFA."
2. "Your CloudTrail shows API calls from April, but there's a 3-day gap April 7-10. Why?"
3. "When was the last employee terminated? Prove you disabled AWS/GitHub/VPN/email within 1 hour."
4. "Show database credential rotation logs for the last 90 days."
5. "Your vendor says they're SOC 2 Type II certified. Show their attestation report and DPA."

---

### Mode 4: 🤝 **Vendor Inheritance (TrustDNA)**
Maps which SOC 2 controls your vendor stack already covers for you.

**Supported Vendors:**
- AWS, Stripe, Supabase, Twilio, Vercel, GitHub, Cloudflare, Intercom, PagerDuty, Datadog

**API Endpoint:** `POST /api/pramanik/vendor-inheritance`

**Example Request:**
```json
{
  "vendors": ["AWS", "Stripe", "Supabase", "GitHub", "Datadog"],
  "companyName": "PayFlow"
}
```

**Output:** Control coverage matrix:
```
✅ CC6.1 (Logical Access) — 70% covered via Stripe + GitHub
   - Stripe: User authentication, API key management
   - GitHub: SSO, access reviews, audit logs
   ⚠️  YOU NEED: Employee access review process, MFA enforcement

❌ CC7.2 (Monitoring) — 30% covered via Datadog only
   - Datadog: App-level monitoring only
   - YOU NEED: API-level logging (CloudTrail), database query logging

✅ CC9.2 (Vendor Management) — 90% covered
   - All vendors have signed DPAs
```

---

### Mode 5: 💥 **Breach Playbook (IncidentResponse)**
Generates step-by-step incident response procedures for specific breach scenarios.

**Supported Scenarios:**
- AWS EC2 instance compromised
- S3 data exposure / bucket made public
- Database leaked customer data
- GitHub credentials exposed
- DDoS attack
- Ransomware infection

**API Endpoint:** `POST /api/pramanik/breach-playbook`

**Example Request:**
```json
{
  "scenario": "S3 bucket made public",
  "companyName": "PayFlow",
  "stackTech": "AWS, Supabase",
  "hasIncidentResponseTeam": true
}
```

**Output:** Hour-by-hour playbook:
```
**IMMEDIATE (0-15 mins):**
1. Trigger Incident Commander
2. List all S3 buckets (aws s3 ls)
3. Identify affected bucket: my-uploads-bucket
4. Check S3 access logs for unauthorized access
5. Take screenshot of bucket policy

**CONTAINMENT (15-60 mins):**
6. Revert bucket to PRIVATE immediately
7. Enable versioning to preserve evidence
8. Run AWS Config to check other buckets
9. Notify security team of findings

**INVESTIGATION (1-4 hours):**
10. Query CloudTrail for API calls against bucket
11. Check for data exfiltration in VPC Flow Logs
12. Identify if credentials were exposed
13. Document timeline of exposure

**COMMUNICATION (1 hour):**
14. Notify affected customers
15. Prepare notification email
16. Contact legal + insurance
```

---

### Mode 6: 🛣️ **PathFinder (ComplianceRoadmap)**
Generates a customized compliance roadmap with milestones and timelines.

**API Endpoint:** `POST /api/pramanik/pathfinder`

**Example Request:**
```json
{
  "companyName": "PayFlow",
  "currentScore": 35,
  "targetScore": 85,
  "timeline": "12 months",
  "budget": "high",
  "priorityControls": ["CC6.1", "CC7.2", "CC9.2"]
}
```

**Output:** Phased roadmap:
```
PHASE 1: Foundation (Month 1-3) — Score: 35 → 50
- Week 1-2: Enable CloudTrail (CC7.2) — 1 engineer, $0
- Week 2-3: Implement MFA (CC6.1) — 0.5 engineers, $500
- Week 3-4: S3 encryption (CC9.2) — 1 engineer, $0
- Month 2-3: Document access procedures — 1 security person

PHASE 2: Enhancement (Month 4-6) — Score: 50 → 70
- Vendor SOC 2 attestation collection
- Incident response procedure testing
- Annual access review process
- Backup/recovery testing

PHASE 3: Optimization (Month 7-12) — Score: 70 → 85
- Continuous monitoring (Datadog)
- Security awareness training
- Quarterly risk assessments
- Audit readiness review
```

---

### Mode 7: 💬 **Compliance Chatbot (LiveSupport)**
Real-time conversational AI assistant answering SOC 2 compliance questions.

**API Endpoint:** `WebSocket /api/pramanik/chat` or `POST /api/pramanik/chat-message`

**Capabilities:**
- Answer questions about specific SOC 2 controls
- Explain compliance requirements
- Suggest quick fixes for common issues
- Provide startup-specific guidance
- Link to relevant AWS documentation

**Example Conversation:**
```
User: "What do I need to do for MFA?"
Assistant: "MFA (Multi-Factor Authentication) is required by CC6.1.

For AWS:
1. Enable MFA in IAM console
2. Require MFA for root account (mandatory)
3. Enforce MFA for all users (via IAM policy)
4. Log MFA attempts in CloudTrail
5. Test that users cannot bypass MFA

For GitHub/Stripe:
- Both require MFA for organizational accounts
- Create enforcement policies

Would you like me to generate MFA enforcement policy?"
```

---

## 🏗️ System Architecture

### Backend Components

#### 1. **Main FastAPI Application** (`backend/main.py`)
- REST API routing
- CORS configuration
- Request validation
- File upload handling
- Response formatting

#### 2. **Pramanik AI Engine** (`backend/pramanik_ai.py`)
- Core RAG orchestration
- 7 mode implementations
- Prompt engineering for each mode
- Response formatting
- Evidence chain tracking

#### 3. **SOC 2 Knowledge Base** (`backend/soc2_controls.py`)
- 35+ granular SOC 2 controls
- Control-to-framework mappings
- Compliance scoring logic
- Industry benchmarks

#### 4. **AI Service Integrations**
- `bedrock_service.py` — AWS Bedrock (primary)
- `deepseek_service.py` — NVIDIA Deepseek API (RAG primary)
- `groq_service.py` — Groq API (fallback)
- Automatic failover logic

#### 5. **Database Layer** (`backend/db.py`)
- Supabase integration
- Scan history persistence
- Evidence document storage
- User profile management

#### 6. **Utilities**
- `framework_mappings.py` — ISO 27001/HIPAA score calculation
- `drift_detector.py` — Control compliance trend tracking
- `soc2_controls.py` — Master control definitions

### Frontend Components

#### 1. **PramanikAI.jsx**
- 7-mode UI switcher
- Real-time chat interface
- Form inputs for each mode
- Result display and formatting
- PDF export integration

#### 2. **ComplianceChatBot.jsx**
- Conversational UI
- Message history
- Typing indicators
- Real-time response streaming

#### 3. **Integration Points**
- Embedded in Dashboard
- Accessible via ChatLauncher
- Popup panel support
- Dark/light mode support

---

## 🚀 Setup & Deployment

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create `backend/.env`:
```env
# AWS Bedrock (primary AI)
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=ap-south-1

# Deepseek (RAG AI - primary for chatbot)
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_BASE_URL=https://integrate.api.nvidia.com/v1
DEEPSEEK_MODEL=deepseek-chat

# Groq (fallback AI)
GROQ_API_KEY=your_groq_key

# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Server
PORT=3001
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Start Services

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload --port 3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 — Node Server (Optional):**
```bash
cd backend
node server.js
```

---

## 📡 API Reference

### Gap Analysis
```
POST /api/pramanik/gap-analysis
Content-Type: application/json

Request:
{
  "mfa_enforced": boolean,
  "cloudtrail_enabled": boolean,
  "s3_public_access": boolean,
  ...
}

Response:
{
  "score": number,
  "passed": number,
  "total": number,
  "results": [
    {
      "control_id": "CC6.1",
      "title": string,
      "status": "PASSED" | "FAILED",
      "risk_explanation": string,
      "fix_steps": string[],
      "business_impact": string
    }
  ]
}
```

### Policy Generator
```
POST /api/pramanik/policy
Content-Type: application/json

Request:
{
  "policyType": string,
  "companyName": string,
  "stackTech": string,
  "policyOwner": string
}

Response:
{
  "policy_id": string,
  "content": string (markdown),
  "approval_block": string,
  "revision_history": [],
  "pdf_download_url": string
}
```

### Ghost Audit
```
POST /api/pramanik/ghost-audit
Content-Type: application/json

Request:
{
  "companyName": string,
  "controls": string[],
  "evidence_files": string[]
}

Response:
{
  "audit_id": string,
  "auditor_name": string,
  "challenges": [
    {
      "question": string,
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "expected_evidence": string[],
      "compliance_weight": number
    }
  ]
}
```

### Vendor Inheritance
```
POST /api/pramanik/vendor-inheritance
Content-Type: application/json

Request:
{
  "vendors": string[],
  "companyName": string
}

Response:
{
  "vendor_matrix": {
    "vendor_name": {
      "coverage_percentage": number,
      "controls_covered": string[],
      "controls_needed": string[],
      "soc2_report_url": string,
      "dpa_signed": boolean
    }
  },
  "overall_coverage": number,
  "gaps": string[]
}
```

---

## 🔧 Configuration & Customization

### Adding Custom SOC 2 Controls

Edit `backend/soc2_controls.py`:

```python
SOC2_CONTROLS = {
    "CC6.1": {
        "name": "Logical access controls...",
        "category": "CC6",
        "severity": "CRITICAL",
        "framework_mappings": {
            "ISO27001": "A.9.2.1",
            "HIPAA": "164.312(a)(2)(i)"
        }
    }
}
```

### Customizing LLM Prompts

Edit `backend/pramanik_ai.py`:

```python
SYSTEM_PROMPTS = {
    "gap_analysis": "You are a SOC 2 compliance expert...",
    "policy_generator": "Generate a professional policy...",
    # Edit prompts for your use case
}
```

### Adding New AI Providers

```python
# backend/my_service.py
def generate_explanations(failed_controls, company):
    # Implement your AI provider logic
    pass

# Update backend/main.py to include in failover chain
```

---

## 📊 Database Schema

### Scans Table (Supabase)
```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  user_id UUID,
  company_name VARCHAR,
  industry VARCHAR,
  score FLOAT,
  passed INT,
  total INT,
  results JSONB,
  priority_fixes JSONB,
  framework_scores JSONB,
  config JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Controls Table
```sql
CREATE TABLE controls (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  category VARCHAR,
  severity VARCHAR,
  mappings JSONB,
  created_at TIMESTAMP
);
```

---

## 🧪 Testing

### Test Gap Analysis Locally
```bash
curl -X POST http://localhost:3001/api/pramanik/gap-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "mfa_enforced": false,
    "cloudtrail_enabled": false,
    "s3_public_access": true
  }'
```

### Test with Sample Data
```bash
python backend/pramanik_ai.py
# Runs local tests of all 7 modes
```

---

## 🐛 Troubleshooting

### LLM Fallbacks Not Working
- Check API keys in `.env`
- Verify CORS settings in `main.py`
- Test each AI provider independently

### Database Connection Issues
- Verify Supabase credentials
- Check network connectivity
- Enable verbose logging: `NODE_ENV=debug`

### Slow Response Times
- Check LLM provider rate limits
- Use caching for repeated queries
- Enable response streaming

---

## 📝 Development Roadmap

- [ ] Vector search integration (Pinecone/Weaviate)
- [ ] Real-time collaboration features
- [ ] Custom compliance frameworks
- [ ] Automated evidence collection
- [ ] Machine learning-based risk scoring
- [ ] Mobile app (iOS/Android)
- [ ] Multi-language support

---

## 📄 License

This RAG system is part of the soc2-analyzer project. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Areas for contribution:
- Additional SOC 2 controls
- New AI provider integrations
- Frontend enhancements
- Documentation improvements
- Test coverage

Submit PRs to the `main` branch with test coverage.

---

## 📬 Support

- **Documentation:** [PRAMANIK_AI_GUIDE.md](PRAMANIK_AI_GUIDE.md)
- **Issues:** GitHub Issues
- **Questions:** Discussion forum

---

**Last Updated:** March 2026  
**Authors:** Pramanik AI Development Team
