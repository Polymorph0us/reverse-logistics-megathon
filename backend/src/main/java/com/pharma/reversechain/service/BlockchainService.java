package com.pharma.reversechain.service;

import java.util.Map;

/**
 * Unified domain-facing interface for all blockchain operations.
 * Exactly one implementation is active at runtime, controlled by blockchain.mode config.
 * <p>
 * In {@code fabric} mode: calls Hyperledger Fabric via the Gateway SDK.
 * In {@code local} mode: uses an in-memory simulation for tests/development.
 */
public interface BlockchainService {

    record BlockchainResult(boolean success, String transactionId, String payload, String eventHash, String error) {}

    /** Register a new batch on the ledger. */
    BlockchainResult registerBatch(String batchId, String batchNumber, String manufacturerId,
                                    int quantity, String manufacturingDate, String expiryDate);

    /** Record a return initiation. */
    BlockchainResult recordReturn(String batchId, String returnId, int quantity, String reason, String conditionNote);

    /** Record distributor receipt of a return. */
    BlockchainResult recordDistributorReceipt(String batchId, String returnId, int receivedQuantity,
                                               int difference, String conditionNote);

    /** Record manufacturer receipt of a return. */
    BlockchainResult recordManufacturerReceipt(String batchId, String returnId, int receivedQuantity, String conditionNote);

    /** Record batch scheduled for disposal. */
    BlockchainResult recordDisposalScheduled(String batchId, String destructionId, int quantity,
                                              String wasteFacilityId, String scheduledDate);

    /** Record confirmed destruction with certificate hash. */
    BlockchainResult recordDestruction(String batchId, String destructionId, int quantityDestroyed,
                                        String destructionDate, String certificateId, String certificateHash);

    /** Close a batch on the ledger. */
    BlockchainResult closeBatch(String batchId, String closureReason);

    /** Get batch state from ledger. Returns JSON string or null. */
    String getBatchState(String batchId);

    /** Get batch history from ledger. Returns JSON array string. */
    String getBatchHistory(String batchId);

    /** Check if a batch has been returned (is in a post-return state). */
    boolean isBatchReturned(String batchId);

    /** Compute SHA-256 hash of text. Utility exposed for certificate hashing. */
    String computeSha256(String text);

    /** Compute SHA-256 hash of bytes. */
    String computeSha256(byte[] bytes);
}
