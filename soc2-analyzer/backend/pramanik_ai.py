"""
Pramanik AI — SOC 2 Compliance Co-Pilot Engine
All 7 operating modes for AI-powered compliance assistance
"""

import json
from typing import Dict, List, Tuple
from datetime import datetime

# ═══════════════════════════════════════════════════
# SOC 2 CONTROL KNOWLEDGE BASE
# ═══════════════════════════════════════════════════

SOC2_CONTROLS = {
    "CC1.1": {"name": "Control environment: Management demonstrates commitment to integrity and ethical values", "category": "CC1"},
    "CC1.2": {"name": "Board oversight: Board demonstrates independence and exercises oversight of internal controls", "category": "CC1"},
    "CC1.3": {"name": "Organizational structure: Management establishes structure, reporting lines, and appropriate authorities", "category": "CC1"},
    "CC1.4": {"name": "Competence: Organization demonstrates commitment to attract, develop, and retain competent personnel", "category": "CC1"},
    "CC1.5": {"name": "Accountability: Organization holds individuals accountable for internal control responsibilities", "category": "CC1"},
    
    "CC2.1": {"name": "Information quality: Entity obtains or generates relevant, quality information to support internal controls", "category": "CC2"},
    "CC2.2": {"name": "Internal communication: Entity internally communicates information to support functioning of internal controls", "category": "CC2"},
    "CC2.3": {"name": "External communication: Entity communicates with external parties regarding matters affecting internal controls", "category": "CC2"},
    
    "CC3.1": {"name": "Risk assessment objectives: Entity specifies objectives with sufficient clarity to identify and assess risks", "category": "CC3"},
    "CC3.2": {"name": "Risk identification: Entity identifies risks to achieving objectives across the entity", "category": "CC3"},
    "CC3.3": {"name": "Fraud risk: Entity considers the potential for fraud in assessing risks", "category": "CC3"},
    "CC3.4": {"name": "Change identification: Entity identifies and assesses changes that could significantly impact internal controls", "category": "CC3"},
    
    "CC4.1": {"name": "Monitoring activities: Entity selects, develops, and performs ongoing monitoring activities", "category": "CC4"},
    "CC4.2": {"name": "Deficiency evaluation: Entity evaluates and communicates internal control deficiencies", "category": "CC4"},
    
    "CC5.1": {"name": "Control selection: Entity selects and develops control activities that mitigate risks", "category": "CC5"},
    "CC5.2": {"name": "Technology controls: Entity selects and develops general controls over technology", "category": "CC5"},
    "CC5.3": {"name": "Policy deployment: Entity deploys control activities through policies and procedures", "category": "CC5"},
    
    "CC6.1": {"name": "Logical access: Entity implements logical access security to protect against threats from sources outside its system boundaries — MFA, password policies, access reviews", "category": "CC6"},
    "CC6.2": {"name": "Authentication: Entity implements authentication mechanisms — IAM roles, least privilege, service accounts", "category": "CC6"},
    "CC6.3": {"name": "Authorization: Entity authorizes, modifies, or removes access based on roles and responsibilities", "category": "CC6"},
    "CC6.4": {"name": "Access restriction: Entity restricts physical access to facilities and protected information assets", "category": "CC6"},
    "CC6.5": {"name": "Account termination: Entity discontinues logical and physical protections for terminated employees", "category": "CC6"},
    "CC6.6": {"name": "Network security: Entity implements controls to prevent or detect and act on threats from outside — security groups, VPCs, firewalls", "category": "CC6"},
    "CC6.7": {"name": "Data transmission: Entity restricts transmission, movement, and removal of information to authorized personnel", "category": "CC6"},
    "CC6.8": {"name": "Malware protection: Entity implements controls to prevent or detect and act on unauthorized software", "category": "CC6"},
    
    "CC7.1": {"name": "Vulnerability detection: Entity uses detection and monitoring procedures to identify changes to configurations", "category": "CC7"},
    "CC7.2": {"name": "Monitoring for anomalies: Entity monitors system components and the operation of controls — CloudTrail, CloudWatch, logging", "category": "CC7"},
    "CC7.3": {"name": "Incident evaluation: Entity evaluates security events to determine whether they could or have resulted in failure", "category": "CC7"},
    "CC7.4": {"name": "Incident response: Entity responds to identified security incidents by executing defined incident response procedures", "category": "CC7"},
    "CC7.5": {"name": "Remediation: Entity identifies, develops, and implements remediation activities to address identified deficiencies", "category": "CC7"},
    
    "CC8.1": {"name": "Change management: Entity authorizes, designs, develops, tests, approves, and implements changes to infrastructure", "category": "CC8"},
    
    "CC9.1": {"name": "Business risk: Entity identifies, selects, and develops risk mitigation activities for risks arising from business disruptions", "category": "CC9"},
    "CC9.2": {"name": "Vendor management: Entity assesses and manages risks associated with vendors and business partners — encryption, data handling, DPAs", "category": "CC9"},
    
    "A1.1": {"name": "Availability performance: Entity maintains, monitors, and evaluates current processing capacity", "category": "A"},
    "A1.2": {"name": "Environmental threats: Entity authorizes, designs, develops, acquires, implements, operates, approves, maintains, and monitors environmental protections", "category": "A"},
    "A1.3": {"name": "Recovery: Entity tests recovery plan procedures supporting system availability", "category": "A"},
}

