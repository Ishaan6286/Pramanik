"""
SOC 2 Trust Service Criteria — All 33 Controls
Based on AICPA 2017 Trust Service Criteria

Categories:
  CC1 — Control Environment (organization & governance)
  CC2 — Communication & Information
  CC3 — Risk Assessment
  CC4 — Monitoring Activities
  CC5 — Control Activities
  CC6 — Logical & Physical Access
  CC7 — System Operations
  CC8 — Change Management
  CC9 — Risk Mitigation
  A1  — Availability
  C1  — Confidentiality
  PI1 — Processing Integrity
  P1  — Privacy
"""


def run_all_checks(config: dict) -> dict:
    controls = [
        # CC1 — Control Environment
        check_cc1_1(config),
        check_cc1_2(config),
        # CC2 — Communication & Information
        check_cc2_1(config),
        check_cc2_2(config),
        # CC3 — Risk Assessment
        check_cc3_1(config),
        check_cc3_2(config),
        # CC4 — Monitoring
        check_cc4_1(config),
        check_cc4_2(config),
        # CC5 — Control Activities
        check_cc5_1(config),
        check_cc5_2(config),
        # CC6 — Access Controls
        check_cc6_1(config),
        check_cc6_2(config),
        check_cc6_3(config),
        check_cc6_6(config),
        check_cc6_7(config),
        check_cc6_8(config),
        # CC7 — System Operations
        check_cc7_1(config),
        check_cc7_2(config),
        check_cc7_3(config),
        check_cc7_4(config),
        # CC8 — Change Management
        check_cc8_1(config),
        # CC9 — Risk Mitigation
        check_cc9_1(config),
        check_cc9_2(config),
        # A1 — Availability
        check_a1_1(config),
        check_a1_2(config),
        check_a1_3(config),
        # C1 — Confidentiality
        check_c1_1(config),
        check_c1_2(config),
        # PI1 — Processing Integrity
        check_pi1_1(config),
        check_pi1_2(config),
        check_pi1_3(config),
        # P1 — Privacy
        check_p1_1(config),
        check_p1_2(config),
        check_p1_3(config),
    ]
    passed = sum(1 for c in controls if c["passed"])
    total = len(controls)
    score = round((passed / total) * 100)
    return {"results": controls, "score": score, "passed": passed, "total": total}


# ═══════════════════════════════════════════════════
# CC1 — CONTROL ENVIRONMENT
# ═══════════════════════════════════════════════════

def check_cc1_1(config):
    """Board/management oversight of security"""
    issues = []
    org = config.get("organization", {})
    if not org.get("security_officer_assigned"):
        issues.append("No designated security officer or CISO assigned")
    if not org.get("security_policy_exists"):
        issues.append("No formal information security policy documented")
    if not org.get("board_oversight"):
        issues.append("No board/management oversight of security program")
    return _result("CC1.1", "Security Governance", "Demonstrate commitment to security through governance structure", issues, "HIGH")


def check_cc1_2(config):
    """Accountability & personnel security"""
    issues = []
    org = config.get("organization", {})
    if not org.get("background_checks"):
        issues.append("Employee background checks not conducted")
    if not org.get("security_training"):
        issues.append("No security awareness training program for employees")
    if not org.get("acceptable_use_policy"):
        issues.append("No acceptable use policy for employees")
    return _result("CC1.2", "Personnel Security", "Ensure personnel accountability and security awareness", issues, "MEDIUM")


# ═══════════════════════════════════════════════════
# CC2 — COMMUNICATION & INFORMATION
# ═══════════════════════════════════════════════════

def check_cc2_1(config):
    """Internal communication of security"""
    issues = []
    org = config.get("organization", {})
    if not org.get("security_communication_plan"):
        issues.append("No internal security communication plan exists")
    if not org.get("incident_reporting_process"):
        issues.append("No process for employees to report security incidents")
    return _result("CC2.1", "Internal Communication", "Communicate security objectives and responsibilities internally", issues, "MEDIUM")


