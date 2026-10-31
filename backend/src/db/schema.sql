-- ====================================================================
-- Stellar-Guard Institutional Compliance & Freeze Governance Database Schema
-- Dialect: SQLite 3 / Standard ANSI SQL
-- Generated for audit and verification
-- ====================================================================

-- Audit Trail Table: Records all freeze, unfreeze, and admin voting actions
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target_address TEXT NOT NULL,
  asset_code TEXT NOT NULL,
  proposed_by TEXT NOT NULL,
  voter_address TEXT,
  vote_type TEXT,
  signature TEXT,
  timestamp INTEGER NOT NULL,
  ledger_sequence INTEGER,
  tx_hash TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_address);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- Webhook Subscriptions Table: Endpoints notified upon compliance events
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  events TEXT NOT NULL,
  secret TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhook_subscriptions(active);

-- Webhook Delivery History Table: Tracks outbound payload deliveries and retries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  success INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(subscription_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deliveries_sub ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON webhook_deliveries(created_at DESC);

-- Cursor State Checkpoint Table: Persistent streaming cursor for Horizon & Soroban RPC
CREATE TABLE IF NOT EXISTS horizon_cursors (
  cursor_id TEXT PRIMARY KEY,
  cursor_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Risk Assessments Cache Table: AML risk scores and evaluation metrics
CREATE TABLE IF NOT EXISTS risk_assessments (
  account_address TEXT PRIMARY KEY,
  risk_score INTEGER NOT NULL,
  severity TEXT NOT NULL,
  flagged_factors TEXT NOT NULL,
  evaluated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_score ON risk_assessments(risk_score DESC);