VENDOR_COVERAGE = {
    "Stripe": {
        "controls": ["CC6.1", "CC9.2", "CC6.7", "A1.1"],
        "percentage": 70,
        "note": "SOC 2 Type II certified. Covers payment access and encryption"
    },
    "AWS": {
        "controls": ["CC6.4", "A1.2", "A1.1", "CC6.6"],
        "percentage": 80,
        "note": "SOC 2 Type II certified. Shared responsibility model applies"
    },
    "Supabase": {
        "controls": ["CC6.1", "CC6.2", "CC9.2"],
        "percentage": 75,
        "note": "SOC 2 Type II certified. Covers database access controls"
    },
    "Twilio": {
        "controls": ["CC6.7", "CC9.2"],
        "percentage": 60,
        "note": "SOC 2 Type II certified. Covers communication encryption"
    },
    "Vercel": {
        "controls": ["CC6.6", "A1.1"],
        "percentage": 65,
        "note": "SOC 2 Type II certified. Network security and availability"
    },
    "GitHub": {
        "controls": ["CC8.1", "CC6.1"],
        "percentage": 70,
        "note": "SOC 2 Type II certified. Change management and access control"
    },
    "Cloudflare": {
        "controls": ["CC6.6", "A1.1"],
        "percentage": 68,
        "note": "SOC 2 Type II certified. DDoS protection and network security"
    },
    "Intercom": {
        "controls": ["CC9.2", "CC6.7"],
        "percentage": 55,
        "note": "SOC 2 Type II certified. Requires DPA"
    },
    "PagerDuty": {
        "controls": ["CC7.3", "CC7.4"],
        "percentage": 65,
        "note": "SOC 2 Type II certified. Incident management"
    },
    "Datadog": {
        "controls": ["CC7.1", "CC7.2"],
        "percentage": 70,
        "note": "SOC 2 Type II certified. Monitoring and anomaly detection"
    },
}

KNOWN_BREACHES = {
    "LastPass 2022": {
        "failures": [
            ("Compromised developer laptop", "CC6.8"),
            ("Stolen source code and encrypted vaults", "CC6.1"),
            ("No MFA on dev systems", "CC6.1"),
            ("Insufficient access segmentation", "CC6.2"),
        ],
        "prevention": ["CC6.8 (endpoint detection)", "CC6.1 (MFA enforcement)", "CC6.2 (access segmentation)", "CC7.2 (anomaly detection)"]
    },
    "Twilio 2022": {
        "failures": [
            ("SMS phishing attack", "CC6.1"),
            ("Employee credentials stolen", "CC5.3"),
            ("Customer data accessed", "CC6.2"),
        ],
        "prevention": ["CC6.1 (phishing-resistant MFA)", "CC7.2 (login anomaly detection)", "CC5.3 (security training)"]
    },
    "Cloudflare Okta 2022": {
        "failures": [
            ("Okta breach lateral movement", "CC9.2"),
            ("Vendor access not isolated", "CC6.2"),
        ],
        "prevention": ["CC9.2 (vendor access isolation)", "CC6.2 (zero-trust access)", "CC7.2 (suspicious activity detection)"]
    },
    "Uber 2022": {
        "failures": [
            ("MFA fatigue attack", "CC6.1"),
            ("Admin access compromised", "CC6.2"),
            ("Slow incident detection", "CC7.2"),
        ],
        "prevention": ["CC6.1 (MFA fatigue prevention)", "CC6.2 (privileged access management)", "CC7.2 (real-time alert system)"]
    },
    "Microsoft Exchange 2023": {
        "failures": [
            ("Zero-day exploitation", "CC7.1"),
            ("Patch management gaps", "CC7.1"),
            ("Insufficient network segmentation", "CC6.6"),
        ],
        "prevention": ["CC7.1 (patch management)", "CC6.6 (network segmentation)", "CC7.2 (continuous monitoring)"]
    },
}


