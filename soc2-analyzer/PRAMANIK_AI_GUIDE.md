# Pramanik AI — SOC 2 Compliance Co-Pilot

## 🎯 Overview

Pramanik AI is a comprehensive AI-powered compliance assistant integrated into the soc2-analyzer platform. It provides 7 specialized operating modes to guide Indian SaaS startups through SOC 2 Type II compliance.

## 📋 The 7 Operating Modes

### Mode 1: 🔍 Gap Analysis
**Purpose:** Scan your AWS configuration for SOC 2 compliance gaps  
**Input:** AWS configuration details (yes/no checkboxes)  
**Output:** Compliance score, critical failures, remediation steps  
**Use Case:** You've just set up AWS and want to know what security controls you need

**Example:**
```
Input: 
- MFA enforced: ✅
- CloudTrail enabled: ❌
- S3 public access: ❌

Output:
Score: 12/33 controls passing (36%)
CRITICAL: CloudTrail disabled (CC7.2)
CRITICAL: S3 public buckets (CC6.1)
HIGH: No encryption at rest (CC6.7)
```

---

### Mode 2: 📄 Policy Generator
**Purpose:** Generate professional SOC 2 compliance policy documents tailored to your tech stack  
**Available Policies:**
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

**Input:** Company name, policy type, tech stack, policy owner  
**Output:** Complete policy document with numbered procedures, roles/responsibilities

**Example:**
```
Input:
- Policy Type: "Incident Response Policy"
- Company: "PayFlow Fintech"
- Stack: "AWS, Stripe, Supabase"
- Owner: "Chief Security Officer"

Output:
# PayFlow Fintech — Incident Response Policy
[Complete policy with:]
- Purpose & Scope
- Incident Categories (Critical/High/Medium/Low)
- Response times & escalation
- Technical playbooks (AWS EC2 compromise, S3 data exposure, database breach)
- Investigation procedures
- Post-incident review process
- Signed by: [Policy owner]
```

---

### Mode 3: 👻 Ghost Audit (ComplianceGhost)
**Purpose:** Role-play as a Big 4 auditor and challenge your compliance evidence  
**Auditor Profile:** 15+ years SOC 2 experience, skeptical, thorough  
**Output:** 10 adversarial auditor challenge questions

**Example Questions the Auditor Asks:**
1. "You claim MFA is enforced. Show me CloudTrail logs of 10 failed MFA attempts AND proof users cannot disable MFA."
2. "Your CloudTrail shows API calls from April, but there's a 3-day gap April 7-10 with no logs. Why?"
3. "You say least privilege is implemented. Show me IAM policies for 5 random engineers with justification."
4. "When was the last employee terminated? Prove you disabled AWS/GitHub/VPN/email within 1 hour."
5. "Database credentials in Secrets Manager — show the rotation schedule and access logs for the last 90 days."

**What You Need After Ghost Audit:**
- Evidence of continuous control implementation (not one-time fixes)
- Demonstrable procedures (incident response timelines, access reviews)
- Signed vendor agreements and SOC 2 reports

---

### Mode 4: 🤝 Vendor Inheritance (TrustDNA)
**Purpose:** Map which SOC 2 controls your vendor stack already covers for you  
**Supported Vendors:** Stripe, AWS, Supabase, Twilio, Vercel, GitHub, Cloudflare, Intercom, PagerDuty, Datadog

**Example:**
```
Input: AWS, Stripe, Supabase, GitHub, Datadog

Output:
✅ CC6.1 (Logical Access) — 70% covered via Stripe + GitHub
✅ CC9.2 (Vendor Management) — 80% covered via Stripe, Supabase (with DPAs)
⚠️ CC4.1 (Monitoring) — 40% covered via Datadog (you need app-level monitoring)
❌ CC7.3 (Incident Evaluation) — Not covered by any vendor (you must build)

YOUR EXPOSURE:
- You directly own: CC1, CC2, CC3, CC5, CC8 (organizational/policy controls)
- Vendors cover about 40% of controls with SOC 2 Type II or DPA
- Gaps you must fill: Employee training, access reviews, change management, policy enforcement
```

---

### Mode 5: 💀 Compliance Obituary (Breach Analysis)
**Purpose:** Analyze real-world breaches and check if your infrastructure is vulnerable  
**Known Breaches:**
- LastPass 2022 (developer laptop compromise → source code theft)
- Twilio 2022 (SMS phishing → credential theft → data access)
- Cloudflare Okta 2022 (lateral movement via vendor access)
- Uber 2022 (MFA fatigue → admin compromise)
- Microsoft Exchange 2023 (zero-day → network spread)

