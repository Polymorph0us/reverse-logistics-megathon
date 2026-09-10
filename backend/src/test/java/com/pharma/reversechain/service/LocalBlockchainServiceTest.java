package com.pharma.reversechain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class LocalBlockchainServiceTest {

    private LocalBlockchainService blockchainService;

    @BeforeEach
    void setUp() {
        blockchainService = new LocalBlockchainService();
    }

    @Test
    void testComputeSha256_deterministic() {
        String input = "PharmaReverseChainCompliance2026";
        String hash1 = blockchainService.computeSha256(input);
        String hash2 = blockchainService.computeSha256(input.getBytes(StandardCharsets.UTF_8));

        assertNotNull(hash1);
        assertEquals(64, hash1.length(), "SHA-256 hex string should be 64 characters");
        assertEquals(hash1, hash2);
    }

    @Test
    void testCompleteBatchLifecycleSimulation() {
        String batchId = "BATCH-TEST-101";
        String batchNumber = "BN-998877";
        String manufacturerId = "MANUF-001";
        int quantity = 500;

        // 1. Create Batch on Fabric
        var createResult = blockchainService.registerBatch(batchId, batchNumber, manufacturerId, quantity, "2025-01-01", "2026-01-01");
        assertTrue(createResult.success());
        assertNotNull(createResult.eventHash());

        // 2. Initiate Return
        var returnResult = blockchainService.recordReturn(batchId, "RET-001", 100, "EXPIRED", "Good Condition");
        assertTrue(returnResult.success());
        assertNotNull(returnResult.eventHash());
        assertNotEquals(createResult.eventHash(), returnResult.eventHash());

        // 3. Receive Return at Distributor
        var receiveResult = blockchainService.recordDistributorReceipt(batchId, "RET-001", 100, 0, "Inspected OK");
        assertTrue(receiveResult.success());

        // 4. Manufacturer Receipt
        var mfgReceiveResult = blockchainService.recordManufacturerReceipt(batchId, "RET-001", 100, "Received at plant");
        assertTrue(mfgReceiveResult.success());

        // 5. Send for Disposal
        var disposalResult = blockchainService.recordDisposalScheduled(batchId, "DEST-001", 100, "FACILITY-A", "2026-02-01");
        assertTrue(disposalResult.success());

        // 6. Confirm Destruction with SHA-256 Certificate Hash
        String certPdfContent = "SAMPLE_CERTIFICATE_PDF_DATA_AUTHORIZED_DISPOSAL";
        String certHash = blockchainService.computeSha256(certPdfContent);

        var destructionResult = blockchainService.recordDestruction(batchId, "DEST-001", 100, "2026-02-02", "CERT-777", certHash);
        assertTrue(destructionResult.success());

        // 7. Verify batch is marked returned/destroyed
        assertTrue(blockchainService.isBatchReturned(batchId));

        // 8. Query history
        String historyJson = blockchainService.getBatchHistory(batchId);
        assertNotNull(historyJson);
        assertTrue(historyJson.contains("BATCH_CREATED"));
        assertTrue(historyJson.contains("RETURN_INITIATED"));
        assertTrue(historyJson.contains("DESTRUCTION_CONFIRMED"));
        assertTrue(historyJson.contains(certHash));
    }
}
