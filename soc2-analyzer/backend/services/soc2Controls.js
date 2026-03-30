const SOC2_CONTROLS = [
  {
    id: "CC6.1",
    title: "Logical Access Controls",
    description: "Restrict logical access to system resources",
    check: (config) => {
      const issues = [];
      if (config.iam?.root_account_mfa === false) {
        issues.push("Root account MFA is disabled");
      }
      const usersWithoutMFA = config.iam?.users?.filter(u => !u.mfa_active) || [];
      if (usersWithoutMFA.length > 0) {
        issues.push(`${usersWithoutMFA.length} user(s) don't have MFA enabled: ${usersWithoutMFA.map(u => u.username).join(', ')}`);
      }
      const usersWithMultipleKeys = config.iam?.users?.filter(u => u.access_keys > 1) || [];
      if (usersWithMultipleKeys.length > 0) {
        issues.push(`${usersWithMultipleKeys.length} user(s) have multiple access keys`);
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "CRITICAL" : null
      };
    }
  },
  {
    id: "CC6.2",
    title: "Password Policy",
    description: "Enforce strong password requirements",
    check: (config) => {
      const issues = [];
      const policy = config.iam?.password_policy;
      if (policy?.minimum_length < 12) {
        issues.push(`Password minimum length is ${policy.minimum_length}, should be at least 12`);
      }
      if (!policy?.require_uppercase) {
        issues.push("Uppercase characters not required in passwords");
      }
      if (!policy?.require_symbols) {
        issues.push("Special symbols not required in passwords");
      }
      if (policy?.max_password_age > 90) {
        issues.push(`Password expiry is ${policy.max_password_age} days, should be 90 or less`);
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "HIGH" : null
      };
    }
  },
  {
    id: "CC7.2",
    title: "Audit Logging",
    description: "Monitor and log system activity",
    check: (config) => {
      const issues = [];
      if (!config.cloudtrail?.enabled) {
        issues.push("AWS CloudTrail is not enabled — no audit logs of account activity");
      }
      if (!config.cloudtrail?.multi_region) {
        issues.push("CloudTrail is not enabled for all regions");
      }
      if (!config.cloudtrail?.log_validation) {
        issues.push("CloudTrail log file validation is disabled");
      }
      if (!config.vpc?.flow_logs_enabled) {
        issues.push("VPC Flow Logs are disabled — network traffic not being logged");
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "CRITICAL" : null
      };
    }
  },
  {
    id: "CC9.2",
    title: "Data Encryption at Rest",
    description: "Encrypt sensitive data stored in the system",
    check: (config) => {
      const issues = [];
      const unencryptedBuckets = config.s3?.buckets?.filter(b => !b.encryption) || [];
      if (unencryptedBuckets.length > 0) {
        issues.push(`S3 buckets without encryption: ${unencryptedBuckets.map(b => b.name).join(', ')}`);
      }
      const unencryptedDBs = config.rds?.instances?.filter(db => !db.encryption) || [];
      if (unencryptedDBs.length > 0) {
        issues.push(`RDS databases without encryption: ${unencryptedDBs.map(db => db.name).join(', ')}`);
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "CRITICAL" : null
      };
    }
  },
  {
    id: "CC6.6",
    title: "Public Access Controls",
    description: "Prevent unauthorized public access to resources",
    check: (config) => {
      const issues = [];
      const publicBuckets = config.s3?.buckets?.filter(b => b.public_access) || [];
      if (publicBuckets.length > 0) {
        issues.push(`Public S3 buckets found: ${publicBuckets.map(b => b.name).join(', ')}`);
      }
      const publicDBs = config.rds?.instances?.filter(db => db.publicly_accessible) || [];
      if (publicDBs.length > 0) {
        issues.push(`Publicly accessible RDS instances: ${publicDBs.map(db => db.name).join(', ')}`);
      }
      const openSSH = config.vpc?.security_groups?.some(sg =>
        sg.inbound_rules?.some(r => r.port === 22 && r.source === "0.0.0.0/0")
      );
      if (openSSH) {
        issues.push("SSH port 22 is open to the entire internet (0.0.0.0/0)");
      }
      const openMySQL = config.vpc?.security_groups?.some(sg =>
        sg.inbound_rules?.some(r => r.port === 3306 && r.source === "0.0.0.0/0")
      );
      if (openMySQL) {
        issues.push("MySQL port 3306 is open to the entire internet (0.0.0.0/0)");
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "CRITICAL" : null
      };
    }
  },
  {
    id: "A1.2",
    title: "Backup and Recovery",
    description: "Ensure data backup and recovery procedures",
    check: (config) => {
      const issues = [];
      const noBackupDBs = config.rds?.instances?.filter(db => !db.backup_enabled) || [];
      if (noBackupDBs.length > 0) {
        issues.push(`RDS instances without backup: ${noBackupDBs.map(db => db.name).join(', ')}`);
      }
      const shortRetention = config.rds?.instances?.filter(db => db.backup_retention_days < 30) || [];
      if (shortRetention.length > 0) {
        issues.push(`RDS backup retention too short (${shortRetention[0]?.backup_retention_days} days), should be 30+ days`);
      }
      const noVersioning = config.s3?.buckets?.filter(b => !b.versioning) || [];
      if (noVersioning.length > 0) {
        issues.push(`S3 buckets without versioning: ${noVersioning.map(b => b.name).join(', ')}`);
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "HIGH" : null
      };
    }
  },
  {
    id: "CC7.1",
    title: "Threat Detection",
    description: "Monitor for security threats and anomalies",
    check: (config) => {
      const issues = [];
      if (!config.guardduty?.enabled) {
        issues.push("AWS GuardDuty is not enabled — no threat detection active");
      }
      if (!config.config_service?.enabled) {
        issues.push("AWS Config is not enabled — no configuration compliance monitoring");
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "HIGH" : null
      };
    }
  },
  {
    id: "CC8.1",
    title: "S3 Access Logging",
    description: "Log access to storage systems",
    check: (config) => {
      const issues = [];
      const noLogging = config.s3?.buckets?.filter(b => !b.logging) || [];
      if (noLogging.length > 0) {
        issues.push(`S3 buckets without access logging: ${noLogging.map(b => b.name).join(', ')}`);
      }
      return {
        passed: issues.length === 0,
        issues,
        severity: issues.length > 0 ? "MEDIUM" : null
      };
    }
  }
];

function runAllChecks(awsConfig) {
  const results = SOC2_CONTROLS.map(control => {
    const result = control.check(awsConfig);
    return {
      id: control.id,
      title: control.title,
      description: control.description,
      passed: result.passed,
      issues: result.issues,
      severity: result.severity
    };
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  return { results, score, passed, total };
}

module.exports = { runAllChecks, SOC2_CONTROLS };