**Example:**
```
Input: LastPass 2022 breach

Failure Chain:
💀 Failure 1: Developer laptop compromised → No endpoint detection (CC6.8)
💀 Failure 2: Credentials stolen → No MFA on dev systems (CC6.1)
💀 Failure 3: Access segmentation missing → Lateral movement to prod (CC6.2)

YOUR EXPOSURE:
🔴 CRITICAL: You have the same gap — No endpoint detection
🟡 MEDIUM: You have partial controls — MFA enforced but not on service accounts
🟢 EXPOSED: You are protected — Network segmentation prevents lateral movement

WHAT WOULD HAVE STOPPED IT:
1. Endpoint Detection & Response (CC6.8)
2. Universal MFA enforcement (CC6.1)
3. Network segmentation / zero-trust access (CC6.2)
4. Real-time anomaly detection (CC7.2)
5. Incident response process (CC7.4)
```

---

### Mode 6: 🗺️ Certification Pathfinder
**Purpose:** Get a personalized compliance roadmap based on your company profile  
**Questions Answered:**
- Should you do SOC 2 Type I or Type II?
- Do you need ISO 27001, HIPAA, or other frameworks?
- What timeline is realistic?
- What controls to implement first?

**Example:**
```
Input Profile:
- Customers: US Enterprise SaaS
- Tech Stack: AWS, React, Node.js
- Team Size: 10 people
- Timeline: 6 months

Recommended Path: SOC 2 Type II

Timeline:
Month 1-2: Implement priority controls (MFA, CloudTrail, security groups)
Month 3-4: Write policies and collect evidence
Month 5-6: Prepare for audit, hire external auditor

Estimated Effort:
- Controls to implement: 33
- Policies to write: 10
- Evidence artifacts to collect: ~200
- With Pramanik: 8 weeks
- Without Pramanik: 24 weeks
```

---

### Mode 7: ❓ General QA
**Purpose:** Answer any compliance question (integrated with Claude API for production)  
**Examples:**
- "What is CC6.1?"
- "How do I set up MFA in AWS?"
- "What's the difference between SOC 2 Type I and Type II?"
- "How often should we review IAM permissions?"

---

## 🚀 Getting Started

### Installation & Setup

1. **Install backend dependencies:**
```bash
cd soc2-analyzer/backend
pip install -r requirements.txt
npm install
```

2. **Update Node version if needed:**
Pramanik AI uses `spawn` for Python subprocess execution, which requires Node.js 14+
```bash
node --version  # Should be v14.0.0 or higher
```

3. **Start the backend server:**
```bash
npm start
# or
node server.js
# Should see: SOC2 Analyzer backend running on port 3001
# Pramanik AI modes available at /api/pramanik/
```

4. **In another terminal, start the frontend:**
```bash
cd soc2-analyzer/frontend
npm install
npm run dev
# Should see: http://localhost:5173
```

5. **Access Pramanik AI:**
- Open http://localhost:5173
- Look for the "Pramanik AI" navigation option (or add it to your LandingPage)
- Or navigate directly via URL (add navigation)

---

## 📡 API Endpoints

All endpoints are at `http://localhost:3001/api/pramanik/`

### 1. Gap Analysis
```bash
POST /api/pramanik/gap-analysis
Content-Type: application/json

{
  "mfa_enforced": true,
  "cloudtrail_enabled": false,
  "s3_public_access": false,
  "public_s3_buckets": [],
  "rds_encryption": true,
  "tls_enabled": true,
  "security_groups_configured": true,
  "least_privilege_applied": false,
  "cloudwatch_enabled": true
}
```

**Response:**
```json
{
  "mode": "Gap Analysis",
  "timestamp": "2024-01-15T10:30:00Z",
  "result": {
    "score": 78.8,
    "passed": 26,
    "total": 33,
    "critical_failures": [...],
    "high_failures": [...],
    "medium_failures": [...],
    "passed_controls": ["CC6.1", "CC7.2", ...]
  }
}
```

### 2. Policy Generator
```bash
POST /api/pramanik/policy
Content-Type: application/json

{
  "policyType": "Incident Response Policy",
  "companyName": "Acme SaaS Inc",
  "stackTech": "AWS, Supabase, GitHub",
  "policyOwner": "Chief Security Officer"
}
```

**Response:**
```json
{
  "mode": "Policy Generator",
  "policyType": "Incident Response Policy",
  "companyName": "Acme SaaS Inc",
  "policy": "[Complete policy document markdown]"
}
```

### 3. Ghost Audit
```bash
POST /api/pramanik/ghost-audit
Content-Type: application/json

{}
```

**Response:**
```json
{
  "mode": "ComplianceGhost Red Team Audit",
  "auditorMode": "ACTIVE",
  "challenges": [
    {
      "severity": "Critical",
      "question": "You claim MFA is enforced...",
      "probing": "Testing if MFA is truly mandatory..."
    }
  ],
  "overallAuditRisk": "HIGH"
}
```

### 4. Vendor Inheritance
```bash
POST /api/pramanik/vendor-inheritance
Content-Type: application/json

{
  "vendors": ["AWS", "Stripe", "Supabase", "GitHub"]
}
```