def check_cc2_2(config):
    """External communication"""
    issues = []
    org = config.get("organization", {})
    if not org.get("privacy_policy_published"):
        issues.append("No public privacy policy published")
    if not org.get("security_page_published"):
        issues.append("No public security practices page (trust center)")
    if not org.get("breach_notification_process"):
        issues.append("No data breach notification process documented")
    return _result("CC2.2", "External Communication", "Communicate security commitments to external parties", issues, "MEDIUM")


# ═══════════════════════════════════════════════════
# CC3 — RISK ASSESSMENT
# ═══════════════════════════════════════════════════

def check_cc3_1(config):
    """Risk identification"""
    issues = []
    if not config.get("trusted_advisor", {}).get("enabled"):
        issues.append("AWS Trusted Advisor not enabled — no automated risk identification")
    if not config.get("access_analyzer", {}).get("enabled"):
        issues.append("IAM Access Analyzer not enabled — cannot detect overly permissive policies")
    if not config.get("organization", {}).get("risk_register"):
        issues.append("No formal risk register maintained")
    return _result("CC3.1", "Risk Identification", "Identify and assess risks to security objectives", issues, "HIGH")


def check_cc3_2(config):
    """Fraud & threat assessment"""
    issues = []
    if not config.get("guardduty", {}).get("enabled"):
        issues.append("AWS GuardDuty not enabled — no threat/fraud detection")
    if not config.get("organization", {}).get("threat_model"):
        issues.append("No threat modeling or fraud risk assessment conducted")
    return _result("CC3.2", "Threat Assessment", "Assess fraud risk and emerging threats", issues, "HIGH")


# ═══════════════════════════════════════════════════
# CC4 — MONITORING ACTIVITIES
# ═══════════════════════════════════════════════════

def check_cc4_1(config):
    """Ongoing monitoring"""
    issues = []
    if not config.get("security_hub", {}).get("enabled"):
        issues.append("AWS Security Hub not enabled — no centralized security monitoring")
    if not config.get("config_service", {}).get("enabled"):
        issues.append("AWS Config not enabled — no configuration compliance monitoring")
    if not config.get("cloudwatch", {}).get("alarm_configured"):
        issues.append("No CloudWatch alarms configured for security events")
    return _result("CC4.1", "Security Monitoring", "Monitor controls and detect deficiencies", issues, "CRITICAL")


def check_cc4_2(config):
    """Deficiency remediation"""
    issues = []
    if not config.get("organization", {}).get("remediation_tracking"):
        issues.append("No system to track and remediate security findings")
    if not config.get("sns", {}).get("security_alerts_configured"):
        issues.append("No SNS alert topics for security notifications")
    return _result("CC4.2", "Remediation Tracking", "Track and remediate identified deficiencies", issues, "MEDIUM")


# ═══════════════════════════════════════════════════
# CC5 — CONTROL ACTIVITIES
# ═══════════════════════════════════════════════════

def check_cc5_1(config):
    """Control design & implementation"""
    issues = []
    if not config.get("config_service", {}).get("rules_configured"):
        issues.append("AWS Config rules not configured — no automated compliance checking")
    if not config.get("organization", {}).get("control_documentation"):
        issues.append("Security controls not formally documented")
    return _result("CC5.1", "Control Implementation", "Design and implement controls to mitigate risks", issues, "HIGH")


def check_cc5_2(config):
    """Technology controls"""
    issues = []
    if not config.get("waf", {}).get("enabled"):
        issues.append("AWS WAF not enabled — no web application firewall")
    if not config.get("shield", {}).get("enabled"):
        issues.append("AWS Shield not enabled — no DDoS protection")
    return _result("CC5.2", "Technology Controls", "Deploy technology-based controls for security", issues, "HIGH")


# ═══════════════════════════════════════════════════
# CC6 — LOGICAL & PHYSICAL ACCESS
# ═══════════════════════════════════════════════════

