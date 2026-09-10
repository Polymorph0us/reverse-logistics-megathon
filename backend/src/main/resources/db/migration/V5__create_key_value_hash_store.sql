-- V5__create_key_value_hash_store.sql
-- Cryptographic Key-Value Hashing Store (SHA-256 Merkle-linked audit trail)

CREATE TABLE IF NOT EXISTS key_value_hash_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_key VARCHAR(255) NOT NULL,
    value_json TEXT NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    actor_org VARCHAR(128),
    transaction_id VARCHAR(64) NOT NULL,
    sequence_number BIGINT NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kv_hash_key ON key_value_hash_store(record_key);
CREATE INDEX IF NOT EXISTS idx_kv_hash_seq ON key_value_hash_store(record_key, sequence_number);
CREATE INDEX IF NOT EXISTS idx_kv_hash_txid ON key_value_hash_store(transaction_id);
