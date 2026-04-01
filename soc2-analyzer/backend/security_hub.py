"""
AWS Security Hub Integration
Pulls real security findings from AWS Security Hub and maps them to our control framework.
Also pulls from AWS Config conformance packs, GuardDuty, and CloudTrail.

This replaces manual JSON upload with live AWS scanning.
"""

import boto3
import json
from datetime import datetime


def _get_clients(access_key: str, secret_key: str, region: str = "ap-south-1"):
    """Create boto3 clients with user-provided credentials."""
    session = boto3.Session(
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )
    return {
        "securityhub": session.client("securityhub"),
        "iam": session.client("iam"),
        "s3": session.client("s3"),
        "rds": session.client("rds"),
        "cloudtrail": session.client("cloudtrail"),
        "guardduty": session.client("guardduty"),
        "config": session.client("config"),
        "ec2": session.client("ec2"),
        "kms": session.client("kms"),
        "sts": session.client("sts"),
    }


# ══════════════════════════════════════════════════
# SECURITY HUB FINDINGS
# ══════════════════════════════════════════════════

def get_security_hub_findings(clients: dict) -> list:
    """Pull findings from AWS Security Hub."""
    try:
        response = clients["securityhub"].get_findings(
            Filters={
                "RecordState": [{"Value": "ACTIVE", "Comparison": "EQUALS"}],
                "WorkflowStatus": [{"Value": "NEW", "Comparison": "EQUALS"}],
            },
            MaxResults=100,
        )
        return response.get("Findings", [])
    except Exception as e:
        print(f"Security Hub not enabled or no findings: {e}")
        return []


def map_securityhub_to_controls(findings: list) -> dict:
    """Map Security Hub findings to our SOC 2 control IDs."""
    # Security Hub generator ID patterns → our control mapping
    FINDING_MAP = {
        "iam": {"controls": ["CC6.1", "CC6.2", "CC6.3"], "category": "Access Control"},
        "s3": {"controls": ["CC6.6", "CC9.2", "C1.1"], "category": "Data Protection"},
        "rds": {"controls": ["CC9.2", "A1.1", "A1.2"], "category": "Database Security"},
        "cloudtrail": {"controls": ["CC7.2", "CC8.1"], "category": "Audit Logging"},
        "guardduty": {"controls": ["CC7.1", "CC3.2"], "category": "Threat Detection"},
        "ec2": {"controls": ["CC6.6", "CC5.2"], "category": "Network Security"},
        "kms": {"controls": ["CC9.2"], "category": "Encryption"},
        "config": {"controls": ["CC4.1", "CC5.1"], "category": "Monitoring"},
        "securityhub": {"controls": ["CC4.1"], "category": "Security Posture"},
        "sns": {"controls": ["CC7.3", "CC4.2"], "category": "Alerting"},
        "cloudwatch": {"controls": ["CC7.3", "PI1.2"], "category": "Monitoring"},
        "waf": {"controls": ["CC5.2", "PI1.1"], "category": "Application Security"},
    }

    mapped = {}
    for finding in findings:
        generator = finding.get("GeneratorId", "").lower()
        severity = finding.get("Severity", {}).get("Label", "MEDIUM")
        title = finding.get("Title", "")
        description = finding.get("Description", "")
        compliance_status = finding.get("Compliance", {}).get("Status", "FAILED")

        # Match finding to our controls
        for key, mapping in FINDING_MAP.items():
            if key in generator:
                for control_id in mapping["controls"]:
                    if control_id not in mapped:
                        mapped[control_id] = {
                            "findings": [],
                            "worst_severity": severity,
                            "category": mapping["category"],
                        }
                    mapped[control_id]["findings"].append({
                        "title": title,
                        "severity": severity,
                        "status": compliance_status,
                        "generator": finding.get("GeneratorId", ""),
                    })
                    # Track worst severity
                    sev_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFORMATIONAL": 0}
                    if sev_order.get(severity, 0) > sev_order.get(mapped[control_id]["worst_severity"], 0):
                        mapped[control_id]["worst_severity"] = severity
                break

    return mapped


# ══════════════════════════════════════════════════
# LIVE AWS SCANNING (direct boto3 checks)
# ══════════════════════════════════════════════════

