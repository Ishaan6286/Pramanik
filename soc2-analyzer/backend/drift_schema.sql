"""
Database Schema for Drift Detection & History

This file documents the Supabase tables needed for drift detection functionality.
Run these SQL statements in Supabase SQL Editor to create the schema.
"""

-- ─────────────────────────────────────────────────────────────────────────────
-- BASELINES TABLE (already created in db.py)
-- Stores the baseline configuration for comparison
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.baselines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baselines_company ON public.baselines(company_name);
CREATE INDEX IF NOT EXISTS idx_baselines_user ON public.baselines(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- DRIFT_HISTORY TABLE
-- Stores drift detection results for trending and alerting
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.drift_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL,
  total_changes INTEGER,
  regressions INTEGER,
  improvements INTEGER,
  critical_issues INTEGER,
  overall_risk_increase INTEGER,
  changes JSONB,
  baseline_id UUID REFERENCES public.baselines(id) ON DELETE SET NULL,
  analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drift_company ON public.drift_history(company_name);
CREATE INDEX IF NOT EXISTS idx_drift_user ON public.drift_history(user_id);
CREATE INDEX IF NOT EXISTS idx_drift_timestamp ON public.drift_history(analysis_timestamp DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- DRIFT_ALERTS TABLE (ENHANCED)
-- Triggers alerts for critical regressions with full audit trail
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.drift_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  drift_config_path TEXT,
  previous_value TEXT,
  current_value TEXT,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  affected_controls TEXT[],
  affected_frameworks TEXT[],
  explanation TEXT,
  remediation TEXT,
  
  -- Alert status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Acknowledgement tracking (NEW)
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Resolution tracking (NEW)
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Remediation tracking (NEW)
  remediation_applied TEXT,
  remediation_applied_by UUID,
  remediation_applied_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_company ON public.drift_alerts(company_name);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.drift_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.drift_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.drift_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_detected ON public.drift_alerts(detected_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- DRIFT_TRENDS TABLE
-- Aggregated metrics for dashboard trending
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.drift_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL,
  date DATE NOT NULL,
  avg_risk_score DECIMAL(5,2),
  total_changes INTEGER,
  total_regressions INTEGER,
  total_improvements INTEGER,
  critical_count INTEGER,
  high_count INTEGER,
  stability_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_name, date)
);

CREATE INDEX IF NOT EXISTS idx_trends_company_date ON public.drift_trends(company_name, date DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- DRIFT_AUDIT_LOG TABLE
-- Immutable log of all drift analysis for compliance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.drift_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL,
  action TEXT,
  drift_config_path TEXT,
  previous_value TEXT,
  current_value TEXT,
  severity TEXT,
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditlog_company ON public.drift_audit_log(company_name);
CREATE INDEX IF NOT EXISTS idx_auditlog_timestamp ON public.drift_audit_log(created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_drift_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS drift_alerts_update_timestamp
BEFORE UPDATE ON public.drift_alerts
FOR EACH ROW
EXECUTE FUNCTION update_drift_alerts_timestamp();


# ─────────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

-- Function to insert drift analysis result
CREATE OR REPLACE FUNCTION insert_drift_analysis(
  p_user_id UUID,
  p_company_name TEXT,
  p_total_changes INTEGER,
  p_regressions INTEGER,
  p_improvements INTEGER,
  p_critical_issues INTEGER,
  p_overall_risk INTEGER,
  p_changes JSONB,
  p_baseline_id UUID
) RETURNS UUID AS $$
DECLARE
  v_drift_id UUID;
BEGIN
  INSERT INTO drift_history (
    user_id, company_name, total_changes, regressions, improvements,
    critical_issues, overall_risk_increase, changes, baseline_id
  ) VALUES (
    p_user_id, p_company_name, p_total_changes, p_regressions, p_improvements,
    p_critical_issues, p_overall_risk, p_changes, p_baseline_id
  ) RETURNING id INTO v_drift_id;
  
  RETURN v_drift_id;
END;
$$ LANGUAGE plpgsql;


-- Function to create alert from drift change
CREATE OR REPLACE FUNCTION create_drift_alert(
  p_user_id UUID,
  p_company_name TEXT,
  p_change JSONB
) RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO drift_alerts (
    user_id, company_name, severity, drift_config_path,
    previous_value, current_value, risk_score,
    affected_controls, explanation, remediation
  ) VALUES (
    p_user_id,
    p_company_name,
    p_change->>'severity',
    p_change->>'config_path',
    p_change->>'previous_value',
    p_change->>'current_value',
    (p_change->>'risk_score')::INTEGER,
    (p_change->'affected_controls')::TEXT[],
    p_change->>'explanation',
    p_change->>'remediation'
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;


-- Update timestamps on changes
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_baselines_timestamp
BEFORE UPDATE ON baselines
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


# ─────────────────────────────────────────────────────────────────────────────
# ROW LEVEL SECURITY (Optional, for multi-tenant setup)
# ─────────────────────────────────────────────────────────────────────────────

-- ALTER TABLE drift_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE drift_alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE drift_audit_log ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY drift_history_policy ON drift_history
--   USING (auth.uid() = user_id OR user_id IS NULL);
-- 
-- CREATE POLICY drift_alerts_policy ON drift_alerts
--   USING (auth.uid() = user_id OR user_id IS NULL);
