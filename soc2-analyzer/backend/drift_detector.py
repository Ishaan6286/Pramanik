"""
Drift Detector — Compares current AWS config against stored baseline.
Identifies what changed and which compliance frameworks are affected.

Features:
- Detects regressions (things that got worse)
- Detects improvements (things that got better
- Analyzes impact on multiple frameworks (SOC 2, ISO, HIPAA)
- Calculates risk contribution of each drift
- Provides detailed change explanation
"""

from framework_mappings import FRAMEWORK_MAP
from datetime import datetime

# Maps config paths to the controls they affect
CONFIG_TO_CONTROLS = {
    "iam.root_account_mfa": ["CC6.1"],
    "iam.password_policy.minimum_length": ["CC6.2"],
    "iam.password_policy.require_uppercase": ["CC6.2"],
    "iam.password_policy.require_symbols": ["CC6.2"],
    "iam.roles_defined": ["CC6.3"],
    "cloudtrail.enabled": ["CC7.2", "CC8.1"],
    "cloudtrail.multi_region": ["CC7.2"],
    "cloudtrail.log_validation": ["CC7.2"],
    "cloudtrail.data_events": ["P1.1"],
    "guardduty.enabled": ["CC3.2", "CC7.1"],
    "security_hub.enabled": ["CC4.1", "CC7.1"],
    "config_service.enabled": ["CC4.1", "CC5.1", "CC7.1", "CC8.1"],
    "kms.keys_configured": ["CC9.2"],
    "waf.enabled": ["CC5.2", "PI1.1"],
    "shield.enabled": ["CC5.2"],
    "macie.enabled": ["C1.1", "P1.1"],
    "inspector.enabled": ["CC6.8"],
    "vpc.flow_logs_enabled": ["CC7.2"],
}


def _get_nested(d: dict, path: str, default=None):
    """Get a nested dict value by dot path like 'iam.password_policy.minimum_length'."""
    keys = path.split(".")
    for key in keys:
        if isinstance(d, dict):
            d = d.get(key, default)
        else:
            return default
    return d


def _calculate_danger_score(severity: int, exploitability: int, data_exposure: int, blast_radius: int) -> int:
    """
    Calculate danger score capped at 100 for 0-100 scale.
    Uses weighted average to normalize multi-component risk.
    """
    weights = [0.3, 0.25, 0.25, 0.2]
    components = [severity, exploitability, data_exposure, blast_radius]
    weighted_sum = sum(c * w for c, w in zip(components, weights))
    score = (weighted_sum - 1) / 9 * 100
    return max(0, min(100, round(score)))


def _severity_for_controls(control_ids: list) -> str:
    """Return highest severity among affected controls with error handling."""
    severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0}
    max_sev = "LOW"
    
    for cid in control_ids:
        mapping = FRAMEWORK_MAP.get(cid, {})
        if not mapping:
            print(f"Warning: Control {cid} not found in FRAMEWORK_MAP")
            continue
            
        fw_count = sum([
            1 if mapping.get("soc2") else 0,
            1 if mapping.get("iso27001") else 0,
            1 if mapping.get("hipaa") else 0,
        ])
        
        if fw_count >= 3 and severity_order.get(max_sev, -1) < severity_order.get("CRITICAL", -1):
            max_sev = "CRITICAL"
        elif fw_count >= 2 and severity_order.get(max_sev, -1) < severity_order.get("HIGH", -1):
            max_sev = "HIGH"
    
    return max_sev


def _is_regression(old_val, new_val, config_path: str) -> bool:
    """Comprehensive regression detection with type handling."""
    if old_val is None and new_val is None:
        return False
    if isinstance(old_val, bool) and isinstance(new_val, bool):
        if old_val is True and new_val is False:
            return True
        return False
    if isinstance(old_val, (int, float)) and isinstance(new_val, (int, float)):
        if old_val > new_val:
            if "count" in config_path.lower() or "instances" in config_path:
                return False
            return True
        return False
    if isinstance(old_val, str) and isinstance(new_val, str):
        if not old_val and new_val:
            return False
        if old_val and not new_val:
            return True
        return False
    if isinstance(old_val, list) and isinstance(new_val, list):
        if len(new_val) < len(old_val):
            return False
        if len(new_val) > len(old_val):
            return False
        return set(old_val) != set(new_val)
    if type(old_val) != type(new_val):
        return not new_val
    return False