def scan_iam(clients: dict) -> dict:
    """Scan IAM configuration."""
    iam = clients["iam"]
    result = {"root_account_mfa": False, "users": [], "password_policy": {}, "roles_defined": False}

    try:
        # Check root MFA
        summary = iam.get_account_authorization_details(Filter=["User"])
        mfa_devices = iam.list_virtual_mfa_devices()
        root_mfa = any(d["SerialNumber"].endswith("root-account-mfa-device") for d in mfa_devices.get("VirtualMFADevices", []))
        result["root_account_mfa"] = root_mfa

        # List users
        users_response = iam.list_users()
        for user in users_response.get("Users", []):
            username = user["UserName"]
            mfa = iam.list_mfa_devices(UserName=username)
            keys = iam.list_access_keys(UserName=username)
            result["users"].append({
                "username": username,
                "mfa_active": len(mfa.get("MFADevices", [])) > 0,
                "access_keys": len(keys.get("AccessKeyMetadata", [])),
            })

        # Password policy
        try:
            policy = iam.get_account_password_policy()["PasswordPolicy"]
            result["password_policy"] = {
                "minimum_length": policy.get("MinimumPasswordLength", 0),
                "require_uppercase": policy.get("RequireUppercaseCharacters", False),
                "require_numbers": policy.get("RequireNumbers", False),
                "require_symbols": policy.get("RequireSymbols", False),
                "max_password_age": policy.get("MaxPasswordAge", 0),
            }
        except iam.exceptions.NoSuchEntityException:
            result["password_policy"] = {"minimum_length": 0, "require_uppercase": False, "require_numbers": False, "require_symbols": False, "max_password_age": 0}

        # Check roles
        roles = iam.list_roles()
        result["roles_defined"] = len(roles.get("Roles", [])) > 2  # AWS always has some default roles
    except Exception as e:
        print(f"IAM scan error: {e}")

    return result


def scan_s3(clients: dict) -> dict:
    """Scan S3 bucket configurations."""
    s3 = clients["s3"]
    buckets = []

    try:
        response = s3.list_buckets()
        for bucket in response.get("Buckets", []):
            name = bucket["Name"]
            b = {"name": name, "encryption": False, "public_access": False, "versioning": False, "logging": False}

            try:
                enc = s3.get_bucket_encryption(Bucket=name)
                b["encryption"] = True
            except:
                b["encryption"] = False

            try:
                pub = s3.get_public_access_block(Bucket=name)
                config = pub.get("PublicAccessBlockConfiguration", {})
                b["public_access"] = not (config.get("BlockPublicAcls", False) and config.get("BlockPublicPolicy", False))
            except:
                b["public_access"] = True  # No block = potentially public

            try:
                ver = s3.get_bucket_versioning(Bucket=name)
                b["versioning"] = ver.get("Status") == "Enabled"
            except:
                pass

            try:
                log = s3.get_bucket_logging(Bucket=name)
                b["logging"] = "LoggingEnabled" in log
            except:
                pass

            buckets.append(b)
    except Exception as e:
        print(f"S3 scan error: {e}")

    return {"buckets": buckets}


def scan_cloudtrail(clients: dict) -> dict:
    """Scan CloudTrail configuration."""
    ct = clients["cloudtrail"]
    result = {"enabled": False, "multi_region": False, "log_validation": False, "data_events": False}

    try:
        trails = ct.describe_trails().get("trailList", [])
        if trails:
            result["enabled"] = True
            for trail in trails:
                if trail.get("IsMultiRegionTrail"):
                    result["multi_region"] = True
                if trail.get("LogFileValidationEnabled"):
                    result["log_validation"] = True
                # Check for data events
                try:
                    events = ct.get_event_selectors(TrailName=trail["TrailARN"])
                    for selector in events.get("EventSelectors", []):
                        if selector.get("DataResources"):
                            result["data_events"] = True
                except:
                    pass
    except Exception as e:
        print(f"CloudTrail scan error: {e}")

    return result


def scan_rds(clients: dict) -> dict:
    """Scan RDS instances."""
    rds = clients["rds"]
    instances = []

    try:
        response = rds.describe_db_instances()
        for db_inst in response.get("DBInstances", []):
            instances.append({
                "name": db_inst["DBInstanceIdentifier"],
                "encryption": db_inst.get("StorageEncrypted", False),
                "backup_enabled": db_inst.get("BackupRetentionPeriod", 0) > 0,
                "backup_retention_days": db_inst.get("BackupRetentionPeriod", 0),
                "publicly_accessible": db_inst.get("PubliclyAccessible", False),
                "multi_az": db_inst.get("MultiAZ", False),
            })
    except Exception as e:
        print(f"RDS scan error: {e}")

    return {"instances": instances}


def scan_guardduty(clients: dict) -> dict:
    """Check if GuardDuty is enabled."""
    gd = clients["guardduty"]
    try:
        detectors = gd.list_detectors()
        return {"enabled": len(detectors.get("DetectorIds", [])) > 0}
    except:
        return {"enabled": False}


def scan_vpc(clients: dict) -> dict:
    """Scan VPC security groups and flow logs."""
    ec2 = clients["ec2"]
    result = {"flow_logs_enabled": False, "security_groups": []}

    try:
        # Check flow logs
        flow_logs = ec2.describe_flow_logs()
        result["flow_logs_enabled"] = len(flow_logs.get("FlowLogs", [])) > 0

        # Check security groups for open ports
        sgs = ec2.describe_security_groups()
        for sg in sgs.get("SecurityGroups", []):
            sg_info = {"name": sg["GroupName"], "inbound_rules": []}
            for rule in sg.get("IpPermissions", []):
                for ip_range in rule.get("IpRanges", []):
                    if ip_range.get("CidrIp") == "0.0.0.0/0":
                        port = rule.get("FromPort", 0)
                        sg_info["inbound_rules"].append({
                            "port": port,
                            "source": "0.0.0.0/0",
                        })
            if sg_info["inbound_rules"]:
                result["security_groups"].append(sg_info)
    except Exception as e:
        print(f"VPC scan error: {e}")

    return result