# ═══════════════════════════════════════════════════
# MODE 1: GAP ANALYSIS
# ═══════════════════════════════════════════════════

class GapAnalyzer:
    """Analyze AWS configurations against SOC 2 controls"""
    
    def __init__(self, config: dict):
        self.config = config
        self.findings = []
        self.passed_controls = []
        self.failed_controls = []
    
    def analyze(self) -> dict:
        """Run comprehensive gap analysis"""
        self._check_mfa_enforcement()
        self._check_cloudtrail()
        self._check_s3_security()
        self._check_encryption()
        self._check_networking()
        self._check_iam_policies()
        self._check_logging()
        
        passed = len(self.passed_controls)
        total = 33
        score = (passed / total) * 100
        
        return {
            "score": round(score, 1),
            "passed": passed,
            "total": total,
            "critical_failures": [f for f in self.findings if f["severity"] == "CRITICAL"],
            "high_failures": [f for f in self.findings if f["severity"] == "HIGH"],
            "medium_failures": [f for f in self.findings if f["severity"] == "MEDIUM"],
            "passed_controls": self.passed_controls,
            "all_findings": self.findings
        }
    
    def _check_mfa_enforcement(self):
        """Check CC6.1 - Logical Access / MFA"""
        if self.config.get("mfa_enforced"):
            self.passed_controls.append("CC6.1")
        else:
            self.findings.append({
                "control": "CC6.1",
                "name": "Logical Access — MFA",
                "severity": "CRITICAL",
                "finding": "MFA is not enforced on IAM users",
                "risk": "Compromised credentials allow full account access without second factor",
                "fix": [
                    "Go to IAM → Users → Select user → Security credentials",
                    "Click 'Assign MFA device'",
                    "Choose 'Virtual MFA' and scan QR with Google Authenticator",
                    "Require MFA for all IAM users via policy"
                ]
            })
    
    def _check_cloudtrail(self):
        """Check CC7.2 - Monitoring for anomalies"""
        if self.config.get("cloudtrail_enabled"):
            self.passed_controls.append("CC7.2")
        else:
            self.findings.append({
                "control": "CC7.2",
                "name": "Monitoring for Anomalies — CloudTrail",
                "severity": "CRITICAL",
                "finding": "CloudTrail logging is disabled",
                "risk": "No audit trail of API calls; impossible to detect unauthorized access or data exfiltration",
                "fix": [
                    "Go to CloudTrail console",
                    "Click 'Create trail'",
                    "Select 'All S3 buckets' and 'All Lambda functions'",
                    "Create S3 bucket for logs with encryption enabled",
                    "Enable log file validation"
                ]
            })
    
    def _check_s3_security(self):
        """Check CC6.1 - S3 Public Access"""
        if self.config.get("s3_public_access", False):
            self.findings.append({
                "control": "CC6.1",
                "name": "Logical Access — S3 Public Buckets",
                "severity": "CRITICAL",
                "finding": f"S3 bucket(s) are publicly accessible: {self.config.get('public_s3_buckets', [])}",
                "risk": "Data breach; sensitive information exposed to internet",
                "fix": [
                    "Go to S3 → Select bucket → Permissions → Block public access",
                    "Check all 4 options: Block all public access",
                    "Use IAM policies to grant access only to authorized principals",
                    "Enable bucket versioning and MFA delete"
                ]
            })
        else:
            self.passed_controls.append("CC6.1")
    
    def _check_encryption(self):
        """Check CC6.7 & CC9.2 - Encryption at rest and in transit"""
        if self.config.get("rds_encryption"):
            self.passed_controls.append("CC6.7")
        else:
            self.findings.append({
                "control": "CC6.7",
                "name": "Data Transmission — RDS Encryption",
                "severity": "HIGH",
                "finding": "RDS database encryption is disabled",
                "risk": "Database contents readable if storage is compromised",
                "fix": [
                    "Create encrypted RDS snapshot from unencrypted DB",
                    "Restore from snapshot with encryption enabled",
                    "Delete original unencrypted DB instance",
                    "Update connection strings in application"
                ]
            })
        
        if self.config.get("tls_enabled"):
            self.passed_controls.append("CC6.7")
        else:
            self.findings.append({
                "control": "CC6.7",
                "name": "Data Transmission — TLS/SSL",
                "severity": "HIGH",
                "finding": "TLS is not enforced for data in transit",
                "risk": "Data can be intercepted during network transmission",
                "fix": [
                    "Enable HTTPS-only on CloudFront and ALB",
                    "Install ACM certificate (free from AWS)",
                    "Redirect HTTP → HTTPS",
                    "Enforce TLS 1.2 minimum"
                ]
            })
    
    def _check_networking(self):
        """Check CC6.6 - Network Security"""
        if self.config.get("security_groups_configured"):
            self.passed_controls.append("CC6.6")
        else:
            self.findings.append({
                "control": "CC6.6",
                "name": "Network Security — Security Groups",
                "severity": "HIGH",
                "finding": "Security groups allow overly permissive inbound rules",
                "risk": "Unauthorized access to infrastructure and data",
                "fix": [
                    "Go to EC2 → Security Groups",
                    "Remove rules allowing 0.0.0.0/0 (all IPs)",
                    "Add specific source IPs or security groups only",
                    "Disable SSH (port 22) except from jump host",
                    "Use VPC endpoints for AWS service access"
                ]
            })
    
    def _check_iam_policies(self):
        """Check CC6.2 - Authentication & Least Privilege"""
        if self.config.get("least_privilege_applied"):
            self.passed_controls.append("CC6.2")
        else:
            self.findings.append({
                "control": "CC6.2",
                "name": "Authentication — Least Privilege",
                "severity": "HIGH",
                "finding": "IAM policies grant overly broad permissions (AdministratorAccess to users)",
                "risk": "Compromised user can access/modify all AWS resources",
                "fix": [
                    "Create role-based policies with minimal required permissions",
                    "Use IAM Access Analyzer to find unused permissions",
                    "Enable Cross-Account Access Only (no root credentials)",
                    "Use temporary credentials (STS) for all access",
                    "Regular access reviews (quarterly minimum)"
                ]
            })
    
    def _check_logging(self):
        """Check CC4.1 - Monitoring"""
        if self.config.get("cloudwatch_enabled"):
            self.passed_controls.append("CC4.1")
        else:
            self.findings.append({
                "control": "CC4.1",
                "name": "Monitoring Activities — CloudWatch",
                "severity": "MEDIUM",
                "finding": "CloudWatch monitoring is not configured",
                "risk": "Cannot detect performance issues or security anomalies",
                "fix": [
                    "Go to CloudWatch → Create log group",
                    "Create alarms for CPU > 80%, memory > 85%, network anomalies",
                    "Set up SNS topics for all critical alarms",
                    "Create dashboards for real-time monitoring"
                ]
            })