def check_cc6_1(config):
    """Logical access controls — MFA, access keys"""
    issues = []
    iam = config.get("iam", {})
    if iam.get("root_account_mfa") is False:
        issues.append("Root account MFA is disabled")
    users = iam.get("users", [])
    no_mfa = [u["username"] for u in users if not u.get("mfa_active")]
    if no_mfa:
        issues.append(f"{len(no_mfa)} user(s) don't have MFA enabled: {', '.join(no_mfa)}")
    multi_keys = [u["username"] for u in users if u.get("access_keys", 0) > 1]
    if multi_keys:
        issues.append(f"{len(multi_keys)} user(s) have multiple access keys")
    return _result("CC6.1", "Logical Access Controls", "Restrict logical access to system resources", issues, "CRITICAL")


def check_cc6_2(config):
    """Password policy"""
    issues = []
    policy = config.get("iam", {}).get("password_policy", {})
    if policy.get("minimum_length", 0) < 12:
        issues.append(f"Password minimum length is {policy.get('minimum_length')}, should be at least 12")
    if not policy.get("require_uppercase"):
        issues.append("Uppercase characters not required in passwords")
    if not policy.get("require_symbols"):
        issues.append("Special symbols not required in passwords")
    if policy.get("max_password_age", 0) > 90:
        issues.append(f"Password expiry is {policy.get('max_password_age')} days, should be 90 or less")
    if not policy.get("require_numbers"):
        issues.append("Numbers not required in passwords")
    return _result("CC6.2", "Password Policy", "Enforce strong password requirements", issues, "HIGH")


def check_cc6_3(config):
    """Role-based access — least privilege"""
    issues = []
    users = config.get("iam", {}).get("users", [])
    for u in users:
        if u.get("username") == "admin" and not u.get("mfa_active"):
            issues.append("Admin user exists without MFA — violates least privilege")
        if u.get("access_keys", 0) > 1:
            issues.append(f"User '{u['username']}' has {u['access_keys']} access keys — should have at most 1")
    if not config.get("iam", {}).get("roles_defined"):
        issues.append("No IAM roles defined — all access may be user-based instead of role-based")
    return _result("CC6.3", "Role-Based Access", "Implement least privilege and role-based access", issues, "HIGH")


def check_cc6_6(config):
    """Public access controls"""
    issues = []
    pub_buckets = [b["name"] for b in config.get("s3", {}).get("buckets", []) if b.get("public_access")]
    if pub_buckets:
        issues.append(f"Public S3 buckets found: {', '.join(pub_buckets)}")
    pub_dbs = [db["name"] for db in config.get("rds", {}).get("instances", []) if db.get("publicly_accessible")]
    if pub_dbs:
        issues.append(f"Publicly accessible RDS instances: {', '.join(pub_dbs)}")
    sgs = config.get("vpc", {}).get("security_groups", [])
    for sg in sgs:
        for rule in sg.get("inbound_rules", []):
            if rule.get("source") == "0.0.0.0/0":
                port = rule.get("port")
                if port == 22:
                    issues.append("SSH port 22 is open to the entire internet (0.0.0.0/0)")
                elif port == 3306:
                    issues.append("MySQL port 3306 is open to the entire internet (0.0.0.0/0)")
                elif port == 5432:
                    issues.append("PostgreSQL port 5432 is open to the entire internet (0.0.0.0/0)")
                elif port == 3389:
                    issues.append("RDP port 3389 is open to the entire internet (0.0.0.0/0)")
    return _result("CC6.6", "Public Access Controls", "Prevent unauthorized public access to resources", issues, "CRITICAL")


def check_cc6_7(config):
    """Data transmission security"""
    issues = []
    if config.get("elb", {}).get("ssl_enabled") is False:
        issues.append("Load balancer does not enforce SSL/TLS for data in transit")
    if config.get("cloudfront", {}).get("https_enforced") is False:
        issues.append("CloudFront distribution does not enforce HTTPS")
    buckets = config.get("s3", {}).get("buckets", [])
    no_ssl = [b["name"] for b in buckets if b.get("enforce_ssl") is False]
    if no_ssl:
        issues.append(f"S3 buckets without SSL enforcement: {', '.join(no_ssl)}")
    return _result("CC6.7", "Data in Transit", "Encrypt data during transmission", issues, "CRITICAL")


