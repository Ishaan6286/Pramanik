"""
Cross-Framework Control Mappings
Maps each AWS check to SOC 2, ISO 27001, and HIPAA controls.

This is the core novelty — one scan satisfies multiple frameworks.
The CRVS algorithm uses the cross-framework count as a multiplier.
"""

# Each entry maps our internal check ID to all three frameworks
FRAMEWORK_MAP = {
    # ─── ACCESS CONTROLS ───────────────────────────
    "CC6.1": {
        "soc2": {"id": "CC6.1", "title": "Logical Access Controls"},
        "iso27001": {"id": "A.9.4.2", "title": "Secure log-on procedures"},
        "hipaa": {"id": "§164.312(d)", "title": "Person or entity authentication"},
        "frameworks_satisfied": 3,
    },
    "CC6.2": {
        "soc2": {"id": "CC6.2", "title": "Password Policy"},
        "iso27001": {"id": "A.9.4.3", "title": "Password management system"},
        "hipaa": {"id": "§164.308(a)(5)(ii)(D)", "title": "Password management"},
        "frameworks_satisfied": 3,
    },
    "CC6.3": {
        "soc2": {"id": "CC6.3", "title": "Role-Based Access"},
        "iso27001": {"id": "A.9.1.2", "title": "Access to networks and network services"},
        "hipaa": {"id": "§164.312(a)(1)", "title": "Access control"},
        "frameworks_satisfied": 3,
    },
    "CC6.6": {
        "soc2": {"id": "CC6.6", "title": "Public Access Controls"},
        "iso27001": {"id": "A.13.1.1", "title": "Network controls"},
        "hipaa": {"id": "§164.312(e)(1)", "title": "Transmission security"},
        "frameworks_satisfied": 3,
    },
    "CC6.7": {
        "soc2": {"id": "CC6.7", "title": "Data in Transit"},
        "iso27001": {"id": "A.14.1.2", "title": "Securing application services on public networks"},
        "hipaa": {"id": "§164.312(e)(2)(ii)", "title": "Encryption of ePHI in transit"},
        "frameworks_satisfied": 3,
    },
    "CC6.8": {
        "soc2": {"id": "CC6.8", "title": "Software Security"},
        "iso27001": {"id": "A.12.2.1", "title": "Controls against malware"},
        "hipaa": {"id": "§164.308(a)(5)(ii)(B)", "title": "Protection from malicious software"},
        "frameworks_satisfied": 3,
    },

    # ─── ENCRYPTION ────────────────────────────────
    "CC9.2": {
        "soc2": {"id": "CC9.2", "title": "Data Encryption at Rest"},
        "iso27001": {"id": "A.10.1.1", "title": "Policy on use of cryptographic controls"},
        "hipaa": {"id": "§164.312(a)(2)(iv)", "title": "Encryption and decryption of ePHI"},
        "frameworks_satisfied": 3,
    },

    # ─── LOGGING & MONITORING ──────────────────────
    "CC7.1": {
        "soc2": {"id": "CC7.1", "title": "Threat Detection"},
        "iso27001": {"id": "A.12.4.1", "title": "Event logging"},
        "hipaa": {"id": "§164.312(b)", "title": "Audit controls"},
        "frameworks_satisfied": 3,
    },
    "CC7.2": {
        "soc2": {"id": "CC7.2", "title": "Audit Logging"},
        "iso27001": {"id": "A.12.4.3", "title": "Administrator and operator logs"},
        "hipaa": {"id": "§164.312(b)", "title": "Audit controls"},
        "frameworks_satisfied": 3,
    },
    "CC7.3": {
        "soc2": {"id": "CC7.3", "title": "Security Alerting"},
        "iso27001": {"id": "A.16.1.2", "title": "Reporting information security events"},
        "hipaa": {"id": "§164.308(a)(6)(ii)", "title": "Response and reporting"},
        "frameworks_satisfied": 3,
    },
    "CC7.4": {
        "soc2": {"id": "CC7.4", "title": "Incident Response"},
        "iso27001": {"id": "A.16.1.5", "title": "Response to information security incidents"},
        "hipaa": {"id": "§164.308(a)(6)(i)", "title": "Security incident procedures"},
        "frameworks_satisfied": 3,
    },

    # ─── GOVERNANCE ────────────────────────────────
    "CC1.1": {
        "soc2": {"id": "CC1.1", "title": "Security Governance"},
        "iso27001": {"id": "A.5.1.1", "title": "Policies for information security"},
        "hipaa": {"id": "§164.308(a)(2)", "title": "Assigned security responsibility"},
        "frameworks_satisfied": 3,
    },
    "CC1.2": {
        "soc2": {"id": "CC1.2", "title": "Personnel Security"},
        "iso27001": {"id": "A.7.1.1", "title": "Screening"},
        "hipaa": {"id": "§164.308(a)(3)(ii)(B)", "title": "Workforce clearance procedure"},
        "frameworks_satisfied": 3,
    },

    # ─── COMMUNICATION ─────────────────────────────
    "CC2.1": {
        "soc2": {"id": "CC2.1", "title": "Internal Communication"},
        "iso27001": {"id": "A.7.2.2", "title": "Information security awareness"},
        "hipaa": {"id": "§164.308(a)(5)(i)", "title": "Security awareness and training"},
        "frameworks_satisfied": 3,
    },
    "CC2.2": {
        "soc2": {"id": "CC2.2", "title": "External Communication"},
        "iso27001": {"id": "A.18.1.4", "title": "Privacy and protection of PII"},
        "hipaa": {"id": "§164.520", "title": "Notice of privacy practices"},
        "frameworks_satisfied": 3,
    },

    # ─── RISK ──────────────────────────────────────
    "CC3.1": {
        "soc2": {"id": "CC3.1", "title": "Risk Identification"},
        "iso27001": {"id": "A.8.2.1", "title": "Classification of information"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(A)", "title": "Risk analysis"},
        "frameworks_satisfied": 3,
    },
    "CC3.2": {
        "soc2": {"id": "CC3.2", "title": "Threat Assessment"},
        "iso27001": {"id": "A.12.6.1", "title": "Management of technical vulnerabilities"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(B)", "title": "Risk management"},
        "frameworks_satisfied": 3,
    },

    # ─── MONITORING ────────────────────────────────
    "CC4.1": {
        "soc2": {"id": "CC4.1", "title": "Security Monitoring"},
        "iso27001": {"id": "A.18.2.3", "title": "Technical compliance review"},
        "hipaa": {"id": "§164.308(a)(8)", "title": "Evaluation"},
        "frameworks_satisfied": 3,
    },
    "CC4.2": {
        "soc2": {"id": "CC4.2", "title": "Remediation Tracking"},
        "iso27001": {"id": "A.16.1.6", "title": "Learning from information security incidents"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(D)", "title": "Implementation specifications"},
        "frameworks_satisfied": 3,
    },

    # ─── CONTROL ACTIVITIES ────────────────────────
    "CC5.1": {
        "soc2": {"id": "CC5.1", "title": "Control Implementation"},
        "iso27001": {"id": "A.14.1.1", "title": "Information security requirements analysis"},
        "hipaa": None,
        "frameworks_satisfied": 2,
    },
    "CC5.2": {
        "soc2": {"id": "CC5.2", "title": "Technology Controls"},
        "iso27001": {"id": "A.13.1.3", "title": "Segregation in networks"},
        "hipaa": None,
        "frameworks_satisfied": 2,
    },

    # ─── CHANGE MANAGEMENT ─────────────────────────
    "CC8.1": {
        "soc2": {"id": "CC8.1", "title": "Change Management"},
        "iso27001": {"id": "A.14.2.2", "title": "System change control procedures"},
        "hipaa": {"id": "§164.308(a)(5)(ii)(C)", "title": "Log-in monitoring"},
        "frameworks_satisfied": 3,
    },

    # ─── RISK MITIGATION ──────────────────────────
    "CC9.1": {
        "soc2": {"id": "CC9.1", "title": "Risk Assessment"},
        "iso27001": {"id": "A.12.6.1", "title": "Management of technical vulnerabilities"},
        "hipaa": {"id": "§164.308(a)(1)(ii)(A)", "title": "Risk analysis"},
        "frameworks_satisfied": 3,
    },

    # ─── AVAILABILITY ──────────────────────────────
    "A1.1": {
        "soc2": {"id": "A1.1", "title": "High Availability"},
        "iso27001": {"id": "A.17.1.1", "title": "Planning information security continuity"},
        "hipaa": {"id": "§164.308(a)(7)(i)", "title": "Contingency plan"},
        "frameworks_satisfied": 3,
    },
    "A1.2": {
        "soc2": {"id": "A1.2", "title": "Backup & Recovery"},
        "iso27001": {"id": "A.12.3.1", "title": "Information backup"},
        "hipaa": {"id": "§164.308(a)(7)(ii)(A)", "title": "Data backup plan"},
        "frameworks_satisfied": 3,
    },
    "A1.3": {
        "soc2": {"id": "A1.3", "title": "Disaster Recovery"},
        "iso27001": {"id": "A.17.1.2", "title": "Implementing information security continuity"},
        "hipaa": {"id": "§164.308(a)(7)(ii)(B)", "title": "Disaster recovery plan"},
        "frameworks_satisfied": 3,
    },

    # ─── CONFIDENTIALITY ───────────────────────────
    "C1.1": {
        "soc2": {"id": "C1.1", "title": "Data Classification"},
        "iso27001": {"id": "A.8.2.1", "title": "Classification of information"},
        "hipaa": {"id": "§164.312(a)(2)(iv)", "title": "Encryption and decryption"},
        "frameworks_satisfied": 3,
    },
    "C1.2": {
        "soc2": {"id": "C1.2", "title": "Data Disposal"},
        "iso27001": {"id": "A.8.3.2", "title": "Disposal of media"},
        "hipaa": {"id": "§164.310(d)(2)(i)", "title": "Disposal of ePHI"},
        "frameworks_satisfied": 3,
    },

    # ─── PROCESSING INTEGRITY ──────────────────────
    "PI1.1": {
        "soc2": {"id": "PI1.1", "title": "Input Validation"},
        "iso27001": {"id": "A.14.2.5", "title": "Secure system engineering principles"},
        "hipaa": None,
        "frameworks_satisfied": 2,
    },
    "PI1.2": {
        "soc2": {"id": "PI1.2", "title": "Processing Monitoring"},
        "iso27001": {"id": "A.12.1.3", "title": "Capacity management"},
        "hipaa": None,
        "frameworks_satisfied": 2,
    },
    "PI1.3": {
        "soc2": {"id": "PI1.3", "title": "Output Review"},
        "iso27001": None,
        "hipaa": None,
        "frameworks_satisfied": 1,
    },

    # ─── PRIVACY ───────────────────────────────────
    "P1.1": {
        "soc2": {"id": "P1.1", "title": "Privacy Protection"},
        "iso27001": {"id": "A.18.1.4", "title": "Privacy and protection of PII"},
        "hipaa": {"id": "§164.502", "title": "Uses and disclosures of PHI"},
        "frameworks_satisfied": 3,
    },
    "P1.2": {
        "soc2": {"id": "P1.2", "title": "Consent & Data Rights"},
        "iso27001": {"id": "A.18.1.4", "title": "Privacy and protection of PII"},
        "hipaa": {"id": "§164.522", "title": "Rights to request privacy protection"},
        "frameworks_satisfied": 3,
    },
    "P1.3": {
        "soc2": {"id": "P1.3", "title": "Data Retention"},
        "iso27001": {"id": "A.8.3.2", "title": "Disposal of media"},
        "hipaa": {"id": "§164.530(j)", "title": "Retention of documentation"},
        "frameworks_satisfied": 3,
    },
}


# ═══════════════════════════════════════════════════
# CRVS — Compliance Risk Velocity Score
# ═══════════════════════════════════════════════════

# Severity and exploitability scores per control
RISK_WEIGHTS = {
    "CC6.1": {"severity": 9, "exploitability": 9, "data_exposure": 8, "blast_radius": 10},
    "CC6.2": {"severity": 6, "exploitability": 5, "data_exposure": 4, "blast_radius": 7},
    "CC6.3": {"severity": 7, "exploitability": 6, "data_exposure": 6, "blast_radius": 8},
    "CC6.6": {"severity": 10, "exploitability": 10, "data_exposure": 10, "blast_radius": 7},
    "CC6.7": {"severity": 8, "exploitability": 7, "data_exposure": 9, "blast_radius": 6},
    "CC6.8": {"severity": 6, "exploitability": 4, "data_exposure": 3, "blast_radius": 5},
    "CC7.1": {"severity": 7, "exploitability": 2, "data_exposure": 2, "blast_radius": 8},
    "CC7.2": {"severity": 8, "exploitability": 2, "data_exposure": 3, "blast_radius": 9},
    "CC7.3": {"severity": 5, "exploitability": 1, "data_exposure": 1, "blast_radius": 6},
    "CC7.4": {"severity": 8, "exploitability": 3, "data_exposure": 5, "blast_radius": 9},
    "CC8.1": {"severity": 5, "exploitability": 2, "data_exposure": 2, "blast_radius": 5},
    "CC9.1": {"severity": 6, "exploitability": 3, "data_exposure": 2, "blast_radius": 7},
    "CC9.2": {"severity": 9, "exploitability": 6, "data_exposure": 10, "blast_radius": 8},
    "CC1.1": {"severity": 6, "exploitability": 1, "data_exposure": 1, "blast_radius": 9},
    "CC1.2": {"severity": 4, "exploitability": 1, "data_exposure": 1, "blast_radius": 5},
    "CC2.1": {"severity": 3, "exploitability": 1, "data_exposure": 1, "blast_radius": 4},
    "CC2.2": {"severity": 4, "exploitability": 1, "data_exposure": 2, "blast_radius": 5},
    "CC3.1": {"severity": 6, "exploitability": 2, "data_exposure": 2, "blast_radius": 8},
    "CC3.2": {"severity": 7, "exploitability": 3, "data_exposure": 3, "blast_radius": 8},
    "CC4.1": {"severity": 7, "exploitability": 2, "data_exposure": 2, "blast_radius": 9},
    "CC4.2": {"severity": 4, "exploitability": 1, "data_exposure": 1, "blast_radius": 5},
    "CC5.1": {"severity": 5, "exploitability": 1, "data_exposure": 1, "blast_radius": 6},
    "CC5.2": {"severity": 6, "exploitability": 4, "data_exposure": 3, "blast_radius": 6},
    "A1.1": {"severity": 7, "exploitability": 3, "data_exposure": 2, "blast_radius": 8},
    "A1.2": {"severity": 7, "exploitability": 2, "data_exposure": 5, "blast_radius": 7},
    "A1.3": {"severity": 8, "exploitability": 3, "data_exposure": 5, "blast_radius": 10},
    "C1.1": {"severity": 4, "exploitability": 2, "data_exposure": 5, "blast_radius": 4},
    "C1.2": {"severity": 4, "exploitability": 1, "data_exposure": 4, "blast_radius": 3},
    "PI1.1": {"severity": 5, "exploitability": 5, "data_exposure": 4, "blast_radius": 5},
    "PI1.2": {"severity": 3, "exploitability": 1, "data_exposure": 1, "blast_radius": 4},
    "PI1.3": {"severity": 2, "exploitability": 1, "data_exposure": 1, "blast_radius": 2},
    "P1.1": {"severity": 9, "exploitability": 7, "data_exposure": 10, "blast_radius": 8},
    "P1.2": {"severity": 7, "exploitability": 2, "data_exposure": 8, "blast_radius": 6},
    "P1.3": {"severity": 6, "exploitability": 2, "data_exposure": 7, "blast_radius": 5},
}


def calculate_crvs(failed_controls: list) -> list:
    """
    Calculate Compliance Risk Velocity Score for each failed control.
    Returns sorted list — highest risk first.

    Formula: CRVS = (Severity × Exploitability × DataExposure × BlastRadius) × CrossFrameworkMultiplier

    CrossFrameworkMultiplier:
      - Satisfies 3 frameworks → 1.5x
      - Satisfies 2 frameworks → 1.2x
      - Satisfies 1 framework  → 1.0x
    """
    scored = []

    for control in failed_controls:
        cid = control["id"]
        weights = RISK_WEIGHTS.get(cid, {"severity": 5, "exploitability": 5, "data_exposure": 5, "blast_radius": 5})
        mapping = FRAMEWORK_MAP.get(cid, {"frameworks_satisfied": 1})

        # Base risk score
        base_score = (
            weights["severity"] *
            weights["exploitability"] *
            weights["data_exposure"] *
            weights["blast_radius"]
        )

        # Cross-framework multiplier
        fw_count = mapping.get("frameworks_satisfied", 1)
        if fw_count >= 3:
            multiplier = 1.5
        elif fw_count >= 2:
            multiplier = 1.2
        else:
            multiplier = 1.0

        crvs = round(base_score * multiplier)

        # Get framework mappings for display
        frameworks = []
        if mapping.get("soc2"):
            frameworks.append({"framework": "SOC 2", "control": mapping["soc2"]["id"], "title": mapping["soc2"]["title"]})
        if mapping.get("iso27001"):
            frameworks.append({"framework": "ISO 27001", "control": mapping["iso27001"]["id"], "title": mapping["iso27001"]["title"]})
        if mapping.get("hipaa"):
            frameworks.append({"framework": "HIPAA", "control": mapping["hipaa"]["id"], "title": mapping["hipaa"]["title"]})

        scored.append({
            "id": cid,
            "title": control["title"],
            "crvs_score": crvs,
            "severity": weights["severity"],
            "exploitability": weights["exploitability"],
            "data_exposure": weights["data_exposure"],
            "blast_radius": weights["blast_radius"],
            "cross_framework_multiplier": multiplier,
            "frameworks_satisfied": fw_count,
            "framework_mappings": frameworks,
            "issues": control.get("issues", []),
        })

    # Sort by CRVS score descending
    scored.sort(key=lambda x: x["crvs_score"], reverse=True)

    # Calculate cumulative score improvement
    total_controls = 33
    current_failed = len(failed_controls)
    current_score = round(((total_controls - current_failed) / total_controls) * 100)

    for i, item in enumerate(scored):
        fixed_count = i + 1
        new_failed = current_failed - fixed_count
        projected_score = round(((total_controls - new_failed) / total_controls) * 100)
        item["projected_score_if_fixed"] = projected_score
        item["score_improvement"] = projected_score - current_score
        item["fix_priority"] = i + 1

    return scored


def get_framework_summary(results: list) -> dict:
    """Get compliance status per framework"""
    soc2_pass = 0
    soc2_total = 0
    iso_pass = 0
    iso_total = 0
    hipaa_pass = 0
    hipaa_total = 0

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
    }