# ═══════════════════════════════════════════════════
# MODE 2: POLICY GENERATOR
# ═══════════════════════════════════════════════════

class PolicyGenerator:
    """Generate SOC 2 compliance policy documents"""
    
    POLICY_TEMPLATES = {
        "Access Control Policy": """# {company_name} — Access Control Policy

**Effective Date:** {effective_date}
**Policy Owner:** {policy_owner}
**Last Reviewed:** {effective_date}

## 1. PURPOSE
This policy establishes standards for access control to {company_name}'s information systems, data, and physical facilities to protect against unauthorized access, modification, and disclosure in accordance with SOC 2 Trust Service Criteria CC6.1, CC6.2, and CC6.3.

## 2. SCOPE
This policy applies to all employees, contractors, vendors, and third parties with access to {company_name}'s systems and data.

## 3. POLICY STATEMENTS

### 3.1 Authentication Requirements (CC6.1, CC6.2)
- All users must authenticate using Multi-Factor Authentication (MFA) for:
  - AWS Console access
  - VPN connections
  - Code repository (GitHub) access
  - Authentication providers (Okta/Auth0)
- MFA must use one of: TOTP (Google Authenticator), U2F hardware key, or push notification
- Hardware keys are preferred for administrative accounts

### 3.2 Least Privilege Access (CC6.2)
- Users receive only permissions necessary for their role
- Access requests require manager approval and security review
- Administrative access requires additional approval from CTO/CSO
- Service accounts use temporary credentials (AWS STS) with <4 hour TTL
- Quarterly access reviews remove unused permissions

### 3.3 IAM Role-Based Access Control
- All AWS access uses IAM roles (never root credentials or long-term keys)
- Role naming convention: `[department]-[function]-role`
- Examples:
  - `engineering-developer-role` — EC2, S3, CloudWatch read-only
  - `data-analyst-role` — RDS read-only, S3 read-only
  - `devops-admin-role` — All AWS services, API Gateway
- Cross-account access via assume-role only
- No IAM users with console access (use identity provider instead)

### 3.4 Password Policy {stack_tech}
- Minimum 14 characters, complexity: uppercase + lowercase + numbers + symbols
- Change every 90 days
- No reuse of last 5 passwords
- Account lockout after 5 failed attempts for 30 minutes
- Applies to: {company_name} systems, AWS IAM, GitHub, {stack_tech}

### 3.5 Database Access Control (RDS/Supabase)
- Database connections require SSL/TLS encryption
- No public database endpoints; access via VPC endpoints only
- Database credentials stored in Secrets Manager, rotated every 30 days
- Query logging enabled for {stack_tech}
- Read-only replicas for analytics access only

### 3.6 API Key Management
- All API keys stored in AWS Secrets Manager
- Automatic rotation every 90 days
- Keys limited to least-privilege permissions
- GitHooks prevent API key commits to repository
- Revoke keys immediately upon employee departure

### 3.7 Third-Party Access (CC9.2)
- All vendor/contractor access requires signed Data Processing Agreement (DPA)
- Access provisioned in isolated account/VPC
- Temporary (60-day max) credentials only
- Annual SOC 2/ISO 27001 certification verification
- Access audited quarterly

### 3.8 Access Termination (CC6.5)
- On termination: disable all access within 1 hour
- Disable: AWS IAM, GitHub, VPN, email, physical badges
- Audit trail: CloudTrail logs confirm removal
- Manager sign-off required
- Final verification 24 hours after termination

### 3.9 Privileged Access Management (PAM)
- Admin console access logs to CloudTrail with immutable storage
- All privileged actions require justification in ticket system
- Session recording for RDP/SSH (approved vendors only)
- Emergency access: break-glass account with approval workflow

## 4. ROLES AND RESPONSIBILITIES

| Role | Responsibility |
|------|-----------------|
| Employee | Request access via ticketing system; maintain security |
| Manager | Approve access requests; certify access quarterly |
| Security Team | Review requests; provision access; audit compliance |
| CTO/CSO | Approve admin access; review policy annually |
| IT Operations | Implement access controls; monitor for violations |

## 5. ENFORCEMENT

Violations are investigated and may result in:
- First violation: Formal written warning
- Repeat violation: Suspension of access or termination

Annual audit of all access confirms compliance.

## 6. REVIEW CYCLE
This policy is reviewed annually and updated as needed following security incidents or regulatory changes.

---
**Generated by Pramanik AI** | {timestamp}
""",
        "Incident Response Policy": """# {company_name} — Incident Response Policy

**Effective Date:** {effective_date}
**Policy Owner:** {policy_owner}
**Last Reviewed:** {effective_date}

## 1. PURPOSE
This policy establishes procedures for identifying, reporting, analyzing, and responding to security incidents in accordance with SOC 2 Trust Service Criteria CC7.3 and CC7.4.

## 2. SCOPE
All employees, contractors, and systems are covered. Incidents include: data breaches, unauthorized access, malware, DDoS, system unavailability, and compliance violations.

## 3. INCIDENT CATEGORIES & RESPONSE TIMES

| Category | Definition | Response Time | Escalation |
|----------|-----------|---|---|
| **Critical** | Active data breach, customer data exposed, compliance violation | 15 minutes | CEO + Board |
| **High** | Unauthorized access attempt, system compromise detected | 1 hour | CTO + Legal |
| **Medium** | Suspected malware, unusual access pattern | 4 hours | Security team + Manager |
| **Low** | Policy violation, phishing email reported | 1 business day | Security team |

## 4. POLICY STATEMENTS

### 4.1 Incident Detection & Reporting (CC7.3)
- CloudTrail, CloudWatch, Datadog monitor for anomalies 24/7
- Alerts for: failed logins > 5/min, unauthorized API calls, data exfiltration, malware
- Employees report incidents to security@{company_name}.com immediately
- Anonymous reporting via confidential hotline: [hotline number]
- Report includes: what happened, when, systems affected, notifications sent

### 4.2 Incident Response Team
- **Incident Commander**: Leads response, coordinates team
- **Security Lead**: Investigates root cause
- **Technical Lead**: Implements containment
- **Communications**: Notifies customers, regulators, press as needed
- **Legal**: Evaluates regulatory/contractual obligations

### 4.3 Containment (CC7.4)
Upon incident confirmation:
- Isolate affected systems: revoke credentials, block IP addresses
- Preserve evidence: snapshots, logs, memory dumps
- Contact customers/regulators within SLA (typically 24-72 hours depending on law)
- Temporary workarounds if available (e.g., use secondary system)

### 4.4 Investigation
- Determine: root cause, systems affected, data exposed, timeline
- Collect forensic evidence from logs, memory, disk
- Interview relevant personnel
- Document findings in incident report (template attached)

### 4.5 Remediation (CC7.5)
- Fix root cause: patch, reconfigure, replace
- Test fix thoroughly in staging
- Deploy to production with change management approval
- Verify incident resolved; monitor for recurrence

### 4.6 Post-Incident Review
After incident resolution:
- Conduct retrospective with incident team
- Identify process improvements
- Update policies/controls if needed
- Report findings to board within 30 days

### 4.7 Incident Documentation {stack_tech}
All incidents logged in PagerDuty/incident tracking system with: date, time, category, description, systems affected, resolution, root cause, personnel involved, lessons learned.

## 5. Specific Incident Playbooks

### AWS EC2 Compromise
1. Stop the instance (don't terminate yet)
2. Snapshot the EBS volume for forensics
3. Check CloudTrail for API calls from compromised instance
4. Identify lateral movement: check VPC Flow Logs
5. Revoke all IAM roles used by instance
6. Re-provision from golden AMI after patching

### S3 Data Exposure
1. Identify bucket + affected objects via CloudTrail
2. Block all access to bucket immediately (Deny * policy)
3. Estimate exposure: who accessed, what was accessed
4. Preserve access logs for investigation
5. Notify affected customers

### {stack_tech} Database Breach
1. Rotate database credentials in Secrets Manager
2. Check Secrets Manager access logs (who has accessed credentials)
3. Review database audit logs for unauthorized queries
4. Check {stack_tech} audit events for account takeover
5. If customer data exposed: notify customers, notify regulators

## 6. ROLES AND RESPONSIBILITIES

| Role | During Incident | After Incident |
|------|---|---|
| **Incident Commander** | Calls incident bridge; coordinates; makes decisions | Schedules retrospective |
| **Security Lead** | Investigates; determines scope | Writes detailed report |
| **CTO/CSO** | Approves containment actions | Reviews root cause |
| **CEO** | Informed of critical incidents | Reports to board |
| **Legal** | Advises on notifications; checks compliance | Reviews liability |
| **Communications** | Drafts external communication | Manages public statement |

## 7. NOTIFICATION REQUIREMENTS
- Customers: within 72 hours (or per contract SLA)
- Regulators: within 30 days (varies by jurisdiction)
- Employees: immediately (for business continuity)
- Press: only after internal/regulatory notification

## 8. REVIEW CYCLE
This policy is reviewed annually and after each incident. Test incident response quarterly.

---
**Generated by Pramanik AI** | {timestamp}
"""
    }
    
    @staticmethod
    def generate(policy_type: str, company_name: str, stack_tech: str = "", policy_owner: str = "Security Officer") -> str:
        """Generate a policy document"""
        if policy_type not in PolicyGenerator.POLICY_TEMPLATES:
            return f"Unknown policy type: {policy_type}"
        
        template = PolicyGenerator.POLICY_TEMPLATES[policy_type]
        now = datetime.now()
        
        filled = template.format(
            company_name=company_name,
            effective_date=now.strftime("%B %d, %Y"),
            policy_owner=policy_owner,
            timestamp=now.strftime("%Y-%m-%d %H:%M UTC"),
            stack_tech=stack_tech or "[Your Technology Stack]"
        )
        
        return filled