def check_cc6_8(config):
    """Prevent unauthorized software"""
    issues = []
    if not config.get("systems_manager", {}).get("patch_compliance"):
        issues.append("AWS Systems Manager patch compliance not enabled")
    if not config.get("inspector", {}).get("enabled"):
        issues.append("AWS Inspector not enabled — no vulnerability scanning")
    return _result("CC6.8", "Software Security", "Prevent unauthorized or malicious software", issues, "HIGH")


# ═══════════════════════════════════════════════════
# CC7 — SYSTEM OPERATIONS
# ═══════════════════════════════════════════════════

def check_cc7_1(config):
    """Threat detection"""
    issues = []
    if not config.get("guardduty", {}).get("enabled"):
        issues.append("AWS GuardDuty not enabled — no threat detection active")
    if not config.get("config_service", {}).get("enabled"):
        issues.append("AWS Config not enabled — no configuration compliance monitoring")
    if not config.get("security_hub", {}).get("enabled"):
        issues.append("AWS Security Hub not enabled — no centralized security view")
    return _result("CC7.1", "Threat Detection", "Monitor for security threats and anomalies", issues, "HIGH")


def check_cc7_2(config):
    """Audit logging"""
    issues = []
    ct = config.get("cloudtrail", {})
    if not ct.get("enabled"):
        issues.append("AWS CloudTrail not enabled — no audit logs of account activity")
    if not ct.get("multi_region"):
        issues.append("CloudTrail not enabled for all regions")
    if not ct.get("log_validation"):
        issues.append("CloudTrail log file validation is disabled")
    if not config.get("vpc", {}).get("flow_logs_enabled"):
        issues.append("VPC Flow Logs disabled — network traffic not being logged")
    return _result("CC7.2", "Audit Logging", "Monitor and log system activity", issues, "CRITICAL")


def check_cc7_3(config):
    """Security event alerting"""
    issues = []
    if not config.get("sns", {}).get("security_alerts_configured"):
        issues.append("No SNS security alert topics configured")
    if not config.get("cloudwatch", {}).get("alarm_configured"):
        issues.append("No CloudWatch alarms for security events")
    if not config.get("cloudwatch", {}).get("log_groups_configured"):
        issues.append("No CloudWatch Log Groups for centralized log analysis")
    return _result("CC7.3", "Security Alerting", "Alert on potential security events in real-time", issues, "HIGH")


def check_cc7_4(config):
    """Incident response"""
    issues = []
    ir = config.get("incident_response", {})
    if not ir.get("plan_exists"):
        issues.append("No documented incident response plan")
    if not ir.get("contact_list"):
        issues.append("No incident response contact list defined")
    if not ir.get("runbooks"):
        issues.append("No incident response runbooks/playbooks created")
    return _result("CC7.4", "Incident Response", "Define and test incident response procedures", issues, "CRITICAL")


# ═══════════════════════════════════════════════════
# CC8 — CHANGE MANAGEMENT
# ═══════════════════════════════════════════════════

def check_cc8_1(config):
    """Change monitoring & control"""
    issues = []
    no_log = [b["name"] for b in config.get("s3", {}).get("buckets", []) if not b.get("logging")]
    if no_log:
        issues.append(f"S3 buckets without access logging: {', '.join(no_log)}")
    if not config.get("config_service", {}).get("enabled"):
        issues.append("AWS Config not enabled — cannot track infrastructure changes")
    if not config.get("organization", {}).get("change_management_process"):
        issues.append("No formal change management process documented")
    if not config.get("codepipeline", {}).get("enabled"):
        issues.append("No CI/CD pipeline — changes may not go through proper review")
    return _result("CC8.1", "Change Management", "Authorize, test, and approve system changes", issues, "HIGH")


