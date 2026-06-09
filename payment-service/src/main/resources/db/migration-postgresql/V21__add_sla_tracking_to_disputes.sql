ALTER TABLE dispute ADD COLUMN sla_deadline TIMESTAMP DEFAULT NULL;

ALTER TABLE dispute ADD COLUMN sla_status VARCHAR(50) DEFAULT 'OPEN';

ALTER TABLE dispute ADD COLUMN escalated BOOLEAN DEFAULT FALSE;

ALTER TABLE dispute ADD COLUMN escalated_at TIMESTAMP DEFAULT NULL;

CREATE INDEX idx_dispute_escalated ON dispute (escalated, escalated_at);

CREATE INDEX idx_dispute_sla_status ON dispute (sla_status, dispute_status);
