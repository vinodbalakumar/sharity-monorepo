-- Add SLA tracking columns to dispute table
-- Purpose: Track dispute SLA deadline and auto-escalate breaches

ALTER TABLE dispute ADD COLUMN sla_deadline DATETIME DEFAULT NULL COMMENT 'Dispute resolution deadline (14 days from creation)';

ALTER TABLE dispute ADD COLUMN sla_status VARCHAR(50) DEFAULT 'OPEN' COMMENT 'SLA Status: OPEN, WARNING (3 days left), BREACHED';

ALTER TABLE dispute ADD COLUMN escalated BOOLEAN DEFAULT FALSE COMMENT 'Whether dispute has been escalated due to SLA breach';

ALTER TABLE dispute ADD COLUMN escalated_at DATETIME DEFAULT NULL COMMENT 'Timestamp when dispute was escalated';

-- Add index for escalated disputes query
CREATE INDEX idx_dispute_escalated ON dispute(escalated, escalated_at);

-- Add index for SLA deadline query
CREATE INDEX idx_dispute_sla_status ON dispute(sla_status, dispute_status);