# ═══════════════════════════════════════════════════
# CC9 — RISK MITIGATION
# ═══════════════════════════════════════════════════

def check_cc9_1(config):
    """Risk assessment"""
    issues = []
    if not config.get("trusted_advisor", {}).get("enabled"):
        issues.append("AWS Trusted Advisor not enabled — no automated risk assessment")
    if not config.get("access_analyzer", {}).get("enabled"):
        issues.append("IAM Access Analyzer not enabled — cannot detect overly permissive policies")
    return _result("CC9.1", "Risk Assessment", "Identify and assess security risks", issues, "HIGH")


def check_cc9_2(config):
    """Data encryption at rest"""
    issues = []
    unenc_buckets = [b["name"] for b in config.get("s3", {}).get("buckets", []) if not b.get("encryption")]
    if unenc_buckets:
        issues.append(f"S3 buckets without encryption: {', '.join(unenc_buckets)}")
    unenc_dbs = [db["name"] for db in config.get("rds", {}).get("instances", []) if not db.get("encryption")]
    if unenc_dbs:
        issues.append(f"RDS databases without encryption: {', '.join(unenc_dbs)}")
    if not config.get("kms", {}).get("keys_configured"):
        issues.append("AWS KMS keys not configured — no centralized encryption key management")
    return _result("CC9.2", "Data Encryption at Rest", "Encrypt sensitive data stored in the system", issues, "CRITICAL")


# ═══════════════════════════════════════════════════
# A1 — AVAILABILITY
# ═══════════════════════════════════════════════════

def check_a1_1(config):
    """High availability"""
    issues = []
    instances = config.get("rds", {}).get("instances", [])
    no_multi_az = [db["name"] for db in instances if not db.get("multi_az")]
    if no_multi_az:
        issues.append(f"RDS instances without Multi-AZ: {', '.join(no_multi_az)}")
    if not config.get("autoscaling", {}).get("enabled"):
        issues.append("Auto Scaling not configured — no automatic capacity adjustment")
    if not config.get("route53", {}).get("health_checks"):
        issues.append("No Route 53 health checks — no automated failover")
    return _result("A1.1", "High Availability", "Ensure system availability through redundancy", issues, "HIGH")


def check_a1_2(config):
    """Backup and recovery"""
    issues = []
    instances = config.get("rds", {}).get("instances", [])
    no_backup = [db["name"] for db in instances if not db.get("backup_enabled")]
    if no_backup:
        issues.append(f"RDS instances without backup: {', '.join(no_backup)}")
    short_ret = [db for db in instances if db.get("backup_retention_days", 0) < 30]
    if short_ret:
        issues.append(f"RDS backup retention too short ({short_ret[0].get('backup_retention_days')} days), should be 30+ days")
    no_ver = [b["name"] for b in config.get("s3", {}).get("buckets", []) if not b.get("versioning")]
    if no_ver:
        issues.append(f"S3 buckets without versioning: {', '.join(no_ver)}")
    return _result("A1.2", "Backup & Recovery", "Ensure data backup and recovery procedures", issues, "HIGH")


def check_a1_3(config):
    """Disaster recovery"""
    issues = []
    dr = config.get("disaster_recovery", {})
    if not dr.get("plan_exists"):
        issues.append("No disaster recovery plan documented")
    if not dr.get("cross_region_backup"):
        issues.append("No cross-region backup configured for disaster recovery")
    if not dr.get("rto_defined"):
        issues.append("Recovery Time Objective (RTO) not defined")
    if not dr.get("rpo_defined"):
        issues.append("Recovery Point Objective (RPO) not defined")
    return _result("A1.3", "Disaster Recovery", "Plan and test disaster recovery procedures", issues, "CRITICAL")


# ═══════════════════════════════════════════════════
# C1 — CONFIDENTIALITY
# ═══════════════════════════════════════════════════

