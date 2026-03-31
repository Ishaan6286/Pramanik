"""
Drift Detector — Compares current AWS config against stored baseline.
Identifies what changed and which compliance frameworks are affected.
"""

from framework_mappings import FRAMEWORK_MAP

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


def _severity_for_controls(control_ids: list) -> str:
    """Return highest severity among affected controls."""
    from soc2_controls import run_all_checks
    severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
    max_sev = "LOW"
    for cid in control_ids:
        mapping = FRAMEWORK_MAP.get(cid, {})
        fw_count = mapping.get("frameworks_satisfied", 1)
        if fw_count >= 3:
            return "CRITICAL"
        elif fw_count >= 2 and severity_order.get(max_sev, 0) < 3:
            max_sev = "HIGH"
    return max_sev


def detect_drift(current_config: dict, baseline_config: dict) -> dict:
    """
    Compare current config against baseline.
    Returns list of changes with severity and affected frameworks.
    """
    changes = []

    # Check tracked config paths
    for path, control_ids in CONFIG_TO_CONTROLS.items():
        current_val = _get_nested(current_config, path)
        baseline_val = _get_nested(baseline_config, path)

        if current_val != baseline_val:
            # Determine if this is a regression (got worse) or improvement (got better)
            is_regression = (baseline_val is True and current_val is False) or \
                           (isinstance(baseline_val, (int, float)) and isinstance(current_val, (int, float)) and current_val < baseline_val)

            # Get affected frameworks
            affected_frameworks = []
            for cid in control_ids:
                mapping = FRAMEWORK_MAP.get(cid, {})
                if mapping.get("soc2"):
                    affected_frameworks.append({"framework": "SOC 2", "control": mapping["soc2"]["id"]})
                if mapping.get("iso27001"):
                    affected_frameworks.append({"framework": "ISO 27001", "control": mapping["iso27001"]["id"]})
                if mapping.get("hipaa"):
                    affected_frameworks.append({"framework": "HIPAA", "control": mapping["hipaa"]["id"]})

            changes.append({
                "config_path": path,
                "previous_value": baseline_val,
                "current_value": current_val,
                "is_regression": is_regression,
                "severity": _severity_for_controls(control_ids) if is_regression else "INFO",
                "affected_controls": control_ids,
                "affected_frameworks": affected_frameworks,
            })

    # Check S3 buckets
    current_buckets = {b["name"]: b for b in current_config.get("s3", {}).get("buckets", [])}
    baseline_buckets = {b["name"]: b for b in baseline_config.get("s3", {}).get("buckets", [])}

    for name, bucket in current_buckets.items():
        if name not in baseline_buckets:
            changes.append({
                "config_path": f"s3.buckets.{name}",
                "previous_value": None,
                "current_value": "new bucket",
                "is_regression": False,
                "severity": "INFO",
                "affected_controls": ["CC6.6", "CC9.2"],
                "affected_frameworks": [],
            })
        else:
            old = baseline_buckets[name]
            for key in ["encryption", "public_access", "versioning", "logging"]:
                if bucket.get(key) != old.get(key):
                    is_reg = (old.get(key) is True and bucket.get(key) is False)
                    if key == "public_access":
                        is_reg = (old.get(key) is False and bucket.get(key) is True)
                    changes.append({
                        "config_path": f"s3.buckets.{name}.{key}",
                        "previous_value": old.get(key),
                        "current_value": bucket.get(key),
                        "is_regression": is_reg,
                        "severity": "CRITICAL" if is_reg and key in ["encryption", "public_access"] else "MEDIUM",
                        "affected_controls": ["CC9.2"] if key == "encryption" else ["CC6.6"] if key == "public_access" else ["A1.2"],
                        "affected_frameworks": [],
                    })

    # Check RDS instances
    current_rds = {db["name"]: db for db in current_config.get("rds", {}).get("instances", [])}
    baseline_rds = {db["name"]: db for db in baseline_config.get("rds", {}).get("instances", [])}

    for name, db in current_rds.items():
        if name in baseline_rds:
            old = baseline_rds[name]
            for key in ["encryption", "publicly_accessible", "multi_az", "backup_enabled"]:
                if db.get(key) != old.get(key):
                    is_reg = (old.get(key) is True and db.get(key) is False)
                    if key == "publicly_accessible":
                        is_reg = (old.get(key) is False and db.get(key) is True)
                    changes.append({
                        "config_path": f"rds.instances.{name}.{key}",
                        "previous_value": old.get(key),
                        "current_value": db.get(key),
                        "is_regression": is_reg,
                        "severity": "CRITICAL" if is_reg else "INFO",
                        "affected_controls": ["CC9.2"] if key == "encryption" else ["CC6.6"],
                        "affected_frameworks": [],
                    })

    # Summary
    regressions = [c for c in changes if c["is_regression"]]
    improvements = [c for c in changes if not c["is_regression"] and c["severity"] != "INFO"]

    return {
        "total_changes": len(changes),
        "regressions": len(regressions),
        "improvements": len(improvements),
        "changes": sorted(changes, key=lambda x: (not x["is_regression"], x["severity"] != "CRITICAL")),
    }
