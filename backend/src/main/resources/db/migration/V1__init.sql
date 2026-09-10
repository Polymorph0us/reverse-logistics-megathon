CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    city VARCHAR(100),
    state VARCHAR(100),
    compliance_score INT DEFAULT 100,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization_id UUID REFERENCES organizations(id)
);

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    unit_type VARCHAR(50)
);

CREATE TABLE batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(255) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(product_id),
    manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    original_quantity INT NOT NULL,
    current_quantity INT NOT NULL,
    unit VARCHAR(50),
    current_status VARCHAR(50) NOT NULL,
    current_owner_id UUID REFERENCES organizations(id),
    risk_score INT DEFAULT 0,
    risk_level VARCHAR(50) DEFAULT 'LOW',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    CONSTRAINT unique_batch_identity UNIQUE (manufacturer_id, batch_number, manufacturing_date, expiry_date)
);

CREATE INDEX idx_batches_number ON batches(batch_number);
CREATE INDEX idx_batches_expiry ON batches(expiry_date);
CREATE INDEX idx_batches_status ON batches(current_status);

CREATE TABLE batch_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(batch_id),
    event_type VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    location VARCHAR(255),
    quantity INT,
    evidence_refs TEXT,
    verification_info TEXT,
    hash VARCHAR(255) NOT NULL
);

CREATE TABLE return_requests (
    return_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(batch_id),
    requested_quantity INT NOT NULL,
    received_quantity INT,
    difference INT,
    reason TEXT,
    condition VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    initiated_by UUID NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    pickup_status VARCHAR(50),
    evidence TEXT
);

CREATE TABLE destruction_records (
    destruction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(batch_id),
    quantity INT NOT NULL,
    waste_facility_id UUID NOT NULL REFERENCES organizations(id),
    scheduled_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE certificates (
    certificate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(batch_id),
    destruction_id UUID NOT NULL REFERENCES destruction_records(destruction_id),
    quantity_destroyed INT NOT NULL,
    destruction_date TIMESTAMP NOT NULL,
    facility_id UUID NOT NULL REFERENCES organizations(id),
    certificate_hash VARCHAR(255) NOT NULL,
    blockchain_tx_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE evidences (
    evidence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    url_ref VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    hash VARCHAR(255) NOT NULL
);

CREATE TABLE fraud_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    batch_id UUID REFERENCES batches(batch_id),
    batch_number VARCHAR(255) NOT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    location VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE invalid_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer_id UUID NOT NULL REFERENCES organizations(id),
    batch_number VARCHAR(255) NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    invalidated_quantity INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