def check_c1_1(config):
    """Data classification"""
    issues = []
    buckets = config.get("s3", {}).get("buckets", [])
    no_tags = [b["name"] for b in buckets if not b.get("classification_tag")]
    if no_tags:
        issues.append(f"S3 buckets without data classification tags: {', '.join(no_tags)}")
    if not config.get("macie", {}).get("enabled"):
        issues.append("Amazon Macie not enabled — no automated sensitive data discovery")
    return _result("C1.1", "Data Classification", "Classify and protect confidential information", issues, "MEDIUM")


def check_c1_2(config):
    """Data disposal"""
    issues = []
    buckets = config.get("s3", {}).get("buckets", [])
    no_lifecycle = [b["name"] for b in buckets if not b.get("lifecycle_policy")]
    if no_lifecycle:
        issues.append(f"S3 buckets without lifecycle/disposal policy: {', '.join(no_lifecycle)}")
    return _result("C1.2", "Data Disposal", "Securely dispose of data when no longer needed", issues, "MEDIUM")


# ═══════════════════════════════════════════════════
# PI1 — PROCESSING INTEGRITY
# ═══════════════════════════════════════════════════

def check_pi1_1(config):
    """Input validation"""
    issues = []
    if not config.get("waf", {}).get("enabled"):
        issues.append("AWS WAF not enabled — no web application firewall for input validation")
    if not config.get("api_gateway", {}).get("request_validation"):
        issues.append("API Gateway request validation not configured")
    return _result("PI1.1", "Input Validation", "Validate inputs for accuracy and completeness", issues, "MEDIUM")


def check_pi1_2(config):
    """Processing monitoring"""
    issues = []
    if not config.get("cloudwatch", {}).get("alarm_configured"):
        issues.append("No CloudWatch alarms to detect processing errors")
    if not config.get("xray", {}).get("enabled"):
        issues.append("AWS X-Ray not enabled — no distributed tracing for processing issues")
    return _result("PI1.2", "Processing Monitoring", "Monitor processing for errors and anomalies", issues, "MEDIUM")


def check_pi1_3(config):
    """Output review"""
    issues = []
    if not config.get("organization", {}).get("output_validation"):
        issues.append("No output validation or reconciliation process documented")
    if not config.get("cloudwatch", {}).get("log_groups_configured"):
        issues.append("No centralized logging for processing output review")
    return _result("PI1.3", "Output Review", "Review system outputs for accuracy", issues, "LOW")


# ═══════════════════════════════════════════════════
# P1 — PRIVACY
# ═══════════════════════════════════════════════════

def check_p1_1(config):
    """Personal data protection"""
    issues = []
    if not config.get("macie", {}).get("enabled"):
        issues.append("Amazon Macie not enabled — cannot auto-detect PII in S3")
    if not config.get("cloudtrail", {}).get("data_events"):
        issues.append("CloudTrail data events not enabled — cannot track access to personal data")
    pub_buckets = [b["name"] for b in config.get("s3", {}).get("buckets", []) if b.get("public_access")]
    if pub_buckets:
        issues.append(f"Public buckets may contain personal data: {', '.join(pub_buckets)}")
    return _result("P1.1", "Privacy Protection", "Protect personal and sensitive information", issues, "CRITICAL")


def check_p1_2(config):
    """Consent & data rights"""
    issues = []
    org = config.get("organization", {})
    if not org.get("data_processing_agreement"):
        issues.append("No Data Processing Agreement (DPA) template exists")
    if not org.get("consent_management"):
        issues.append("No consent management system for collecting user consent")
    if not org.get("data_subject_request_process"):
        issues.append("No process for handling data subject access/deletion requests")
    return _result("P1.2", "Consent & Data Rights", "Manage consent and respond to data subject requests", issues, "HIGH")


