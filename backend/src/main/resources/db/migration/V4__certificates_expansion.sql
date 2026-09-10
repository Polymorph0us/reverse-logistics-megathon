-- V4__certificates_expansion.sql
-- Expand certificates table with tracking, document content, and fix constraints

-- Add new columns if not already present
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(50);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS document_content TEXT;

-- Make blockchain_tx_id optional (no longer required since blockchain is removed)
ALTER TABLE certificates ALTER COLUMN blockchain_tx_id DROP NOT NULL;

-- Update existing certificates to have issued_at if null
UPDATE certificates SET issued_at = created_at WHERE issued_at IS NULL;

-- Add unique constraint on certificate_hash if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'certificates_certificate_hash_key'
    ) THEN
        ALTER TABLE certificates ADD CONSTRAINT certificates_certificate_hash_key UNIQUE (certificate_hash);
    END IF;
END $$;

-- Create index for certificate lookups
CREATE INDEX IF NOT EXISTS idx_certificates_batch_id ON certificates(batch_id);
CREATE INDEX IF NOT EXISTS idx_certificates_destruction_id ON certificates(destruction_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);