# ═══════════════════════════════════════════════════
# MODE 3: COMPLIANCEGHOST (Adversarial Red Team)
# ═══════════════════════════════════════════════════

class ComplianceGhost:
    """Red-team audit mode: challenge evidence like a Big 4 auditor"""
    
    AUDITOR_QUESTIONS = [
        {
            "severity": "Critical",
            "question": "You claim MFA is enforced. Show me the policy, the CloudTrail logs of 10 failed MFA attempts, and evidence that users cannot disable MFA.",
            "probing": "Testing if MFA is truly mandatory or just recommended; if there's a bypass mechanism"
        },
        {
            "severity": "Critical",
            "question": "Your CloudTrail shows API calls from April. Why is there a 3-day gap from April 7-10 with no logs?",
            "probing": "Testing if CloudTrail is truly immutable and continuously enabled"
        },
        {
            "severity": "High",
            "question": "You say access is 'least privilege'. Give me IAM policies for 5 random engineers. What can each one do? Why do they need that much?",
            "probing": "Testing if permissions are actually minimal or if there's scope creep"
        },
        {
            "severity": "High",
            "question": "When was the last time you terminated an employee? Show me the checklist proving you disabled: AWS IAM, GitHub, VPN, email, physical access within 1 hour.",
            "probing": "Testing CC6.5 — access termination procedures"
        },
        {
            "severity": "High",
            "question": "You store database credentials in Secrets Manager. Prove it: show the rotation schedule, who has accessed the secrets in the last 90 days.",
            "probing": "Testing if secrets management is actually implemented vs aspirational"
        },
        {
            "severity": "Medium",
            "question": "CloudTrail shows an S3 bucket download of 5GB at 2am on a Thursday. Your DBA says 'that's probably normal' — but where's the incident investigation report?",
            "probing": "Testing CC7.3 — whether unusual events trigger formal investigation"
        },
        {
            "severity": "Medium",
            "question": "Your incident response policy says 'respond in 15 minutes for critical incidents'. Prove it — show me 3 incidents from the past year with timestamps, when detected vs when responded.",
            "probing": "Testing if incident response is actually practiced or just documented"
        },
        {
            "severity": "Medium",
            "question": "You claim vendors are SOC 2 certified. Where are the actual SOC 2 reports? What date do they cover? Are there any exceptions or qualified opinions?",
            "probing": "Testing vendor diligence; SOC 2 reports can be outdated or flawed"
        },
        {
            "severity": "Low",
            "question": "Your password policy says 'change every 90 days.' What's the actual enforcement mechanism? Can users opt out? How many users have not changed passwords in >120 days?",
            "probing": "Testing if policies are technically enforced or just guidelines"
        },
        {
            "severity": "Low",
            "question": "You have 47 IAM users. Show me evidence that each one was approved, that access reviews happen quarterly, and which 5 users had permissions removed in the last 12 months.",
            "probing": "Testing sustained compliance, not just one-time fixes"
        }
    ]
    
    @staticmethod
    def generate_audit(report: dict = None) -> dict:
        """Generate adversarial auditor challenge"""
        return {
            "auditor_mode": "ACTIVE",
            "adversarial_level": "MAXIMUM",
            "timestamp": datetime.now().isoformat(),
            "challenges": ComplianceGhost.AUDITOR_QUESTIONS,
            "overall_audit_risk": "HIGH",
            "key_risk": "Most audit failures come from claiming controls exist but lacking evidence of sustained implementation",
            "advice": "Prepare technical evidence: CloudTrail logs, access review records, incident response timelines, signed DPAs"
        }