def _get_change_type(old_val, new_val, config_path: str) -> str:
    """Categorize type of change."""
    if isinstance(old_val, bool) and isinstance(new_val, bool):
        return "boolean_disable" if (old_val and not new_val) else "boolean_change"
    if isinstance(old_val, (int, float)) and isinstance(new_val, (int, float)):
        return "numeric_decrease" if old_val > new_val else "numeric_increase"
    if isinstance(old_val, list) and isinstance(new_val, list):
        if len(new_val) > len(old_val):
            return "resource_added"
        if len(new_val) < len(old_val):
            return "resource_removed"
        return "resource_modified"
    return "value_change"


def _get_affected_frameworks(control_ids: list) -> list:
    """Get all affected frameworks with error handling and duplicate prevention."""
    frameworks = {}
    
    for cid in control_ids:
        mapping = FRAMEWORK_MAP.get(cid, {})
        if not mapping:
            print(f"Warning: Control {cid} not found in FRAMEWORK_MAP")
            continue
        
        soc2_data = mapping.get("soc2")
        if soc2_data and isinstance(soc2_data, dict):
            fw_key = "SOC 2"
            if fw_key not in frameworks:
                frameworks[fw_key] = {"framework": fw_key, "controls": []}
            control_id = soc2_data.get("id", cid)
            if control_id not in frameworks[fw_key]["controls"]:
                frameworks[fw_key]["controls"].append(control_id)
        
        iso_data = mapping.get("iso27001")
        if iso_data and isinstance(iso_data, dict):
            fw_key = "ISO 27001"
            if fw_key not in frameworks:
                frameworks[fw_key] = {"framework": fw_key, "controls": []}
            control_id = iso_data.get("id", cid)
            if control_id not in frameworks[fw_key]["controls"]:
                frameworks[fw_key]["controls"].append(control_id)
        
        hipaa_data = mapping.get("hipaa")
        if hipaa_data and isinstance(hipaa_data, dict):
            fw_key = "HIPAA"
            if fw_key not in frameworks:
                frameworks[fw_key] = {"framework": fw_key, "controls": []}
            control_id = hipaa_data.get("id", cid)
            if control_id not in frameworks[fw_key]["controls"]:
                frameworks[fw_key]["controls"].append(control_id)
    
    return list(frameworks.values())


def _analyze_regression_impact(path: str, old_val, new_val) -> dict:
    """
    Analyze the business impact of a regression.
    Returns narrative explanation and risk score (0-100).
    """
    risk_score = 0
    explanation = ""
    
    # Critical config changes
    critical_paths = {
        "iam.root_account_mfa": {
            "explanation": "Root account MFA disabled — highest privilege account at risk",
            "risk": 100
        },
        "cloudtrail.enabled": {
            "explanation": "CloudTrail disabled — no activity logging, audit trail lost",
            "risk": 95
        },
        "cloudtrail.log_validation": {
            "explanation": "CloudTrail log validation disabled — logs can be tampered with",
            "risk": 85
        },
        "security_hub.enabled": {
            "explanation": "AWS Security Hub disabled — no centralized security monitoring",
            "risk": 80
        },
        "vpc.flow_logs_enabled": {
            "explanation": "VPC Flow Logs disabled — network monitoring lost",
            "risk": 75
        },
    }
    
    if path in critical_paths:
        return critical_paths[path]
    
    # S3/RDS public accessibility regressions
    if "public_access" in path and old_val is False and new_val is True:
        return {
            "explanation": "Configuration made publicly accessible — data exposure risk",
            "risk": 90
        }
    
    # Encryption regressions
    if "encryption" in path and old_val is True and new_val is False:
        return {
            "explanation": "Encryption disabled — data at rest no longer protected",
            "risk": 85
        }
    
    # MFA regressions
    if "mfa" in path and old_val is True and new_val is False:
        return {
            "explanation": "MFA disabled — authentication less secure",
            "risk": 70
        }
    
    # Default for unknown regressions
    return {
        "explanation": f"Configuration regression: {path}",
        "risk": 50
    }


