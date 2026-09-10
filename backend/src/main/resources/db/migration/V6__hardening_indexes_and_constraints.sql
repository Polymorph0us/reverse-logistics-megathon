-- Add version columns for optimistic locking
ALTER TABLE return_bags ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE master_consignments ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Ensure batch has version
ALTER TABLE batches ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Set initial values to 0 where null
UPDATE return_bags SET version = 0 WHERE version IS NULL;
UPDATE master_consignments SET version = 0 WHERE version IS NULL;
UPDATE return_requests SET version = 0 WHERE version IS NULL;
UPDATE disputes SET version = 0 WHERE version IS NULL;
UPDATE batches SET version = 0 WHERE version IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_return_bags_tracking_id ON return_bags (tracking_id);
CREATE INDEX IF NOT EXISTS idx_return_bags_status ON return_bags (status);
CREATE INDEX IF NOT EXISTS idx_return_bags_org_id ON return_bags (current_organization_id);

CREATE INDEX IF NOT EXISTS idx_master_consignments_status ON master_consignments (status);
CREATE INDEX IF NOT EXISTS idx_master_consignments_distributor_id ON master_consignments (distributor_id);
CREATE INDEX IF NOT EXISTS idx_master_consignments_target_manufacturer_id ON master_consignments (target_manufacturer_id);

CREATE INDEX IF NOT EXISTS idx_batches_status ON batches (current_status);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date ON batches (expiry_date);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts (status);

-- Constraints
ALTER TABLE return_bags ADD CONSTRAINT check_return_bags_qty_positive CHECK (quantity >= 0);
ALTER TABLE master_consignments ADD CONSTRAINT check_master_consignments_qty_positive CHECK (total_quantity >= 0);
ALTER TABLE master_consignments ADD CONSTRAINT check_master_consignments_bags_positive CHECK (total_bags >= 0);