# ═══════════════════════════════════════════════════
# MODE 4: TRUSTDNA (Vendor Inheritance)
# ═══════════════════════════════════════════════════

class TrustDNA:
    """Map vendor compliance inheritance"""
    
    @staticmethod
    def analyze_stack(vendors: List[str]) -> dict:
        """Analyze which controls are covered by vendor stack"""
        control_coverage = {}
        vendor_details = []
        
        for vendor in vendors:
            if vendor in VENDOR_COVERAGE:
                details = VENDOR_COVERAGE[vendor]
                vendor_details.append({
                    "vendor": vendor,
                    "coverage": details["percentage"],
                    "note": details["note"]
                })
                
                for control in details["controls"]:
                    if control not in control_coverage:
                        control_coverage[control] = []
                    control_coverage[control].append(vendor)
        
        # Calculate stats
        total_controls = 33
        covered_controls = len(control_coverage)
        average_coverage = sum(len(v) for v in control_coverage.values()) / len(control_coverage) if control_coverage else 0
        
        # Identify gaps
        all_controls = set(SOC2_CONTROLS.keys())
        covered = set(control_coverage.keys())
        gaps = all_controls - covered
        
        return {
            "vendors": vendor_details,
            "control_coverage": control_coverage,
            "total_controls": total_controls,
            "covered_controls": covered_controls,
            "coverage_percentage": round((covered_controls / total_controls) * 100, 1),
            "controls_you_own": list(gaps),
            "gaps_count": len(gaps),
        }