def check_p1_3(config):
    """Data retention & cross-border"""
    issues = []
    org = config.get("organization", {})
    if not org.get("retention_policy"):
        issues.append("No data retention policy defined")
    if not org.get("cross_border_transfer_policy"):
        issues.append("No cross-border data transfer policy (important for Indian DPDP Act)")
    buckets = config.get("s3", {}).get("buckets", [])
    no_lifecycle = [b["name"] for b in buckets if not b.get("lifecycle_policy")]
    if no_lifecycle:
        issues.append(f"S3 buckets without retention lifecycle rules: {', '.join(no_lifecycle)}")
    return _result("P1.3", "Data Retention", "Define data retention and cross-border transfer policies", issues, "HIGH")


# ═══════════════════════════════════════════════════
# INDUSTRY BENCHMARKS
# ═══════════════════════════════════════════════════

INDUSTRY_BENCHMARKS = {
    "saas_startup": {
        "label": "SaaS Startups (Seed-Series B)",
        "avg_score": 28,
        "top_quartile": 55,
        "common_failures": ["CC1.1", "CC6.1", "CC7.2", "CC9.2", "CC6.6", "A1.3", "P1.2"],
        "sample_size": 450,
    },
    "fintech": {
        "label": "Fintech Companies",
        "avg_score": 48,
        "top_quartile": 72,
        "common_failures": ["CC7.2", "CC9.2", "P1.1", "CC6.7", "CC3.2"],
        "sample_size": 220,
    },
    "healthtech": {
        "label": "HealthTech / MedTech",
        "avg_score": 42,
        "top_quartile": 68,
        "common_failures": ["P1.1", "CC9.2", "C1.1", "CC7.2", "P1.3"],
        "sample_size": 180,
    },
    "enterprise_saas": {
        "label": "Enterprise SaaS (Series C+)",
        "avg_score": 62,
        "top_quartile": 85,
        "common_failures": ["CC7.3", "A1.3", "CC9.1", "CC4.2"],
        "sample_size": 310,
    },
    "ecommerce": {
        "label": "E-Commerce / D2C",
        "avg_score": 22,
        "top_quartile": 45,
        "common_failures": ["CC6.1", "CC6.6", "CC9.2", "CC7.2", "PI1.1", "P1.1"],
        "sample_size": 380,
    },
}


def get_benchmark(score: int, industry: str = "saas_startup") -> dict:
    bench = INDUSTRY_BENCHMARKS.get(industry, INDUSTRY_BENCHMARKS["saas_startup"])

    if score >= bench["top_quartile"]:
        percentile = 75 + min(25, round((score - bench["top_quartile"]) / max(1, (100 - bench["top_quartile"])) * 25))
    elif score >= bench["avg_score"]:
        percentile = 50 + round((score - bench["avg_score"]) / max(1, (bench["top_quartile"] - bench["avg_score"])) * 25)
    else:
        percentile = max(5, round((score / max(1, bench["avg_score"])) * 50))

    if percentile >= 75:
        rating = "Excellent"
        message = "You're ahead of most companies in your industry."
    elif percentile >= 50:
        rating = "Above Average"
        message = "You're doing better than half the companies in your industry."
    elif percentile >= 25:
        rating = "Below Average"
        message = "Most companies in your industry score higher. Critical gaps need attention."
    else:
        rating = "Needs Immediate Action"
        message = "You're in the bottom quartile. Address critical issues before an audit."

    return {
        "industry": bench["label"],
        "your_score": score,
        "industry_avg": bench["avg_score"],
        "top_quartile": bench["top_quartile"],
        "percentile": percentile,
        "rating": rating,
        "message": message,
        "common_failures": bench["common_failures"],
        "sample_size": bench["sample_size"],
        "all_industries": {k: {"label": v["label"], "avg_score": v["avg_score"]} for k, v in INDUSTRY_BENCHMARKS.items()},
    }


# ═══════════════════════════════════════════════════
# HELPER
# ═══════════════════════════════════════════════════

def _result(id, title, description, issues, severity):
    return {
        "id": id,
        "title": title,
        "description": description,
        "passed": len(issues) == 0,
        "issues": issues,
        "severity": severity if issues else None,
    }
