package com.pharma.reversechain.blockchain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FabricGatewayServiceTest {

    @Mock
    private FabricGatewayConfig gatewayConfig;

    private FabricGatewayService gatewayService;

    @BeforeEach
    void setUp() {
        // When enabled is false, FabricGatewayService operates in local deterministic simulation mode
        gatewayService = new FabricGatewayService(gatewayConfig);
    }

    @Test
    void testComputeSha256_deterministic() {
        String input = "PharmaReverseChainCompliance2026";
        String hash1 = gatewayService.computeSha256(input);
        String hash2 = gatewayService.computeSha256(input.getBytes(StandardCharsets.UTF_8));

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
        var createResult = gatewayService.createBatch(batchId, batchNumber, manufacturerId, quantity, "2025-01-01", "2026-01-01");
        assertTrue(createResult.success());
        assertNotNull(createResult.eventHash());

        // 2. Initiate Return
        var returnResult = gatewayService.initiateReturn(batchId, "RET-001", 100, "EXPIRED", "Good Condition");
        assertTrue(returnResult.success());
        assertNotNull(returnResult.eventHash());
        assertNotEquals(createResult.eventHash(), returnResult.eventHash());

        // 3. Receive Return at Distributor
        var receiveResult = gatewayService.receiveReturn(batchId, "RET-001", 100, 0, "Inspected OK");
        assertTrue(receiveResult.success());

        // 4. Manufacturer Receipt
        var mfgReceiveResult = gatewayService.manufacturerReceive(batchId, "RET-001", 100, "Received at plant");
        assertTrue(mfgReceiveResult.success());

        // 5. Send for Disposal
        var disposalResult = gatewayService.sendForDisposal(batchId, "DEST-001", 100, "FACILITY-A", "2026-02-01");
        assertTrue(disposalResult.success());

        // 6. Confirm Destruction with SHA-256 Certificate Hash
        String certPdfContent = "SAMPLE_CERTIFICATE_PDF_DATA_AUTHORIZED_DISPOSAL";
        String certHash = gatewayService.computeSha256(certPdfContent);

        var destructionResult = gatewayService.confirmDestruction(batchId, "DEST-001", 100, "2026-02-02", "CERT-777", certHash);
        assertTrue(destructionResult.success());

        // 7. Verify batch is marked returned/destroyed
        assertTrue(gatewayService.isBatchReturned(batchId));

        // 8. Query history
        String historyJson = gatewayService.getBatchHistory(batchId);
        assertNotNull(historyJson);
        assertTrue(historyJson.contains("BATCH_CREATED"));
        assertTrue(historyJson.contains("RETURN_INITIATED"));
        assertTrue(historyJson.contains("DESTRUCTION_CONFIRMED"));
        assertTrue(historyJson.contains(certHash));
    }
}