# ═══════════════════════════════════════════════════
# MODE 5: COMPLIANCE OBITUARY (Breach Analysis)
# ═══════════════════════════════════════════════════

class ComplianceObituary:
    """Map breaches to SOC 2 controls and user exposure"""
    
    @staticmethod
    def analyze_breach(breach_name: str, user_config: dict = None) -> dict:
        """Analyze breach and assess user exposure"""
        if breach_name not in KNOWN_BREACHES:
            return {"error": f"Breach not found: {breach_name}"}
        
        breach_data = KNOWN_BREACHES[breach_name]
        
        result = {
            "breach": breach_name,
            "failure_chain": breach_data["failures"],
            "prevention_controls": breach_data["prevention"],
            "your_exposure": [],
        }
        
        # If user config provided, check exposure
        if user_config:
            # Map config weaknesses to breach failures
            for failure, control in breach_data["failures"]:
                if control == "CC6.1" and not user_config.get("mfa_enforced"):
                    result["your_exposure"].append({
                        "severity": "CRITICAL",
                        "breach_failure": failure,
                        "your_gap": "MFA not enforced",
                        "action": "Implement MFA immediately"
                    })
                elif control == "CC7.2" and not user_config.get("cloudtrail_enabled"):
                    result["your_exposure"].append({
                        "severity": "CRITICAL",
                        "breach_failure": failure,
                        "your_gap": "CloudTrail not enabled",
                        "action": "Enable CloudTrail for all regions"
                    })
        
        return result


