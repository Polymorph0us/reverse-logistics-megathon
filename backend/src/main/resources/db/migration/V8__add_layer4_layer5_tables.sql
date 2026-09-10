-- V8__add_layer4_layer5_tables.sql

-- 1. Alter Master Consignments for Layer 3 (Merkle Tree & Logistics)
ALTER TABLE master_consignments 
ADD COLUMN merkle_root VARCHAR(64),
ADD COLUMN merkle_tree TEXT,
ADD COLUMN total_weight_grams INT DEFAULT 0,
ADD COLUMN transit_hash_tx_id VARCHAR(255),
ADD COLUMN received_at TIMESTAMP,
ADD COLUMN oem_receiver_note TEXT;

-- 2. Denatured Batch Tags (Layer 4)
CREATE TABLE denatured_batch_tags (
    tag_id VARCHAR(100) PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES batches(id),
    batch_number VARCHAR(100) NOT NULL,
    denatured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    agent VARCHAR(50) NOT NULL,
    agent_lot_number VARCHAR(100),
    witness_officer_id VARCHAR(100) NOT NULL,
    witness_officer_name VARCHAR(255) NOT NULL,
    photo_evidence_hash VARCHAR(64) NOT NULL,
    photo_url TEXT,
    quantity_denatured INT NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
);

-- 3. Electronic Waste Transfer Notes (EWTN) (Layer 4)
CREATE TABLE electronic_waste_transfer_notes (
    ewtn_id VARCHAR(100) PRIMARY KEY,
    denatured_tag_id VARCHAR(100) NOT NULL REFERENCES denatured_batch_tags(tag_id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    batch_number VARCHAR(100) NOT NULL,
    cbwtf_name VARCHAR(255) NOT NULL,
    cbwtf_reg_number VARCHAR(100) NOT NULL,
    cbwtf_address TEXT NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    hazmat_license_number VARCHAR(100) NOT NULL,
    scheduled_pickup_start TIMESTAMP NOT NULL,
    scheduled_pickup_end TIMESTAMP NOT NULL,
    total_net_mass_kg DECIMAL(10,2) NOT NULL,
    waste_category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    pickup_confirmed_at TIMESTAMP
);

-- 4. Incineration Logs (Layer 4)
CREATE TABLE incineration_logs (
    log_id VARCHAR(100) PRIMARY KEY,
    ewtn_id VARCHAR(100) NOT NULL REFERENCES electronic_waste_transfer_notes(ewtn_id),
    batch_id UUID NOT NULL REFERENCES batches(id),
    primary_chamber_temp_c DECIMAL(10,2) NOT NULL,
    secondary_chamber_temp_c DECIMAL(10,2) NOT NULL,
    incineration_start_time TIMESTAMP NOT NULL,
    incineration_end_time TIMESTAMP NOT NULL,
    ash_disposal_waybill VARCHAR(100) NOT NULL,
    operator_id VARCHAR(100) NOT NULL,
    passed BOOLEAN NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Final Incineration Records (Layer 5 Loop Closure)
CREATE TABLE final_incineration_records (
    record_id VARCHAR(100) PRIMARY KEY,
    ewtn_id VARCHAR(100) NOT NULL REFERENCES electronic_waste_transfer_notes(ewtn_id),
    mcm_id VARCHAR(50) NOT NULL REFERENCES master_consignments(mcm_id),
    facility_name VARCHAR(255) NOT NULL,
    facility_reg_number VARCHAR(100) NOT NULL,
    geo_lat DECIMAL(10,6) NOT NULL,
    geo_lng DECIMAL(10,6) NOT NULL,
    geo_address TEXT NOT NULL,
    master_crate_qr_scanned_at TIMESTAMP NOT NULL,
    master_crate_qr_scanned_by VARCHAR(100) NOT NULL,
    
    logged_weight_kg DECIMAL(10,2) NOT NULL,
    hopper_weight_kg DECIMAL(10,2) NOT NULL,
    weight_delta_kg DECIMAL(10,2) NOT NULL,
    weight_delta_percent DECIMAL(5,2) NOT NULL,
    weight_tolerance_percent DECIMAL(5,2) NOT NULL,
    weight_passed BOOLEAN NOT NULL,
    weight_checked_at TIMESTAMP NOT NULL,
    
    telemetry_readings TEXT,
    
    kiln_start_time TIMESTAMP NOT NULL,
    kiln_end_time TIMESTAMP NOT NULL,
    peak_primary_chamber_temp_c DECIMAL(10,2) NOT NULL,
    peak_secondary_chamber_temp_c DECIMAL(10,2) NOT NULL,
    total_ash_mass_kg DECIMAL(10,2) NOT NULL,
    ash_disposal_waybill VARCHAR(100) NOT NULL,
    
    destroyed_batch_ids TEXT NOT NULL,
    destroyed_batch_numbers TEXT NOT NULL,
    source_pharmacy_ids TEXT NOT NULL,
    total_units_destroyed INT NOT NULL,
    
    plant_manager_id VARCHAR(100) NOT NULL,
    plant_manager_name VARCHAR(255) NOT NULL,
    plant_manager_signature_hash VARCHAR(64) NOT NULL,
    
    certificate_id VARCHAR(100) NOT NULL,
    certificate_hash VARCHAR(64) NOT NULL,
    blockchain_tx_id VARCHAR(255) NOT NULL,
    
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL
);
