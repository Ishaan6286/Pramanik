const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

/**
 * Helper: Execute Python function from pramanik_ai.py
 */
function executePython(functionName, args) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'pramanik_ai.py');
    const python = spawn('python', [pythonScript, '--function', functionName, '--args', JSON.stringify(args)]);
    
    let output = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python error: ${error}`));
      } else {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          resolve(output);
        }
      }
    });
  });
}

/**
 * Synchronous Python execution (imports module directly)
 * Used for better performance and reliability
 */
function executePythonSync(mode, payload) {
  // This will be called via Python subprocess
  // Return structured JSON response
  const response = {
    mode: mode,
    timestamp: new Date().toISOString(),
    data: payload
  };
  return response;
}

// ═══════════════════════════════════════════════════
// MODE 1: GAP ANALYSIS — /api/pramanik/gap-analysis
// ═══════════════════════════════════════════════════

router.post('/gap-analysis', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'No configuration provided' });
    }

    // Call Python gap analyzer
    const result = await new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', `
import sys
sys.path.insert(0, '${path.join(__dirname, '..')}')
from pramanik_ai import run_gap_analysis
import json
config = ${JSON.stringify(config).replace(/"/g, '\\"')}
result = run_gap_analysis(config)
print(json.dumps(result, indent=2))
`]);

      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python error: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    res.json({
      mode: "Gap Analysis",
      timestamp: new Date().toISOString(),
      result: result,
      nextSteps: [
        "Review critical failures first",
        "Ask for policy generation to address each failure",
        "Type 'ghost audit' to stress-test this report"
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// MODE 2: POLICY GENERATOR — /api/pramanik/policy
// ═══════════════════════════════════════════════════

router.post('/policy', async (req, res) => {
  try {
    const { policyType, companyName, stackTech, policyOwner } = req.body;
    
    if (!policyType || !companyName) {
      return res.status(400).json({ error: 'policyType and companyName are required' });
    }

    // Call Python policy generator
    const result = await new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', `
import sys
sys.path.insert(0, '${path.join(__dirname, '..')}')
from pramanik_ai import run_policy_generator
policy_type = "${policyType}"
company_name = "${companyName}"
stack_tech = "${stackTech || ''}"
policy_owner = "${policyOwner || 'Security Officer'}"
result = run_policy_generator(policy_type, company_name, stack_tech, policy_owner)
import json
print(json.dumps({"policy": result}, indent=2))
`]);

      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python error: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    res.json({
      mode: "Policy Generator",
      timestamp: new Date().toISOString(),
      policyType: policyType,
      companyName: companyName,
      policy: result.policy,
      nextSteps: [
        "Customize policy specific to your team/processes",
        "Get Legal/Compliance approval",
        "Distribute to team",
        "Schedule annual review"
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// MODE 3: GHOST AUDIT — /api/pramanik/ghost-audit
// ═══════════════════════════════════════════════════

router.post('/ghost-audit', async (req, res) => {
  try {
    const report = req.body || {};

    // Call Python ghost auditor
    const result = await new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', `
import sys
sys.path.insert(0, '${path.join(__dirname, '..')}')
from pramanik_ai import run_ghost_audit
import json
result = run_ghost_audit()
print(json.dumps(result, indent=2))
`]);

      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python error: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    res.json({
      mode: "ComplianceGhost Red Team Audit",
      timestamp: new Date().toISOString(),
      auditorMode: "ACTIVE",
      adversarialLevel: "MAXIMUM",
      challenges: result.challenges,
      overallAuditRisk: result.overall_audit_risk,
      keyRisk: result.key_risk,
      advice: result.advice
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// MODE 4: TRUSTDNA — /api/pramanik/vendor-inheritance
// ═══════════════════════════════════════════════════

router.post('/vendor-inheritance', async (req, res) => {
  try {
    const { vendors } = req.body;
    
    if (!vendors || !Array.isArray(vendors)) {
      return res.status(400).json({ error: 'vendors array is required' });
    }

    // Call Python vendor analyzer
    const result = await new Promise((resolve, reject) => {
      const vendorStr = vendors.map(v => `"${v}"`).join(',');
      const python = spawn('python', ['-c', `
import sys
sys.path.insert(0, '${path.join(__dirname, '..')}')
from pramanik_ai import run_trustdna
import json
vendors = [${vendorStr}]
result = run_trustdna(vendors)
print(json.dumps(result, indent=2))
`]);

      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python error: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    res.json({
      mode: "TrustDNA Vendor Inheritance",
      timestamp: new Date().toISOString(),
      stack: vendors,
      result: result,
      nextSteps: [
        `You own ${result.gaps_count} controls fully`,
        "Request SOC 2 reports from vendors",
        "Execute Data Processing Agreements"
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// MODE 5: COMPLIANCE OBITUARY — /api/pramanik/breach-analysis
// ═══════════════════════════════════════════════════

router.post('/breach-analysis', async (req, res) => {
  try {
    const { breachName, userConfig } = req.body;
    
    if (!breachName) {
      return res.status(400).json({ error: 'breachName is required' });
    }

    // Call Python breach analyzer
    const result = await new Promise((resolve, reject) => {
      const userConfigStr = JSON.stringify(userConfig || {}).replace(/"/g, '\\"');
      const python = spawn('python', ['-c', `
import sys
sys.path.insert(0, '${path.join(__dirname, '..')}')
from pramanik_ai import run_compliance_obituary
import json
breach_name = "${breachName}"
user_config = ${userConfigStr}
result = run_compliance_obituary(breach_name, user_config)
print(json.dumps(result, indent=2))
`]);

      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python error: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    res.json({
      mode: "Compliance Obituary",
      timestamp: new Date().toISOString(),
      breach: result.breach,
      failureChain: result.failure_chain,
      preventionControls: result.prevention_controls,
      yourExposure: result.your_exposure || [],
      urgent: result.your_exposure && result.your_exposure.length > 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// MODE 6: PATHFINDER — /api/pramanik/certification-path
// ═══════════════════════════════════════════════════

router.post('/certification-path', async (req, res) => {
  try {
    const profile = req.body;
    
    if (!profile) {
      return res.status(400).json({ error: 'Company profile is required' });
    }

    // Call Python pathfinder
    const result = await new Promise((resolve, reject) => {
      const profileStr = JSON.stringify(profile).replace(/"/g, '\\"');
      const python = spawn('python', ['-c', `
import sys
sys.path.insert(0, '${path.join(__dirname, '..')}')
from pramanik_ai import run_pathfinder
import json
profile = ${profileStr}
result = run_pathfinder(profile)
print(json.dumps(result, indent=2))
`]);

      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python error: ${error}`));
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    res.json({
      mode: "CompliancePathfinder",
      timestamp: new Date().toISOString(),
      recommended: result.recommended,
      reasoning: result.reasoning,
      timeline: result.timeline,
      estimatedEffort: result.estimated_effort,
      priorityControls: result.priority_controls
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// GENERAL QA — /api/pramanik/ask
// ═══════════════════════════════════════════════════

router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    // For now, return a response indicating this would be handled by an LLM
    // In production, integrate with Claude, GPT, etc.
    res.json({
      mode: "General QA",
      timestamp: new Date().toISOString(),
      question: question,
      response: "This mode would integrate with Claude API for general compliance questions",
      nextSteps: ["Integrate with Anthropic Claude API", "Route complex questions to LLM"]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// CHATBOT — /api/pramanik/chat
// ═══════════════════════════════════════════════════

const CHATBOT_KNOWLEDGE = {
  // CC (Control Environment) - TIER 1 CONTROLS
  "cc1.1": "CC1.1 — Entity commits to competence, including knowledge, skills, capabilities in areas of responsibility. Implement: Document role requirements in job descriptions, conduct annual competency assessments, maintain training records, hire certified personnel (e.g., CISSP, AWS Certified).",
  
  "cc1.2": "CC1.2 — Entity holds individuals accountable for their responsibilities. Implement: Define roles and responsibilities (RACI matrix), document in procedure manuals, track performance reviews, link compensation to security compliance, establish escalation procedures.",
  
  "cc1.3": "CC1.3 — Entity specifies objectives and responsibilities and holds individuals accountable. Implement: Set security KPIs (MFA adoption %, audit findings closed rate, training completion %), review quarterly in management meetings, publish to entire organization.",
  
  "cc1.4": "CC1.4 — Entity demonstrates a commitment to competence and holds individuals accountable. Implement: Budget for security training (SOC 2, AWS, incident response), sponsor certifications, conduct annual security awareness training, track completion rates.",
  
  "cc2.1": "CC2.1 — Entity obtains information about external requirements/expectations. Implement: Subscribe to compliance updates (CIS benchmarks, AWS security advisories), monitor regulations relevant to industry, join compliance communities, establish regulatory tracking process.",
  
  "cc2.2": "CC2.2 — Entity investigates external requirements and incorporates into compliance obligations. Implement: Document applicable regulations (SOC 2, HIPAA, GDPR, state breach laws), assign ownership to compliance officer, create compliance roadmap, update quarterly.",
  
  "cc3.1": "CC3.1 — Entity specifies objectives with sufficient clarity to enable design and implementation of infrastructure. Implement: Define security objectives (uptime %, encryption coverage, access control maturity), link to business strategy, communicate to teams, measure quarterly.",
  
  "cc4.1": "CC4.1 — Entity obtains or generates, uses and communicates relevant, quality information regarding operation of internal controls. Implement: Automated monitoring dashboards, weekly compliance reports, security metrics dashboards, escalation alerts, regular management reviews.",
  
  "cc4.2": "CC4.2 — Entity internally communicates information, including responsibilities, to enable personnel to execute their duties. Implement: Security documentation wiki, runbooks for incident response, change management process, incident notification procedures, quarterly security emails.",
  
  // CC5 - RISK ASSESSMENT
  "cc5.1": "CC5.1 — Entity specifies objectives and identifies potential risks to achieving them. Implement: Quarterly risk assessment workshops, identify threats (unauthorized access, data loss, malware), document in risk register, assign likelihood/impact scoring.",
  
  "cc5.2": "CC5.2 — Entity considers potential for fraud in assessing risks. Implement: Identify insider threats, conduct background checks, segregate duties in critical processes, implement approval workflows, monitor financial transactions.",
  
  // CC6 - LOGICAL & PHYSICAL ACCESS (MOST CRITICAL FOR SOC 2)
  "cc6.1": "CC6.1 — Logical Access. Entity restricts logical and physical access to protect assets against unauthorized access. KEY CONTROL. Implementation steps: 1) Enable MFA on all IAM users (Console → IAM → Users → Security credentials → Assign MFA device), 2) Implement password policies (minimum 14 chars, complexity), 3) Configure security groups (restrict to least-privilege IPs), 4) Use IAM roles for applications (never embed credentials), 5) Quarterly access reviews.",
  
  "cc6.2": "CC6.2 — Entity grants access based on authority model and principle of least privilege. Implement: Use IAM role hierarchy, implement resource-based policies for S3/Lambda, use resource tags for access control, quarterly access reviews with UAR (User Access Reviews), remove unused permissions via IAM Access Analyzer.",
  
  "cc6.3": "CC6.3 — Entity restricts access to assets and associated facilities by job function and need. Implement: Document job functions (Developer, DevOps, Security), create role-to-permission mapping matrix, implement role-based access control (RBAC), segregate duties (who can deploy vs who can approve), regular reviews with managers.",
  
  "cc6.4": "CC6.4 — Entity restricts physical access to facilities and protected assets. Implement: Badge access control with logs, visitor sign-in procedures, restricted areas for servers/data centers, document physical access in spreadsheet/system, monthly reviews.",
  
  "cc6.5": "CC6.5 — Entity discontinues logical and physical access to assets in a timely manner. Implement: Automated offboarding (disable IAM user within 1 hour), revoke VPN/SSH access, collect equipment (laptop, badge, keys), document in offboarding checklist, verify within 24 hours.",
  
  "cc6.6": "CC6.6 — Entity implements logical access security measures to protect against threats. Implement: VPC security groups (whitelist IPs), network ACLs, AWS WAF for web applications, use VPN for remote access, implement AWS GuardDuty for threat detection, maintain security group audit trail.",
  
  "cc6.7": "CC6.7 — User and service account management. Implement: 1) Disable inactive accounts (>90 days), 2) System accounts are non-human (use service roles), 3) Shared account prohibition (use IAM users instead), 4) Service account credential rotation quarterly, 5) Use temporary credentials (STS) over long-lived keys.",
  
  "cc6.8": "CC6.8 — Entity implements logical access security measures to identify and authenticate users. Implement: MFA for all users (especially admins), single sign-on (SSO) to AWS via identity provider, password managers (AWS Secrets Manager), biometric access for sensitive facilities, certificate-based auth for systems.",
  
  "cc6.9": "CC6.9 — Entity implements logical access security measures related to change management. Implement: Change approval workflow (separate requester/approver), implement GitHub branch protection (require PR reviews before merge), automated testing (security tests in CI/CD), rollback procedures.",
  
  // CC7 - MONITORING & LOGGING
  "cc7.1": "CC7.1 — Entity detects, identifies, investigates, and monitors system activities. Implementation: 1) Enable CloudTrail (all API calls logged), 2) Setup CloudWatch Logs (parse logs for anomalies), 3) Create custom metrics (failed login attempts, admin actions), 4) Implement alerting for high-risk activities.",
  
  "cc7.2": "CC7.2 — Entity monitors system events and records evidence. Implement: 1) CloudTrail with S3 storage (immutable via S3 Object Lock), 2) Enable log file validation, 3) Track: Who, What, When, Where with request ID tracing, 4) Retain logs ≥90 days (or per regulation), 5) Export to S3 for long-term storage, 6) Quarterly log reviews.",
  
  "cc7.3": "CC7.3 — Entity responds to identified security incidents. Implement: 1) Incident severity classification (Critical < 15 min response, High < 1 hour), 2) Create incident ticket in tracking system, 3) Isolate affected systems, 4) Preserve evidence (memory dumps, logs), 5) Root cause analysis within 48 hours, 6) Document remediation steps.",
  
  "cc7.4": "CC7.4 — Entity identifies, develops, and implements activities to recover from adverse events. Implement: 1) Disaster recovery playbook, 2) Backup strategy (RDS automated backups, EBS snapshots), 3) Recovery Point Objective (RPO) ≤1 hour, 4) Recovery Time Objective (RTO) ≤4 hours, 5) Quarterly backup restoration tests.",
  
  // CC8 - CHANGE MANAGEMENT
  "cc8.1": "CC8.1 — Entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes to infrastructure. Implement: 1) Change request form (describe change, business justification, risk assessment), 2) CAB (Change Advisory Board) approval for Production, 3) GitLab/GitHub branch protection (code review required), 4) Staging environment testing, 5) Rollback plan documented.",
  
  "cc8.2": "CC8.2 — Entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes. Implement: Changes recorded with: date, changed-by, change-from, change-to, business reason, approval date, approval-by. Store change log ≥1 year. Quarterly audit of changes for compliance.",
  
  "cc8.3": "CC8.3 — Entity authorizes, designs, develops, configures, documents, tests, approves, and implements IT changes. Implement: 1) Infrastructure-as-Code (Terraform) with peer review, 2) Automated deployments via CI/CD (GitHub Actions, GitLab CI), 3) Automated rollback on deployment failure, 4) Staging → Production promotion workflow, 5) All changes tracked in Git with audit trail.",
  
  // CC9 - VENDOR & THIRD-PARTY MANAGEMENT
  "cc9.1": "CC9.1 — Entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes. Implement: Vendor selection criteria should include SOC 2 compliance, security questionnaire responses, incident history, service level agreements (SLAs).",
  
  "cc9.2": "CC9.2 — Entity exercises due diligence over entities providing outsourced services and requires adherence to controls. Implement: 1) Request SOC 2 Type II report from vendor, 2) Execute Data Processing Agreement (DPA), 3) Review encryption and data residency, 4) Verify incident response procedures, 5) Document compliance status, 6) Annual reassessment.",
  
  // AVAILABILITY (A1)
  "a1.1": "A1.1 — Entity maintains, monitors, and evaluates the current processing capacity and use of IT resources. Implement: AWS CloudWatch dashboards (CPU, memory, disk usage), set alerts at 80% thresholds, auto-scaling for compute, quarterly capacity planning reviews, document baseline performance metrics.",
  
  "a1.2": "A1.2 — Entity authorizes, designs, and implements policies to achieve objectives related to the availability of information resources. Implement: 1) Uptime SLAs (target: ≥99.9%), 2) Multi-AZ architecture (distribute across availability zones), 3) Load balancing (ELB, ALB), 4) Database replication, 5) Incident response procedures, 6) Status page for customers.",
  
  // CONFIDENTIALITY (C1)
  "c1.1": "C1.1 — Entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives and responsibilities. Implement: Data classification scheme (Public, Internal, Confidential, Restricted), document what data exists and where it's stored, create data flow diagrams, establish access controls per classification level.",
  
  "c1.2": "C1.2 — Entity disposes of information to meet the related objectives. Implement: 1) Data retention policy (retain logs ≥90 days, customer data per contract), 2) Secure deletion (cryptographic erasure or overwrite 3+ passes), 3) Certificate of destruction for physical media, 4) Document disposal in audit log, 5) Quarterly destruction verification.",
  
  // PROCESSING INTEGRITY (PI1)
  "pi1.1": "PI1.1 — Entity authorizes, designs, develops, configures, documents, tests, approves, and implements system infrastructure. Implement: 1) Infrastructure-as-Code (Terraform) with version control, 2) Peer code review for all changes, 3) Automated security scanning (SAST/DAST), 4) Compliance testing (CIS AWS Foundations Benchmark), 5) Staging environment testing before Production.",
  
  // PRIVACY (P1)
  "p1.1": "P1.1 — Entity provides notice to data subjects about purposes for which personal information is obtained. Implement: 1) Privacy Policy placed on website/app, 2) Disclose: data collected, how it's used, retention period, third parties, 3) Obtain explicit consent (checkbox for GDPR), 4) Examples: email marketing opt-in, consent banner on website.",
  
  // COMMON TOPICS
  "mfa": "Multi-Factor Authentication (MFA) requires 2+ verification methods. AWS setup: 1) Go to IAM Console, 2) Select user or yourself, 3) Click 'Security credentials', 4) 'Assign MFA device', 5) Choose Virtual (Google Authenticator), U2F hardware key, or SMS (least secure), 6) Scan QR or enter secret, 7) Enter two consecutive codes. U2F keys preferred for admins (phishing-resistant). **ALL users must have MFA for SOC 2 compliance.**",
  
  "cloudtrail": "CloudTrail logs ALL AWS API calls (who, what, when, where, outcome). Enable it: 1) CloudTrail console, 2) 'Create trail' → select all regions, 3) S3 bucket for logs (enable encryption + versioning), 4) Enable log file validation (cryptographic proof logs not modified), 5) CloudWatch Logs integration for real-time alerts. **Critical for CC7.2 (monitoring).**",
  
  "s3 security": "S3 best practices: 1) Block public access (AWS Security Best Practice), 2) Enable default encryption (KMS customer-managed key preferred), 3) Enable versioning (recover deleted objects), 4) Configure access logging (track who accessed what), 5) Use bucket policies to restrict to specific roles/IPs, 6) Enable CORS only if required. **Public S3 buckets = critical SOC 2 finding.**",
  
  "encryption": "Data encryption layers: 1) At rest: RDS encryption enabled, S3 server-side encryption (KMS is strongest), EBS volume encryption, 2) In transit: HTTPS/TLS 1.2+, VPC endpoints to avoid internet routing, 3) Key management: AWS KMS (centralized key management), automatic key rotation annually. Database without encryption = RED finding in SOC 2 audit.",
  
  "soc 2": "SOC 2 framework: 33 controls across 5 criteria. CC (Control Environment, 9 criteria), A1 (Availability), C1 (Confidentiality), PI1 (Processing Integrity), P1 (Privacy). Type I (point-in-time audit). Type II (6-12 months evidence period). Cost: $50-100k for audit. Timeline: 12-18 weeks to preparation.",
  
  "iam": "AWS IAM (Identity Access Management) best practices: 1) Never use root account (no daily tasks), 2) Use IAM roles not user policies (roles are temporary credentials), 3) Apply least privilege (grant minimum permissions needed), 4) Enable MFA on all users, 5) Use temporary credentials (STS assume-role), 6) Enable CloudTrail to log all IAM activity, 7) Quarterly access reviews to remove unused permissions.",
  
  "least privilege": "Least privilege (PoLP): Grant ONLY minimum permissions needed for task. Example: Developer needs S3:GetObject on prod-data bucket (not S3:* on all buckets). Implement: Role-based access control (RBAC), resource tags for fine-grained control, regular IAM Access Analyzer scans to identify over-permissioned users, quarterly access reviews.",
  
  "compliance roadmap": "SOC 2 implementation timeline: Months 1-2 (Implement core controls: MFA, CloudTrail, security groups, IAM). Months 3-4 (Write/update 10 policies, collect evidence, perform gap analysis). Months 5-6 (External auditor kickoff, evidence review, remediation). Estimated 60-100 hours total effort vs 180+ hours without Pramanik.",
  
  "incident response": "Incident response process: 1) Detection (CloudTrail alerts, customer report, security monitoring), 2) Response (page on-call, create ticket, isolate systems), 3) Investigation (determine scope, root cause, affected data), 4) Remediation (patch vulnerability, reset credentials, restore backups), 5) Post-incident review (prevent recurrence). **Critical incidents: <15 min response SLA.**",
  
  "vendor management": "Vendor assessment checklist: 1) Request vendor's SOC 2 Type II report, 2) Review audit scope (did they cover relevant controls?), 3) Execute Data Processing Agreement (DPA) if they handle data, 4) Verify: encryption, incident response SLA, data residency, backup procedures, 5) Document compliance status in register, 6) Annual reassessment (or per contract).",
  
  "breach prevention": "Breach prevention layers: 1) Authentication (MFA mandatory), 2) Access control (least privilege IAM roles), 3) Monitoring (CloudTrail, CloudWatch alarms), 4) Network security (VPC, security groups, WAF), 5) Encryption (TLS in transit, KMS at rest), 6) Incident response (playbook, <15 min response), 7) Employee training (phishing awareness, social engineering). **Implements all CC6.x controls.**",
  
  "policy template": "SOC 2-required policies: 1) Access Control (who accesses what, approval process), 2) Authentication & Password (MFA mandatory, minimum 14 chars), 3) Data Encryption (encryption at rest & transit), 4) Incident Response (severity levels, response times, escalation), 5) Change Management (approval workflow, testing, rollback), 6) Vendor Management (assessment criteria, DPA), 7) Business Continuity (RTO/RPO targets, backup testing). Each policy: Purpose, Scope, Responsibility matrix, Numbered procedures, Enforcement action.",
  
  "audit preparation": "Pre-audit checklist: 1) Evidence collection (screenshots, logs, policy versions, signed approvals), 2) Access control testing (verify MFA on all users, check recent IAM changes), 3) Monitoring validation (CloudTrail enabled, logs retained ≥90 days), 4) Change testing (review 5 recent changes for approval/testing), 5) Incident response walkthrough (hypothetical incident scenario), 6) Remediation verification (all prior findings closed), 7) Staffing assessment (security team qualifications documented).",
  
  "evidence collection": "Evidence types: 1) Configuration evidence (screenshot of CloudTrail enabled, MFA device assignments), 2) Operational evidence (logs of access reviews, approval emails), 3) Policy evidence (signed policy documents with effective dates), 4) Testing evidence (change management test results, backup restoration test), 5) Training evidence (training attendance records with dates), 6) Incident evidence (incident tickets with timeline). Store in shared drive with audit folder structure.",
  
  "gap analysis": "Gap analysis: Compare current state vs SOC 2 controls. For each of 33 controls: assess current implementation (Not Started / In Progress / Implemented), identify gaps (missing evidence, non-compliant config), prioritize remediation. Example gap: No MFA enablement = High priority CC6.1 gap. Remediation: Deploy MFA this sprint, collect evidence, re-assess.",
  
  "cost estimate": "SOC 2 implementation costs: Personnel ~$40-60k (dedicated resource 4-6 months), Tools ~$5-10k (SIEM, password manager, identity provider), Audit fee ~$50-100k (depends on audit firm, company size). Total: $100-170k for first audit. Maintenance ~$20-30k/year. ROI: Customer trust, partnership requirements, competitive advantage.",
  
  "staffing": "SOC 2 staffing model: 1) Chief Information Security Officer (CISO) - overall compliance accountability, 2) Security Engineer - control implementation, monitoring, 3) Compliance Officer - evidence collection, documentation, audit coordination, 4) System Admin - infrastructure, access, vendor management, 5) Each role ~10-20% time allocation post-implementation. Part-time acceptable for startups.",
};


router.post('/chat', async (req, res) => {
  try {
    const message = req.body?.message || '';
    const conversationHistory = req.body?.conversationHistory || [];
    const fileCount = parseInt(req.body?.fileCount || 0);
    
    // Collect file metadata and content
    let fileContext = "";
    let fileDetails = [];
    
    if (fileCount > 0 && req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        if (file) {
          fileDetails.push({
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
          });
          
          // Build file context with actual content
          let fileInfo = `\n[FILE ATTACHED]: ${file.originalname}\n`;
          
          if (file.mimetype.startsWith("image/")) {
            // For images, convert to base64 for analysis
            const base64Content = file.buffer.toString('base64');
            fileInfo += `[IMAGE DATA - Base64]:${base64Content.substring(0, 200)}...[truncated for space]\n`;
            fileInfo += `[NOTE]: This is an image file that should be analyzed visually. Examine it carefully.`;
          } else if (file.mimetype.includes("application/pdf") || file.mimetype.includes("document") || file.mimetype.includes("word") || file.mimetype.includes("text")) {
            // For documents, try to extract text
            try {
              const textContent = file.buffer.toString('utf-8');
              fileInfo += `[DOCUMENT CONTENT]:\n${textContent.substring(0, 2000)}\n`;
              if (textContent.length > 2000) {
                fileInfo += `[... document continues, total length: ${textContent.length} characters]\n`;
              }
              fileInfo += `[NOTE]: This is a document. Use the extracted content to answer questions.`;
            } catch (e) {
              fileInfo += `[NOTE]: Document uploaded but couldn't extract text. File type: ${file.mimetype}`;
            }
          } else if (file.mimetype.startsWith("audio/")) {
            // For audio files
            fileInfo += `[AUDIO FILE]: ${file.originalname} (${file.size} bytes, format: ${file.mimetype})\n`;
            fileInfo += `[NOTE]: Audio file uploaded. Analyze the file name and metadata. If transcription is needed, ask the user to provide it.`;
          } else {
            // Generic file handling
            const content = file.buffer.toString('utf-8', 0, Math.min(1000, file.buffer.length));
            fileInfo += `[FILE CONTENT]:\n${content}...\n`;
          }
          
          fileContext += fileInfo;
        }
      }
    }
    
    // Combine message with file context
    const fullMessage = fileContext ? `${fileContext}\n\nUser Question: ${message}` : message;
    
    if (!fullMessage.trim()) {
      return res.status(400).json({ error: 'message or files required' });
    }

    // Try Deepseek first (ultimate RAG), fallback to local knowledge base
    try {
      const result = await new Promise((resolve, reject) => {
        const escapedMessage = fullMessage.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        const escapedHistory = JSON.stringify(conversationHistory || []).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        
        const python = spawn('python', ['-c', `
import sys
sys.path.insert(0, '${path.join(__dirname, '..')}')
from deepseek_service import chat_with_rag
import json
message = """${escapedMessage}"""
history = ${escapedHistory}
result = chat_with_rag(message, history)
print(json.dumps(result, indent=2))
`]);

        let output = '';
        let error = '';
        
        python.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        python.stderr.on('data', (data) => {
          error += data.toString();
        });
        
        python.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Deepseek error: ${error}`));
          } else {
            try {
              resolve(JSON.parse(output));
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      // Return Deepseek result
      return res.json({
        response: result.response,
        sources: result.sources || [],
        confidence: result.confidence,
        model: "deepseek-v3.2 (Multi-modal RAG)",
        files_processed: fileDetails,
        timestamp: new Date().toISOString(),
      });
    } catch (deepseekError) {
      console.log('Deepseek unavailable, falling back to local knowledge base:', deepseekError.message);
      
      // Fallback: Use local knowledge base
      const lowerMessage = message.toLowerCase();
      let response = null;

      // Check for exact or partial matches in knowledge base
      for (const [key, value] of Object.entries(CHATBOT_KNOWLEDGE)) {
        if (lowerMessage.includes(key)) {
          response = value;
          break;
        }
      }

      // If no match, provide helpful response
      if (!response) {
        // Check question type
        if (lowerMessage.includes("what") && lowerMessage.includes("cc")) {
          response =
            "I can help explain any SOC 2 control (CC1.1 through CC9.2). Please ask about a specific control, like 'What is CC6.1?' or 'Explain CC7.2'.";
        } else if (lowerMessage.includes("how")) {
          response =
            "I can provide step-by-step instructions for AWS security setup, compliance implementation, and policy creation. What specifically would you like to do?";
        } else if (lowerMessage.includes("why")) {
          response =
            "Good question! I can explain the reasoning behind SOC 2 controls and compliance requirements. What aspect interests you?";
        } else if (fileCount > 0) {
          response =
            `I've received ${fileDetails.length} file(s): ${fileDetails.map(f => f.name).join(", ")}. I can analyze these for compliance insights. Unfortunately, Deepseek is currently unavailable; please try again or ask a specific question about the files.`;
        } else {
          response =
            "I'm Pramanik AI, your SOC 2 compliance assistant. I can help with:\n\n• SOC 2 controls & criteria\n• AWS security setup (MFA, CloudTrail, encryption, IAM)\n• Compliance policies & procedures\n• Vendor assessment\n• Breach prevention\n• Audit preparation\n• Multi-modal analysis (documents, images, audio)\n\nTry asking 'What is CC6.1?' or 'How do I enable MFA?' or upload files for analysis.";
        }
      }

      res.json({
        response: response,
        model: "knowledge-base (fallback)",
        files_processed: fileDetails,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