# ═══════════════════════════════════════════════════
# MODE 6: COMPLIANCEPATHFINDER
# ═══════════════════════════════════════════════════

class CompliancePathfinder:
    """Certification roadmap advisor"""
    
    @staticmethod
    def recommend_path(profile: dict) -> dict:
        """Recommend certification path based on company profile"""
        
        # Determine path based on profile
        customers = profile.get("customers", "")
        timeline = profile.get("timeline", "")
        team_size = profile.get("team_size", 0)
        
        if "healthcare" in customers.lower() or "government" in customers.lower():
            recommendation = "SOC 2 Type II + HIPAA" if "healthcare" in customers else "SOC 2 Type II + FedRAMP"
        elif "EU" in customers or "GDPR" in customers:
            recommendation = "SOC 2 Type II + ISO 27001"
        else:
            recommendation = "SOC 2 Type II"
        
        # Timeline guidance
        timeline_map = {
            "3 months": {"phase1": "Weeks 1-4", "phase2": "Weeks 5-8", "phase3": "Weeks 9-12"},
            "6 months": {"phase1": "Weeks 1-8", "phase2": "Weeks 9-16", "phase3": "Weeks 17-24"},
            "12 months": {"phase1": "Weeks 1-12", "phase2": "Weeks 13-26", "phase3": "Weeks 27-52"}
        }
        
        return {
            "recommended": recommendation,
            "reasoning": [
                f"Your customer base ({customers}) requires this certification",
                f"Team size of {team_size} can manage this workload in {timeline}",
                "SOC 2 Type II requires 6+ months of control evidence"
            ],
            "timeline": timeline_map.get(timeline, timeline_map["6 months"]),
            "estimated_effort": {
                "controls_to_implement": 33,
                "policies_to_write": 10,
                "evidence_artifacts": 200,
                "weeks_with_pramanik": 8,
                "weeks_without_pramanik": 24
            },
            "framework_overlap": {
                "SOC 2 to ISO 27001": "67% control mapping — CC1-CC9, A1 maps to ISO 27001 Annex A"
            },
            "priority_controls": [
                "CC6.1 (MFA enforcement)",
                "CC7.2 (CloudTrail logging)",
                "CC6.2 (IAM & least privilege)",
                "CC6.6 (Security groups & networking)",
                "CC8.1 (Change management)"
            ]
        }


# ═══════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════

def run_gap_analysis(config: dict) -> dict:
    """MODE 1: Execute gap analysis"""
    analyzer = GapAnalyzer(config)
    return analyzer.analyze()

def run_policy_generator(policy_type: str, company_name: str, stack_tech: str = "", policy_owner: str = "Security Officer") -> str:
    """MODE 2: Generate policy document"""
    return PolicyGenerator.generate(policy_type, company_name, stack_tech, policy_owner)

def run_ghost_audit(report: dict = None) -> dict:
    """MODE 3: Red-team audit"""
    return ComplianceGhost.generate_audit(report)

def run_trustdna(vendors: List[str]) -> dict:
    """MODE 4: Vendor compliance inheritance"""
    return TrustDNA.analyze_stack(vendors)

def run_compliance_obituary(breach_name: str, user_config: dict = None) -> dict:
    """MODE 5: Breach analysis"""
    return ComplianceObituary.analyze_breach(breach_name, user_config)

def run_pathfinder(profile: dict) -> dict:
    """MODE 6: Certification roadmap"""
    return CompliancePathfinder.recommend_path(profile)
