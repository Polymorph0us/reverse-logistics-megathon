-- V5__return_bags_consignments_disputes.sql
-- Add tables for TER-Bag / Return-Bag tracking, Master Consignment Manifest, and Dispute resolution

CREATE TABLE IF NOT EXISTS return_bags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_id VARCHAR(50) NOT NULL UNIQUE,
    tracking_id VARCHAR(50) NOT NULL,
    batch_id UUID REFERENCES batches(batch_id),
    quantity INT NOT NULL,
    current_organization_id UUID NOT NULL REFERENCES organizations(id),
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_bags_bag_id ON return_bags(bag_id);
CREATE INDEX IF NOT EXISTS idx_return_bags_tracking_id ON return_bags(tracking_id);
CREATE INDEX IF NOT EXISTS idx_return_bags_status ON return_bags(status);

CREATE TABLE IF NOT EXISTS master_consignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mcm_id VARCHAR(50) NOT NULL UNIQUE,
    distributor_id UUID NOT NULL REFERENCES organizations(id),
    target_manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    total_bags INT NOT NULL DEFAULT 0,
    total_quantity INT NOT NULL DEFAULT 0,
    mcm_hash VARCHAR(512),
    seal_id VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    dispatched_at TIMESTAMP,
    received_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_consignments_mcm_id ON master_consignments(mcm_id);
CREATE INDEX IF NOT EXISTS idx_master_consignments_status ON master_consignments(status);
CREATE INDEX IF NOT EXISTS idx_master_consignments_distributor ON master_consignments(distributor_id);

CREATE TABLE IF NOT EXISTS consignment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mcm_id UUID NOT NULL REFERENCES master_consignments(id),
    return_bag_id UUID NOT NULL REFERENCES return_bags(id),
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(mcm_id, return_bag_id)
);

CREATE INDEX IF NOT EXISTS idx_consignment_items_mcm ON consignment_items(mcm_id);

CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(50) NOT NULL,
    return_bag_id UUID REFERENCES return_bags(id),
    reporter_organization_id UUID NOT NULL REFERENCES organizations(id),
    expected_quantity INT NOT NULL,
    received_quantity INT NOT NULL,
    difference INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disputes_tracking_id ON disputes(tracking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Update certificates table to add tracking_id and document_content if not present
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(50);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS document_content TEXT;
ALTER TABLE certificates ALTER COLUMN blockchain_tx_id DROP NOT NULL;