### 5. Breach Analysis
```bash
POST /api/pramanik/breach-analysis
Content-Type: application/json

{
  "breachName": "LastPass 2022",
  "userConfig": { /* gap analysis config */ }
}
```

### 6. Certification Pathfinder
```bash
POST /api/pramanik/certification-path
Content-Type: application/json

{
  "customers": "US Enterprise SaaS",
  "tech_stack": "AWS, React, Node.js",
  "team_size": 10,
  "timeline": "6 months"
}
```

---

## 📊 Integration with Dashboard

To add Pramanik AI to your main navigation, update your Dashboard or LandingPage to include:

```jsx
<button onClick={() => navigate('/pramanik')}>
  🔐 Pramanik AI
</button>
```

Or in the UploadPage:
```jsx
<div className="navigation-buttons">
  <button onClick={() => setPage('pramanik')}>
    Compliance Co-Pilot
  </button>
</div>
```

---

## 🔧 Architecture

```
Backend:
├── pramanik_ai.py          # Python AI engine (all 7 modes)
│   ├── GapAnalyzer
│   ├── PolicyGenerator
│   ├── ComplianceGhost
│   ├── TrustDNA
│   ├── ComplianceObituary
│   └── CompliancePathfinder
├── routes/pramanik.js       # Express API routes
└── server.js                # Main Express app

Frontend:
├── components/PramanikAI.jsx
├── components/PramanikAI.css
└── App.jsx                  # Integration point
```

---

## 🎓 Usage Examples

### Example 1: New SaaS Startup (3 weeks into existence)
```
1. Use Gap Analysis to check their AWS setup
   → Find: No MFA, CloudTrail off, S3 public
   → Score: 18% compliance

2. Use Pathfinder to get roadmap
   → Recommend: SOC 2 Type II in 6 months

3. Use Policy Generator to create Access Control Policy
   → Gives them what to do

4. Use Ghost Audit to stress-test their approach
   → Find gaps in evidence before real auditor

5. Use Vendor Inheritance to see what AWS/Stripe cover
   → Identify what they directly own
```

### Example 2: Series A Company (raising from US VCs)
```
1. Run Gap Analysis on current AWS/GCP setup
   → Customer: "We need to be SOC 2 certified for deals"

2. Run Pathfinder for Series A profile
   → Identify SOC 2 Type II + ISO 27001 path

3. Generate all 10 compliance policies
   → Use as basis for documentation

4. Use Breach Analysis on recent industry events
   → Ensure you're not exposed to similar attacks

5. Use Ghost Audit repeatedly
   → Prepare for real auditor challenge questions
```

### Example 3: B2B2C Platform (regulated customers)
```
1. Gap Analysis on existing infrastructure
   → Discover gaps in monitoring, incident response

2. Generate Incident Response Policy specific to your stack
   → Include Stripe-specific data breach procedures

3. 6-month Pathfinder roadmap
   → Hit SOC 2 Type II milestone for customer deals

4. Vendor Inheritance analysis
   → What AWS/Stripe/Twilio inherit vs what you own

5. Monthly Ghost Audits
   → Continuous compliance validation
```

---

## 🚨 Limitations & Future Enhancements

### Current
- Policy templates are 80% complete (require company-specific customization)
- Ghost Audit uses pre-defined questions (could be LLM-enhanced)
- General QA mode requires Claude API integration
- Breach database has 5 known breaches (could expand)

### Coming Soon
- Real-time AWS Config scanning (automated gap analysis)
- Integration with external LLM (Claude/GPT-4) for custom questions
- Audit report generation (PDF export of gap analysis)
- Control implementation tracking (record remediation progress)
- Vendor management dashboard (track DPA expiration, SOC 2 renewal)
- Incident response playbook builder (create custom playbooks)
- Training module for employees

---

## 📞 Support

### Troubleshooting

**Problem:** Port 3001 already in use
```bash
# Kill process using port 3001
# macOS/Linux:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Problem:** Python subprocess errors
```bash
# Ensure Python is in PATH
python --version

# Ensure pramanik_ai.py is in backend directory
ls backend/pramanik_ai.py
```

**Problem:** CORS errors
- Ensure backend server is running
- Ensure frontend is accessing `http://localhost:3001/api/pramanik/`

---

## 📝 Next Steps

1. **Generate your first policy** → Use Policy Generator for Access Control Policy
2. **Run Gap Analysis** → Check your current AWS configuration
3. **Get your roadmap** → Use Pathfinder for certification timeline
4. **Ghost Audit yourself** → Prepare for real auditor conversations
5. **Track progress** → Document remediation of each gap

---

**Built by Pramanik AI — Your SOC 2 Compliance Co-Pilot**  
*For Indian SaaS startups scaling to enterprise customers*
