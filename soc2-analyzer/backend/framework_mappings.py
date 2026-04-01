"""
Cross-Framework Control Mappings
Maps each AWS check to SOC 2, ISO 27001, HIPAA, and DPDP Act 2023 controls.

This is the core novelty — one scan satisfies multiple frameworks.
The CES algorithm uses the cross-framework count as a multiplier.

DPDP = India's Digital Personal Data Protection Act 2023
"""

# Each entry maps our internal check ID to all four frameworks
FRAMEWORK_MAP = {
    # ─── ACCESS CONTROLS ───────────────────────────
    "CC6.1": {
        "soc2": {"id": "CC6.1", "title": "Logical Access Controls"},
        "iso27001": {"id": "A.9.4.2", "title": "Secure log-on procedures"},
        "hipaa": {"id": "§164.312(d)", "title": "Person or entity authentication"},
        "dpdp": {"id": "§8(1)", "title": "Reasonable security safeguards"},
        "frameworks_satisfied": 4,
    },
    "CC6.2": {
        "soc2": {"id": "CC6.2", "title": "Password Policy"},
        "iso27001": {"id": "A.9.4.3", "title": "Password management system"},
        "hipaa": {"id": "§164.308(a)(5)(ii)(D)", "title": "Password management"},
        "dpdp": {"id": "§8(1)", "title": "Reasonable security safeguards"},
        "frameworks_satisfied": 4,
    },
    "CC6.3": {
        "soc2": {"id": "CC6.3", "title": "Role-Based Access"},
        "iso27001": {"id": "A.9.1.2", "title": "Access to networks and network services"},
        "hipaa": {"id": "§164.312(a)(1)", "title": "Access control"},
        "dpdp": {"id": "§8(1)", "title": "Reasonable security safeguards"},
        "frameworks_satisfied": 4,
    },
    "CC6.6": {
        "soc2": {"id": "CC6.6", "title": "Public Access Controls"},
        "iso27001": {"id": "A.13.1.1", "title": "Network controls"},
        "hipaa": {"id": "§164.312(e)(1)", "title": "Transmission security"},
        "dpdp": {"id": "§8(1)", "title": "Reasonable security safeguards"},
        "frameworks_satisfied": 4,
    },
    "CC6.7": {
        "soc2": {"id": "CC6.7", "title": "Data in Transit"},
        "iso27001": {"id": "A.14.1.2", "title": "Securing application services on public networks"},
        "hipaa": {"id": "§164.312(e)(2)(ii)", "title": "Encryption of ePHI in transit"},
        "dpdp": {"id": "§8(1)", "title": "Reasonable security safeguards"},
        "frameworks_satisfied": 4,
    },
    "CC6.8": {
        "soc2": {"id": "CC6.8", "title": "Software Security"},
        "iso27001": {"id": "A.12.2.1", "title": "Controls against malware"},
        "hipaa": {"id": "§164.308(a)(5)(ii)(B)", "title": "Protection from malicious software"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },

    # ─── ENCRYPTION ────────────────────────────────
    "CC9.2": {
        "soc2": {"id": "CC9.2", "title": "Data Encryption at Rest"},
        "iso27001": {"id": "A.10.1.1", "title": "Policy on use of cryptographic controls"},
        "hipaa": {"id": "§164.312(a)(2)(iv)", "title": "Encryption and decryption of ePHI"},
        "dpdp": {"id": "§8(1)", "title": "Reasonable security safeguards — encryption"},
        "frameworks_satisfied": 4,
    },

    # ─── LOGGING & MONITORING ──────────────────────
    "CC7.1": {
        "soc2": {"id": "CC7.1", "title": "Threat Detection"},
        "iso27001": {"id": "A.12.4.1", "title": "Event logging"},
        "hipaa": {"id": "§164.312(b)", "title": "Audit controls"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "CC7.2": {
        "soc2": {"id": "CC7.2", "title": "Audit Logging"},
        "iso27001": {"id": "A.12.4.3", "title": "Administrator and operator logs"},
        "hipaa": {"id": "§164.312(b)", "title": "Audit controls"},
        "dpdp": {"id": "§8(1)", "title": "Reasonable security safeguards — audit trail"},
        "frameworks_satisfied": 4,
    },
    "CC7.3": {
        "soc2": {"id": "CC7.3", "title": "Security Alerting"},
        "iso27001": {"id": "A.16.1.2", "title": "Reporting information security events"},
        "hipaa": {"id": "§164.308(a)(6)(ii)", "title": "Response and reporting"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "CC7.4": {
        "soc2": {"id": "CC7.4", "title": "Incident Response"},
        "iso27001": {"id": "A.16.1.5", "title": "Response to information security incidents"},
        "hipaa": {"id": "§164.308(a)(6)(i)", "title": "Security incident procedures"},
        "dpdp": {"id": "§8(5)", "title": "Breach notification to Board and data principal within 72 hours"},
        "frameworks_satisfied": 4,
    },

    # ─── GOVERNANCE ────────────────────────────────
    "CC1.1": {
        "soc2": {"id": "CC1.1", "title": "Security Governance"},
        "iso27001": {"id": "A.5.1.1", "title": "Policies for information security"},
        "hipaa": {"id": "§164.308(a)(2)", "title": "Assigned security responsibility"},
        "dpdp": {"id": "§11", "title": "Appointment of Data Protection Officer"},
        "frameworks_satisfied": 4,
    },
    "CC1.2": {
        "soc2": {"id": "CC1.2", "title": "Personnel Security"},
        "iso27001": {"id": "A.7.1.1", "title": "Screening"},
        "hipaa": {"id": "§164.308(a)(3)(ii)(B)", "title": "Workforce clearance procedure"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },

    # ─── COMMUNICATION ─────────────────────────────
    "CC2.1": {
        "soc2": {"id": "CC2.1", "title": "Internal Communication"},
        "iso27001": {"id": "A.7.2.2", "title": "Information security awareness"},
        "hipaa": {"id": "§164.308(a)(5)(i)", "title": "Security awareness and training"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "CC2.2": {
        "soc2": {"id": "CC2.2", "title": "External Communication"},
        "iso27001": {"id": "A.18.1.4", "title": "Privacy and protection of PII"},
        "hipaa": {"id": "§164.520", "title": "Notice of privacy practices"},
        "dpdp": {"id": "§5", "title": "Notice — inform data principal about processing"},
        "frameworks_satisfied": 4,
    },

    # ─── RISK ──────────────────────────────────────
    "CC3.1": {
        "soc2": {"id": "CC3.1", "title": "Risk Identification"},
        "iso27001": {"id": "A.8.2.1", "title": "Classification of information"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(A)", "title": "Risk analysis"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "CC3.2": {
        "soc2": {"id": "CC3.2", "title": "Threat Assessment"},
        "iso27001": {"id": "A.12.6.1", "title": "Management of technical vulnerabilities"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(B)", "title": "Risk management"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },

    # ─── MONITORING ────────────────────────────────
    "CC4.1": {
        "soc2": {"id": "CC4.1", "title": "Security Monitoring"},
        "iso27001": {"id": "A.18.2.3", "title": "Technical compliance review"},
        "hipaa": {"id": "§164.308(a)(8)", "title": "Evaluation"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "CC4.2": {
        "soc2": {"id": "CC4.2", "title": "Remediation Tracking"},
        "iso27001": {"id": "A.16.1.6", "title": "Learning from information security incidents"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(D)", "title": "Implementation specifications"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },

    # ─── CONTROL ACTIVITIES ────────────────────────
    "CC5.1": {
        "soc2": {"id": "CC5.1", "title": "Control Implementation"},
        "iso27001": {"id": "A.14.1.1", "title": "Information security requirements analysis"},
        "hipaa": None,
        "dpdp": None,
        "frameworks_satisfied": 2,
    },
    "CC5.2": {
        "soc2": {"id": "CC5.2", "title": "Technology Controls"},
        "iso27001": {"id": "A.13.1.3", "title": "Segregation in networks"},
        "hipaa": None,
        "dpdp": None,
        "frameworks_satisfied": 2,
    },

    # ─── CHANGE MANAGEMENT ─────────────────────────
    "CC8.1": {
        "soc2": {"id": "CC8.1", "title": "Change Management"},
        "iso27001": {"id": "A.14.2.2", "title": "System change control procedures"},
        "hipaa": {"id": "§164.308(a)(5)(ii)(C)", "title": "Log-in monitoring"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },

    # ─── RISK MITIGATION ──────────────────────────
    "CC9.1": {
        "soc2": {"id": "CC9.1", "title": "Risk Assessment"},
        "iso27001": {"id": "A.12.6.1", "title": "Management of technical vulnerabilities"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(A)", "title": "Risk analysis"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },

    # ─── AVAILABILITY ──────────────────────────────
    "A1.1": {
        "soc2": {"id": "A1.1", "title": "High Availability"},
        "iso27001": {"id": "A.17.1.1", "title": "Planning information security continuity"},
        "hipaa": {"id": "§164.308(a)(7)(i)", "title": "Contingency plan"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "A1.2": {
        "soc2": {"id": "A1.2", "title": "Backup & Recovery"},
        "iso27001": {"id": "A.12.3.1", "title": "Information backup"},
        "hipaa": {"id": "§164.308(a)(7)(ii)(A)", "title": "Data backup plan"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "A1.3": {
        "soc2": {"id": "A1.3", "title": "Disaster Recovery"},
        "iso27001": {"id": "A.17.1.2", "title": "Implementing information security continuity"},
        "hipaa": {"id": "§164.308(a)(7)(ii)(B)", "title": "Disaster recovery plan"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },

    # ─── CONFIDENTIALITY ───────────────────────────
    "C1.1": {
        "soc2": {"id": "C1.1", "title": "Data Classification"},
        "iso27001": {"id": "A.8.2.1", "title": "Classification of information"},
        "hipaa": {"id": "§164.312(a)(2)(iv)", "title": "Encryption and decryption"},
        "dpdp": None,
        "frameworks_satisfied": 3,
    },
    "C1.2": {
        "soc2": {"id": "C1.2", "title": "Data Disposal"},
        "iso27001": {"id": "A.8.3.2", "title": "Disposal of media"},
        "hipaa": {"id": "§164.310(d)(2)(i)", "title": "Disposal of ePHI"},
        "dpdp": {"id": "§8(7)", "title": "Erase personal data when purpose is met or consent withdrawn"},
        "frameworks_satisfied": 4,
    },

    # ─── PROCESSING INTEGRITY ──────────────────────
    "PI1.1": {
        "soc2": {"id": "PI1.1", "title": "Input Validation"},
        "iso27001": {"id": "A.14.2.5", "title": "Secure system engineering principles"},
        "hipaa": None,
        "dpdp": None,
        "frameworks_satisfied": 2,
    },
    "PI1.2": {
        "soc2": {"id": "PI1.2", "title": "Processing Monitoring"},
        "iso27001": {"id": "A.12.1.3", "title": "Capacity management"},
        "hipaa": None,
        "dpdp": None,
        "frameworks_satisfied": 2,
    },
    "PI1.3": {
        "soc2": {"id": "PI1.3", "title": "Output Review"},
        "iso27001": None,
        "hipaa": None,
        "dpdp": None,
        "frameworks_satisfied": 1,
    },

    # ─── PRIVACY ───────────────────────────────────
    "P1.1": {
        "soc2": {"id": "P1.1", "title": "Privacy Protection"},
        "iso27001": {"id": "A.18.1.4", "title": "Privacy and protection of PII"},
        "hipaa": {"id": "§164.502", "title": "Uses and disclosures of PHI"},
        "dpdp": {"id": "§4", "title": "Consent — process data only for lawful purpose with consent"},
        "frameworks_satisfied": 4,
    },
    "P1.2": {
        "soc2": {"id": "P1.2", "title": "Consent & Data Rights"},
        "iso27001": {"id": "A.18.1.4", "title": "Privacy and protection of PII"},
        "hipaa": {"id": "§164.522", "title": "Rights to request privacy protection"},
        "dpdp": {"id": "§6", "title": "Rights of Data Principal — access, correction, erasure, grievance"},
        "frameworks_satisfied": 4,
    },
    "P1.3": {
        "soc2": {"id": "P1.3", "title": "Data Retention"},
        "iso27001": {"id": "A.8.3.2", "title": "Disposal of media"},
        "hipaa": {"id": "§164.530(j)", "title": "Retention of documentation"},
        "dpdp": {"id": "§9", "title": "Data retention — retain only as long as necessary for purpose"},
        "frameworks_satisfied": 4,
    },
}


# ═══════════════════════════════════════════════════
# CES v2 — Compliance Efficiency Score
# ═══════════════════════════════════════════════════
#
# Full formula:
#   CES = [DangerScore + EfficiencyScore] × CFM × DependencyBoost
#
# Where:
#   DangerScore     = S × E × D × B  (CVSS-backed)
#   EfficiencyScore = (ControlsUnlocked × 100) / FixTimeHours
#   CFM             = CrossFrameworkMultiplier
#   DependencyBoost = 1.0 + (0.2 × dependencies_count)

# CVSS-backed risk weights with references
RISK_WEIGHTS = {
    "CC6.1": {"severity": 9, "exploitability": 9, "data_exposure": 8, "blast_radius": 10, "cvss_ref": "AV:N/AC:L/PR:N — Remote access without MFA"},
    "CC6.2": {"severity": 6, "exploitability": 5, "data_exposure": 4, "blast_radius": 7, "cvss_ref": "AV:N/AC:L/PR:L — Weak passwords exploitable"},
    "CC6.3": {"severity": 7, "exploitability": 6, "data_exposure": 6, "blast_radius": 8, "cvss_ref": "AV:N/AC:L/PR:L — Privilege escalation via over-permissioned users"},
    "CC6.6": {"severity": 10, "exploitability": 10, "data_exposure": 10, "blast_radius": 7, "cvss_ref": "AV:N/AC:L/PR:N — Public S3/RDS directly accessible"},
    "CC6.7": {"severity": 8, "exploitability": 7, "data_exposure": 9, "blast_radius": 6, "cvss_ref": "AV:N/AC:L — Data interceptable in transit"},
    "CC6.8": {"severity": 6, "exploitability": 4, "data_exposure": 3, "blast_radius": 5, "cvss_ref": "AV:L/AC:H — Requires local exploitation"},
    "CC7.1": {"severity": 7, "exploitability": 2, "data_exposure": 2, "blast_radius": 8, "cvss_ref": "AV:N/AC:H — Blind to threats without detection"},
    "CC7.2": {"severity": 8, "exploitability": 2, "data_exposure": 3, "blast_radius": 9, "cvss_ref": "AV:N/AC:H — No audit trail for forensics"},
    "CC7.3": {"severity": 5, "exploitability": 1, "data_exposure": 1, "blast_radius": 6, "cvss_ref": "AV:N/AC:H — Delayed response without alerts"},
    "CC7.4": {"severity": 8, "exploitability": 3, "data_exposure": 5, "blast_radius": 9, "cvss_ref": "AV:N/AC:L — No incident containment plan"},
    "CC8.1": {"severity": 5, "exploitability": 2, "data_exposure": 2, "blast_radius": 5, "cvss_ref": "AV:L/AC:L — Untracked changes introduce risk"},
    "CC9.1": {"severity": 6, "exploitability": 3, "data_exposure": 2, "blast_radius": 7, "cvss_ref": "AV:N/AC:H — Unknown risk posture"},
    "CC9.2": {"severity": 9, "exploitability": 6, "data_exposure": 10, "blast_radius": 8, "cvss_ref": "AV:N/AC:L — Unencrypted data at rest exposed on breach"},
    "CC1.1": {"severity": 6, "exploitability": 1, "data_exposure": 1, "blast_radius": 9, "cvss_ref": "Organizational — no security leadership"},
    "CC1.2": {"severity": 4, "exploitability": 1, "data_exposure": 1, "blast_radius": 5, "cvss_ref": "Organizational — insider threat unmitigated"},
    "CC2.1": {"severity": 3, "exploitability": 1, "data_exposure": 1, "blast_radius": 4, "cvss_ref": "Organizational — security awareness gap"},
    "CC2.2": {"severity": 4, "exploitability": 1, "data_exposure": 2, "blast_radius": 5, "cvss_ref": "Organizational — no external transparency"},
    "CC3.1": {"severity": 6, "exploitability": 2, "data_exposure": 2, "blast_radius": 8, "cvss_ref": "AV:N/AC:H — Unknown risks unmanaged"},
    "CC3.2": {"severity": 7, "exploitability": 3, "data_exposure": 3, "blast_radius": 8, "cvss_ref": "AV:N/AC:H — Threats unassessed"},
    "CC4.1": {"severity": 7, "exploitability": 2, "data_exposure": 2, "blast_radius": 9, "cvss_ref": "AV:N/AC:H — No continuous monitoring"},
    "CC4.2": {"severity": 4, "exploitability": 1, "data_exposure": 1, "blast_radius": 5, "cvss_ref": "Organizational — findings not tracked"},
    "CC5.1": {"severity": 5, "exploitability": 1, "data_exposure": 1, "blast_radius": 6, "cvss_ref": "Organizational — undocumented controls"},
    "CC5.2": {"severity": 6, "exploitability": 4, "data_exposure": 3, "blast_radius": 6, "cvss_ref": "AV:N/AC:L — No WAF/DDoS protection"},
    "A1.1": {"severity": 7, "exploitability": 3, "data_exposure": 2, "blast_radius": 8, "cvss_ref": "AV:N/AC:L — Single point of failure"},
    "A1.2": {"severity": 7, "exploitability": 2, "data_exposure": 5, "blast_radius": 7, "cvss_ref": "AV:N/AC:L — Data loss without backup"},
    "A1.3": {"severity": 8, "exploitability": 3, "data_exposure": 5, "blast_radius": 10, "cvss_ref": "AV:N/AC:L — Total loss scenario unplanned"},
    "C1.1": {"severity": 4, "exploitability": 2, "data_exposure": 5, "blast_radius": 4, "cvss_ref": "AV:L/AC:L — Unclassified data mishandled"},
    "C1.2": {"severity": 4, "exploitability": 1, "data_exposure": 4, "blast_radius": 3, "cvss_ref": "AV:L/AC:H — Data retained beyond need"},
    "PI1.1": {"severity": 5, "exploitability": 5, "data_exposure": 4, "blast_radius": 5, "cvss_ref": "AV:N/AC:L — Injection attacks possible"},
    "PI1.2": {"severity": 3, "exploitability": 1, "data_exposure": 1, "blast_radius": 4, "cvss_ref": "AV:L/AC:H — Processing errors undetected"},
    "PI1.3": {"severity": 2, "exploitability": 1, "data_exposure": 1, "blast_radius": 2, "cvss_ref": "AV:L/AC:H — Output integrity unchecked"},
    "P1.1": {"severity": 9, "exploitability": 7, "data_exposure": 10, "blast_radius": 8, "cvss_ref": "AV:N/AC:L — PII/PHI exposed without protection"},
    "P1.2": {"severity": 7, "exploitability": 2, "data_exposure": 8, "blast_radius": 6, "cvss_ref": "Legal — DPDP/GDPR violation risk"},
    "P1.3": {"severity": 6, "exploitability": 2, "data_exposure": 7, "blast_radius": 5, "cvss_ref": "Legal — Data retained beyond lawful period"},
}

# Fix time estimates (hours) — how long each fix takes
FIX_TIMES = {
    "CC6.1": 0.25,   # Enable MFA — 15 minutes
    "CC6.2": 0.5,    # Update password policy — 30 minutes
    "CC6.3": 1.0,    # Set up IAM roles — 1 hour
    "CC6.6": 0.25,   # Close public access — 15 minutes
    "CC6.7": 1.0,    # Enable SSL enforcement — 1 hour
    "CC6.8": 2.0,    # Enable Inspector + patching — 2 hours
    "CC7.1": 0.5,    # Enable GuardDuty — 30 minutes
    "CC7.2": 0.25,   # Enable CloudTrail — 15 minutes
    "CC7.3": 1.0,    # Set up SNS + CloudWatch alerts — 1 hour
    "CC7.4": 4.0,    # Write incident response plan — 4 hours
    "CC8.1": 2.0,    # Set up change management — 2 hours
    "CC9.1": 0.5,    # Enable Trusted Advisor + Access Analyzer — 30 minutes
    "CC9.2": 0.5,    # Enable encryption — 30 minutes
    "CC1.1": 3.0,    # Assign security officer + write policy — 3 hours
    "CC1.2": 4.0,    # Set up background checks + training — 4 hours
    "CC2.1": 2.0,    # Create security communication plan — 2 hours
    "CC2.2": 2.0,    # Publish privacy policy + security page — 2 hours
    "CC3.1": 2.0,    # Create risk register — 2 hours
    "CC3.2": 3.0,    # Conduct threat assessment — 3 hours
    "CC4.1": 0.5,    # Enable Security Hub + Config — 30 minutes
    "CC4.2": 2.0,    # Set up remediation tracking — 2 hours
    "CC5.1": 2.0,    # Document controls + Config rules — 2 hours
    "CC5.2": 1.0,    # Enable WAF + Shield — 1 hour
    "A1.1": 2.0,     # Enable Multi-AZ + Auto Scaling — 2 hours
    "A1.2": 1.0,     # Configure backups + versioning — 1 hour
    "A1.3": 8.0,     # Write disaster recovery plan — 8 hours
    "C1.1": 1.0,     # Tag buckets + enable Macie — 1 hour
    "C1.2": 1.0,     # Set up lifecycle policies — 1 hour
    "PI1.1": 1.0,    # Enable WAF + API Gateway validation — 1 hour
    "PI1.2": 0.5,    # Set up CloudWatch alarms — 30 minutes
    "PI1.3": 2.0,    # Document output validation — 2 hours
    "P1.1": 1.0,     # Enable Macie + data event tracking — 1 hour
    "P1.2": 4.0,     # Set up consent management + DPA — 4 hours
    "P1.3": 3.0,     # Define retention policy + lifecycle rules — 3 hours
}

# Dependency chains — fixing one control unlocks others
DEPENDENCIES = {
    "CC7.2": ["CC4.1", "CC8.1", "P1.1"],  # CloudTrail unlocks monitoring, change mgmt, privacy tracking
    "CC6.1": ["CC6.3"],                     # MFA is prerequisite for proper role-based access
    "CC7.1": ["CC3.2"],                     # GuardDuty enables threat assessment
    "CC4.1": ["CC4.2"],                     # Security Hub enables remediation tracking
    "CC9.2": ["C1.1"],                      # Encryption enables data classification
    "CC1.1": ["CC2.1", "CC5.1"],            # Governance enables communication + control documentation
    "CC7.4": ["CC7.3"],                     # Incident response plan enables proper alerting
}

# Estimated breach cost if control is not fixed (in INR lakhs)
BREACH_COSTS = {
    "CC6.1": 25.0,   # Account takeover → full breach
    "CC6.6": 50.0,   # Public data exposure → regulatory fine + reputation
    "CC9.2": 40.0,   # Unencrypted data breach → DPDP fine up to ₹250 crores
    "CC7.2": 15.0,   # No audit trail → can't investigate breach
    "CC7.4": 20.0,   # No incident response → breach escalates
    "P1.1": 35.0,    # PII exposure → DPDP fine + lawsuits
    "P1.2": 30.0,    # No consent management → DPDP violation
    "CC6.7": 20.0,   # Data intercepted in transit
    "A1.3": 45.0,    # Disaster with no recovery plan
}


def calculate_crvs(failed_controls: list) -> list:
    """
    CES v2 — Compliance Efficiency Score

    Full formula:
      CES = [DangerScore + EfficiencyScore] × CFM × DependencyBoost

    Where:
      DangerScore     = S × E × D × B  (CVSS-backed)
      EfficiencyScore = (ControlsUnlocked × 100) / FixTimeHours
      CFM             = 1.8 (4 fw) / 1.5 (3 fw) / 1.2 (2 fw) / 1.0 (1 fw)
      DependencyBoost = 1.0 + (0.2 × dependencies_count)
    """
    failed_ids = {c["id"] for c in failed_controls}
    scored = []

    for control in failed_controls:
        cid = control["id"]
        weights = RISK_WEIGHTS.get(cid, {"severity": 5, "exploitability": 5, "data_exposure": 5, "blast_radius": 5, "cvss_ref": ""})
        mapping = FRAMEWORK_MAP.get(cid, {"frameworks_satisfied": 1})

        # ── DangerScore ──
        danger_score = (
            weights["severity"] *
            weights["exploitability"] *
            weights["data_exposure"] *
            weights["blast_radius"]
        )

        # ── EfficiencyScore ──
        fix_time = FIX_TIMES.get(cid, 2.0)
        deps = DEPENDENCIES.get(cid, [])
        # Only count dependencies that are also currently failing
        unlocked = [d for d in deps if d in failed_ids]
        controls_unlocked = len(unlocked)
        efficiency_score = (controls_unlocked * 100) / max(fix_time, 0.1)

        # ── CrossFrameworkMultiplier ──
        fw_count = mapping.get("frameworks_satisfied", 1)
        if fw_count >= 4:
            cfm = 1.8
        elif fw_count >= 3:
            cfm = 1.5
        elif fw_count >= 2:
            cfm = 1.2
        else:
            cfm = 1.0

        # ── DependencyBoost ──
        dep_boost = 1.0 + (0.2 * controls_unlocked)

        # ── Final CES ──
        ces = round((danger_score + efficiency_score) * cfm * dep_boost)

        # Get framework mappings for display
        frameworks = []
        if mapping.get("soc2"):
            frameworks.append({"framework": "SOC 2", "control": mapping["soc2"]["id"], "title": mapping["soc2"]["title"]})
        if mapping.get("iso27001"):
            frameworks.append({"framework": "ISO 27001", "control": mapping["iso27001"]["id"], "title": mapping["iso27001"]["title"]})
        if mapping.get("hipaa"):
            frameworks.append({"framework": "HIPAA", "control": mapping["hipaa"]["id"], "title": mapping["hipaa"]["title"]})
        if mapping.get("dpdp"):
            frameworks.append({"framework": "DPDP", "control": mapping["dpdp"]["id"], "title": mapping["dpdp"]["title"]})

        breach_cost = BREACH_COSTS.get(cid, 5.0)

        scored.append({
            "id": cid,
            "title": control["title"],
            "crvs_score": ces,
            "severity": weights["severity"],
            "exploitability": weights["exploitability"],
            "data_exposure": weights["data_exposure"],
            "blast_radius": weights["blast_radius"],
            "cvss_ref": weights.get("cvss_ref", ""),
            "fix_time_hours": fix_time,
            "controls_unlocked": controls_unlocked,
            "unlocked_controls": unlocked,
            "breach_cost_lakhs": breach_cost,
            "cross_framework_multiplier": cfm,
            "dependency_boost": dep_boost,
            "frameworks_satisfied": fw_count,
            "framework_mappings": frameworks,
            "issues": control.get("issues", []),
        })

    # Sort by CES score descending
    scored.sort(key=lambda x: x["crvs_score"], reverse=True)

    # Calculate cumulative score improvement
    total_controls = len(failed_controls) + sum(1 for c in (failed_controls[0:0]) if c.get("passed", False))
    # Use the actual total from the full control set
    total_controls = 33
    current_failed = len(failed_controls)
    current_score = round(((total_controls - current_failed) / total_controls) * 100)

    cumulative_time = 0
    for i, item in enumerate(scored):
        fixed_count = i + 1
        new_failed = current_failed - fixed_count
        projected_score = round(((total_controls - new_failed) / total_controls) * 100)
        cumulative_time += item["fix_time_hours"]
        item["projected_score_if_fixed"] = projected_score
        item["score_improvement"] = projected_score - current_score
        item["cumulative_fix_time"] = round(cumulative_time, 1)
        item["fix_priority"] = i + 1

    return scored


def get_framework_summary(results: list) -> dict:
    """Get compliance status per framework (now includes DPDP)"""
    soc2_pass = 0
    soc2_total = 0
    iso_pass = 0
    iso_total = 0
    hipaa_pass = 0
    hipaa_total = 0
    dpdp_pass = 0
    dpdp_total = 0

    for r in results:
        mapping = FRAMEWORK_MAP.get(r["id"], {})

        if mapping.get("soc2"):
            soc2_total += 1
            if r["passed"]:
                soc2_pass += 1

        if mapping.get("iso27001"):
            iso_total += 1
            if r["passed"]:
                iso_pass += 1

        if mapping.get("hipaa"):
            hipaa_total += 1
            if r["passed"]:
                hipaa_pass += 1

        if mapping.get("dpdp"):
            dpdp_total += 1
            if r["passed"]:
                dpdp_pass += 1

    return {
        "soc2": {
            "passed": soc2_pass,
            "total": soc2_total,
            "score": round((soc2_pass / max(1, soc2_total)) * 100),
        },
        "iso27001": {
            "passed": iso_pass,
            "total": iso_total,
            "score": round((iso_pass / max(1, iso_total)) * 100),
        },
        "hipaa": {
            "passed": hipaa_pass,
            "total": hipaa_total,
            "score": round((hipaa_pass / max(1, hipaa_total)) * 100),
        },
        "dpdp": {
            "passed": dpdp_pass,
            "total": dpdp_total,
            "score": round((dpdp_pass / max(1, dpdp_total)) * 100),
        },
    }
