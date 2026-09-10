-- V4__certificates_expansion.sql
-- Expand certificates table with full batch identity, product info, and file storage reference

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS batch_number VARCHAR(255);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS manufacturer_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS manufacturing_date DATE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS destruction_method VARCHAR(500);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS facility_license VARCHAR(255);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS file_storage_reference VARCHAR(500);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issuer_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP;

-- Update existing certificates to have issued_at if null
UPDATE certificates SET issued_at = created_at WHERE issued_at IS NULL;

-- Add foreign key constraints
ALTER TABLE certificates ADD CONSTRAINT fk_certificates_product FOREIGN KEY (product_id) REFERENCES products(product_id);
ALTER TABLE certificates ADD CONSTRAINT fk_certificates_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES organizations(organization_id);
ALTER TABLE certificates ADD CONSTRAINT fk_certificates_batch FOREIGN KEY (batch_id) REFERENCES batches(batch_id);
ALTER TABLE certificates ADD CONSTRAINT fk_certificates_issuer FOREIGN KEY (issuer_id) REFERENCES users(user_id);

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