def scan_config_service(clients: dict) -> dict:
    """Check AWS Config status."""
    config = clients["config"]
    try:
        recorders = config.describe_configuration_recorders()
        enabled = len(recorders.get("ConfigurationRecorders", [])) > 0
        rules = config.describe_config_rules() if enabled else {"ConfigRules": []}
        return {
            "enabled": enabled,
            "rules_configured": len(rules.get("ConfigRules", [])) > 0,
        }
    except:
        return {"enabled": False, "rules_configured": False}


def scan_kms(clients: dict) -> dict:
    """Check KMS key configuration."""
    kms = clients["kms"]
    try:
        keys = kms.list_keys()
        return {"keys_configured": len(keys.get("Keys", [])) > 0}
    except:
        return {"keys_configured": False}


# ══════════════════════════════════════════════════
# MAIN: Full AWS Account Scan
# ══════════════════════════════════════════════════

def scan_aws_account(access_key: str, secret_key: str, region: str = "ap-south-1") -> dict:
    """
    Full scan of an AWS account. Returns a config dict in the same format
    as our sample JSON, so it can be passed directly to run_all_checks().
    """
    clients = _get_clients(access_key, secret_key, region)

    # Get account info
    try:
        identity = clients["sts"].get_caller_identity()
        account_id = identity["Account"]
    except:
        account_id = "unknown"

    print(f"Scanning AWS account {account_id} in {region}...")

    # Run all scans
    iam_data = scan_iam(clients)
    s3_data = scan_s3(clients)
    ct_data = scan_cloudtrail(clients)
    rds_data = scan_rds(clients)
    gd_data = scan_guardduty(clients)
    vpc_data = scan_vpc(clients)
    config_data = scan_config_service(clients)
    kms_data = scan_kms(clients)

    # Try Security Hub findings
    hub_findings = get_security_hub_findings(clients)
    hub_mapped = map_securityhub_to_controls(hub_findings)

    # Build config in our standard format
    config = {
        "company_name": f"AWS Account {account_id}",
        "industry": "saas_startup",
        "aws_account_id": account_id,
        "region": region,
        "scan_source": "live_aws",
        "scanned_at": datetime.utcnow().isoformat(),

        # Organization defaults (can't be scanned — organizational controls)
        "organization": {
            "security_officer_assigned": False,
            "security_policy_exists": False,
            "board_oversight": False,
            "background_checks": False,
            "security_training": False,
            "acceptable_use_policy": False,
            "security_communication_plan": False,
            "incident_reporting_process": False,
            "privacy_policy_published": False,
            "security_page_published": False,
            "breach_notification_process": False,
            "risk_register": False,
            "threat_model": False,
            "remediation_tracking": False,
            "control_documentation": False,
            "change_management_process": False,
            "output_validation": False,
            "data_processing_agreement": False,
            "consent_management": False,
            "data_subject_request_process": False,
            "retention_policy": False,
            "cross_border_transfer_policy": False,
        },

        "iam": iam_data,
        "s3": s3_data,
        "cloudtrail": ct_data,
        "rds": rds_data,
        "guardduty": gd_data,
        "vpc": vpc_data,
        "config_service": config_data,
        "kms": kms_data,

        # Services we can't easily scan — default to disabled
        "security_hub": {"enabled": len(hub_findings) > 0},
        "inspector": {"enabled": False},
        "macie": {"enabled": False},
        "waf": {"enabled": False},
        "shield": {"enabled": False},
        "trusted_advisor": {"enabled": False},
        "access_analyzer": {"enabled": False},
        "cloudfront": {"https_enforced": True},
        "elb": {"ssl_enabled": True},
        "autoscaling": {"enabled": False},
        "systems_manager": {"patch_compliance": False},
        "api_gateway": {"request_validation": False},
        "xray": {"enabled": False},
        "sns": {"security_alerts_configured": False},
        "cloudwatch": {"alarm_configured": False, "log_groups_configured": False},
        "route53": {"health_checks": False},
        "codepipeline": {"enabled": False},
        "incident_response": {"plan_exists": False, "contact_list": False, "runbooks": False},
        "disaster_recovery": {"plan_exists": False, "cross_region_backup": False, "rto_defined": False, "rpo_defined": False},

        # Security Hub findings (extra data)
        "security_hub_findings": hub_mapped,
        "security_hub_finding_count": len(hub_findings),
    }

    print(f"Scan complete: {len(s3_data['buckets'])} S3 buckets, {len(rds_data['instances'])} RDS instances, {len(iam_data['users'])} IAM users")
    return config