def detect_drift(current_config: dict, baseline_config: dict) -> dict:
    """
    Compare current config against baseline.
    Returns detailed drift analysis with severity, impact, and affected frameworks.
    
    Returns:
    {
        "total_changes": int,
        "regressions": int,
        "improvements": int,
        "overall_risk_increase": float (-100 to 100),
        "changes": [
            {
                "config_path": str,
                "previous_value": any,
                "current_value": any,
                "is_regression": bool,
                "severity": str (CRITICAL/HIGH/MEDIUM/LOW/INFO),
                "risk_score": int (0-100),
                "affected_controls": [str],
                "affected_frameworks": [{framework, controls}],
                "explanation": str,
                "remediation": str,
                "change_type": str (boolean_disable, value_decrease, new_resource, etc)
            }
        ]
    }
    """
    changes = []
    total_risk_delta = 0

    # ═══ TRACK STANDARD CONFIG PATHS ═══
    for path, control_ids in CONFIG_TO_CONTROLS.items():
        current_val = _get_nested(current_config, path)
        baseline_val = _get_nested(baseline_config, path)

        if current_val != baseline_val:
            # Determine if this is a regression (got worse) or improvement (got better)
            is_regression = (baseline_val is True and current_val is False) or \
                           (isinstance(baseline_val, (int, float)) and isinstance(current_val, (int, float)) and current_val < baseline_val)

            # Analyze impact
            impact = _analyze_regression_impact(path, baseline_val, current_val) if is_regression else {
                "explanation": f"Configuration improved: {path}",
                "risk": 0
            }
            risk_score = impact.get("risk", 0)
            if is_regression:
                total_risk_delta += risk_score
            else:
                total_risk_delta -= (risk_score // 2)  # Improvements reduce risk

            # Get affected frameworks
            affected_frameworks = _get_affected_frameworks(control_ids)

            # Determine change type
            if isinstance(current_val, bool):
                change_type = "boolean_enable" if current_val else "boolean_disable"
            elif isinstance(current_val, (int, float)):
                change_type = "value_increase" if current_val > baseline_val else "value_decrease"
            else:
                change_type = "value_change"

            # Generate remediation steps
            remediation = _generate_remediation(path, baseline_val, current_val, is_regression)

            changes.append({
                "config_path": path,
                "previous_value": baseline_val,
                "current_value": current_val,
                "is_regression": is_regression,
                "severity": _severity_for_controls(control_ids) if is_regression else "INFO",
                "risk_score": risk_score,
                "affected_controls": control_ids,
                "affected_frameworks": affected_frameworks,
                "explanation": impact["explanation"],
                "remediation": remediation,
                "change_type": change_type,
            })

    # ═══ TRACK S3 BUCKETS ═══
    current_buckets = {b["name"]: b for b in current_config.get("s3", {}).get("buckets", [])}
    baseline_buckets = {b["name"]: b for b in baseline_config.get("s3", {}).get("buckets", [])}

    # New buckets created
    for name, bucket in current_buckets.items():
        if name not in baseline_buckets:
            changes.append({
                "config_path": f"s3.buckets.{name}",
                "previous_value": None,
                "current_value": "new bucket",
                "is_regression": False,
                "severity": "INFO",
                "risk_score": 0,
                "affected_controls": ["CC6.6", "CC9.2"],
                "affected_frameworks": _get_affected_frameworks(["CC6.6", "CC9.2"]),
                "explanation": f"New S3 bucket '{name}' created",
                "remediation": "Ensure encryption and access controls are configured",
                "change_type": "new_resource",
            })
        else:
            # Check bucket configuration changes
            old = baseline_buckets[name]
            bucket_config_keys = ["encryption", "public_access", "versioning", "logging", "mfa_delete"]
            
            for key in bucket_config_keys:
                if bucket.get(key) != old.get(key):
                    is_reg = (old.get(key) is True and bucket.get(key) is False)
                    if key == "public_access":
                        is_reg = (old.get(key) is False and bucket.get(key) is True)

                    # Determine severity and risk
                    if is_reg:
                        if key == "public_access":
                            severity, risk = "CRITICAL", 95
                            explanation = f"S3 bucket '{name}' now publicly accessible — data exposure"
                        elif key == "encryption":
                            severity, risk = "CRITICAL", 90
                            explanation = f"S3 bucket '{name}' encryption disabled — data unprotected"
                        elif key == "logging":
                            severity, risk = "HIGH", 60
                            explanation = f"S3 bucket '{name}' access logging disabled"
                        elif key == "versioning":
                            severity, risk = "MEDIUM", 40
                            explanation = f"S3 bucket '{name}' versioning disabled"
                        else:
                            severity, risk = "MEDIUM", 35
                            explanation = f"S3 bucket '{name}' {key} changed"
                        
                        total_risk_delta += risk
                    else:
                        severity, risk = "INFO", 0
                        explanation = f"S3 bucket '{name}' {key} improved"

                    controls = {
                        "encryption": ["CC9.2"],
                        "public_access": ["CC6.6"],
                        "logging": ["CC7.2"],
                        "versioning": ["A1.2"],
                        "mfa_delete": ["CC6.4"],
                    }.get(key, ["A1.2"])

                    changes.append({
                        "config_path": f"s3.buckets.{name}.{key}",
                        "previous_value": old.get(key),
                        "current_value": bucket.get(key),
                        "is_regression": is_reg,
                        "severity": severity,
                        "risk_score": risk,
                        "affected_controls": controls,
                        "affected_frameworks": _get_affected_frameworks(controls),
                        "explanation": explanation,
                        "remediation": _generate_s3_remediation(key, old.get(key), bucket.get(key)),
                        "change_type": "config_change",
                    })

    # ═══ TRACK RDS INSTANCES ═══
    current_rds = {db["name"]: db for db in current_config.get("rds", {}).get("instances", [])}
    baseline_rds = {db["name"]: db for db in baseline_config.get("rds", {}).get("instances", [])}

    for name, db in current_rds.items():
        if name in baseline_rds:
            old = baseline_rds[name]
            rds_config_keys = ["encryption", "publicly_accessible", "multi_az", "backup_enabled", "enhanced_monitoring"]
            
            for key in rds_config_keys:
                if db.get(key) != old.get(key):
                    is_reg = (old.get(key) is True and db.get(key) is False)
                    if key == "publicly_accessible":
                        is_reg = (old.get(key) is False and db.get(key) is True)

                    if is_reg:
                        if key == "publicly_accessible":
                            severity, risk = "CRITICAL", 100
                            explanation = f"RDS instance '{name}' now publicly accessible — database exposed"
                        elif key == "encryption":
                            severity, risk = "CRITICAL", 95
                            explanation = f"RDS instance '{name}' encryption disabled — data unprotected"
                        elif key == "backup_enabled":
                            severity, risk = "HIGH", 75
                            explanation = f"RDS instance '{name}' automated backups disabled"
                        elif key == "multi_az":
                            severity, risk = "HIGH", 65
                            explanation = f"RDS instance '{name}' Multi-AZ disabled — availability risk"
                        elif key == "enhanced_monitoring":
                            severity, risk = "MEDIUM", 45
                            explanation = f"RDS instance '{name}' enhanced monitoring disabled"
                        else:
                            severity, risk = "MEDIUM", 35
                            explanation = f"RDS instance '{name}' {key} changed"
                        
                        total_risk_delta += risk
                    else:
                        severity, risk = "INFO", 0
                        explanation = f"RDS instance '{name}' {key} improved"

                    controls = {
                        "encryption": ["CC9.2"],
                        "publicly_accessible": ["CC6.6"],
                        "backup_enabled": ["A1.3"],
                        "multi_az": ["A1.1"],
                        "enhanced_monitoring": ["CC4.1"],
                    }.get(key, ["CC7.1"])

                    changes.append({
                        "config_path": f"rds.instances.{name}.{key}",
                        "previous_value": old.get(key),
                        "current_value": db.get(key),
                        "is_regression": is_reg,
                        "severity": severity,
                        "risk_score": risk,
                        "affected_controls": controls,
                        "affected_frameworks": _get_affected_frameworks(controls),
                        "explanation": explanation,
                        "remediation": _generate_rds_remediation(key, old.get(key), db.get(key)),
                        "change_type": "config_change",
                    })

    # ═══ CALCULATE SUMMARY ═══
    regressions = [c for c in changes if c["is_regression"]]
    improvements = [c for c in changes if not c["is_regression"] and c["severity"] != "INFO"]
    critical_issues = [c for c in changes if c["is_regression"] and c["severity"] == "CRITICAL"]

    # Clamp risk delta to -100 to 100 range
    overall_risk_increase = max(-100, min(100, total_risk_delta))

    return {
        "total_changes": len(changes),
        "regressions": len(regressions),
        "improvements": len(improvements),
        "critical_issues": len(critical_issues),
        "overall_risk_increase": overall_risk_increase,
        "timestamp": datetime.utcnow().isoformat(),
        "changes": sorted(
            changes,
            key=lambda x: (not x["is_regression"], x["risk_score"]),
            reverse=True
        ),
    }


def _generate_remediation(path: str, old_val, new_val, is_regression: bool) -> str:
    """Generate specific remediation steps for a config change."""
    
    # Root account MFA
    if "root_account_mfa" in path and is_regression:
        return "1. Sign in as root user\n2. Activate MFA via AWS Management Console\n3. Choose supported MFA device (hardware or virtual)\n4. Verify device is activated"
    
    # CloudTrail
    if "cloudtrail.enabled" in path and is_regression:
        return "1. Open CloudTrail console\n2. Create new trail\n3. Enable multi-region logging\n4. Enable log file validation\n5. Specify S3 bucket for logs"
    
    # CloudTrail log validation
    if "cloudtrail.log_validation" in path and is_regression:
        return "1. Go to CloudTrail console\n2. Select trail\n3. Edit trail \n4. Enable 'Log file validation'"
    
    # VPC Flow Logs
    if "vpc.flow_logs_enabled" in path and is_regression:
        return "1. Open VPC console\n2. Select VPCs\n3. Click 'Flow Logs'\n4. Create VPC Flow Log\n5. Set destination (S3 or CloudWatch Logs)\n6. IAM role with permissions"
    
    # Security Hub
    if "security_hub.enabled" in path and is_regression:
        return "1. Open Security Hub console\n2. Click 'Go to Security Hub'\n3. Click 'Enable Security Hub'\n4. Review standards and pricing\n5. Click 'Enable Security Hub'"
    
    # GuardDuty
    if "guardduty.enabled" in path and is_regression:
        return "1. Open GuardDuty console\n2. Click 'Get Started'\n3. Review pricing\n4. Click 'Enable GuardDuty'"
    
    # WAF
    if "waf.enabled" in path and is_regression:
        return "1. Open WAF & Shield console\n2. Create IP set or rate-based rule\n3. Create ACL with rules\n4. Associate with CloudFront/ALB/API Gateway"
    
    # Password policy
    if "password_policy" in path and is_regression:
        return f"1. Open IAM console\n2. Click 'Account settings'\n3. Set minimum password length to 14+\n4. Require uppercase, lowercase, numbers, symbols\n5. Set expiration interval to 90 days"
    
    # Default
    return f"Remediate by restoring '{path}' to previous secure state: {old_val}"


def _generate_s3_remediation(key: str, old_val, new_val) -> str:
    """Generate S3-specific remediation steps."""
    
    if key == "public_access" and old_val is False and new_val is True:
        return "1. Open S3 console\n2. Select bucket\n3. Click 'Permissions'\n4. Block all public access\n5. Block public access to ACLs and policies"
    
    elif key == "encryption" and old_val is True and new_val is False:
        return "1. Open S3 console\n2. Select bucket\n3. Click 'Properties'\n4. Select 'Default encryption'\n5. Choose 'SSE-S3' or 'SSE-KMS'\n6. Save"
    
    elif key == "logging" and old_val is True and new_val is False:
        return "1. Open S3 console\n2. Select bucket\n3. Click 'Properties'\n4. Enable 'Server access logging'\n5. Specify target bucket for logs"
    
    elif key == "versioning" and old_val is True and new_val is False:
        return "1. Open S3 console\n2. Select bucket\n3. Click 'Properties'\n4. Click 'Versioning'\n5. Select 'Enable' (note: cannot disable, only suspend)"
    
    elif key == "mfa_delete" and old_val is True and new_val is False:
        return "1. Root account required — sign in as root\n2. Open S3 console\n3. Select bucket\n4. Click 'Properties' → 'Versioning'\n5. Re-enable 'MFA delete'"
    
    return f"Restore S3 bucket '{key}' setting to secure state"


def _generate_rds_remediation(key: str, old_val, new_val) -> str:
    """Generate RDS-specific remediation steps."""
    
    if key == "publicly_accessible" and old_val is False and new_val is True:
        return "1. Open RDS console\n2. Select DB instance\n3. Click 'Modify'\n4. Uncheck 'Publicly accessible'\n5. Apply immediately or wait for maintenance window"
    
    elif key == "encryption" and old_val is True and new_val is False:
        return "1. Create encrypted snapshot of DB\n2. Restore from snapshot with encryption\n3. Update connection strings in application\n4. Delete unencrypted DB"
    
    elif key == "backup_enabled" and old_val is True and new_val is False:
        return "1. Open RDS console\n2. Select DB instance\n3. Click 'Modify'\n4. Set 'Backup retention period' to 7+ days\n5. Apply changes"
    
    elif key == "multi_az" and old_val is True and new_val is False:
        return "1. Open RDS console\n2. Select DB instance\n3. Click 'Modify'\n4. Check 'Multi-AZ deployment'\n5. Apply during maintenance window"
    
    elif key == "enhanced_monitoring" and old_val is True and new_val is False:
        return "1. Open RDS console\n2. Select DB instance\n3. Click 'Modify'\n4. Enable 'Enhanced monitoring'\n5. Choose monitoring role or create new IAM role"
    
    return f"Restore RDS DB '{key}' setting to secure state"
