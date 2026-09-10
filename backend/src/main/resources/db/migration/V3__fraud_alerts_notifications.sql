-- Add status column to fraud_alerts
ALTER TABLE fraud_alerts
ADD COLUMN status VARCHAR(50) DEFAULT 'NEW';

-- Migrate existing resolved column data to status
UPDATE fraud_alerts
SET status = 'RESOLVED'
WHERE resolved = TRUE;

-- Drop resolved column
ALTER TABLE fraud_alerts
DROP COLUMN resolved;
