package com.pharma.reversechain.controller;

import com.pharma.reversechain.blockchain.FabricGatewayConfig;
import com.pharma.reversechain.blockchain.FabricGatewayService;
import com.pharma.reversechain.repository.CertificateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlockchainControllerTest {

    @Mock
    private FabricGatewayService fabricGatewayService;

    @Mock
    private FabricGatewayConfig gatewayConfig;

    @Mock
    private CertificateRepository certificateRepository;

    private BlockchainController controller;

    @BeforeEach
    void setUp() {
        controller = new BlockchainController(fabricGatewayService, gatewayConfig, certificateRepository);
    }

    @Test
    void testGetStatus() {
        when(gatewayConfig.isEnabled()).thenReturn(false);
        when(gatewayConfig.getChannelName()).thenReturn("pharma-channel");
        when(gatewayConfig.getChaincodeName()).thenReturn("pharma-contract");
        when(gatewayConfig.getPeerEndpoint()).thenReturn("localhost:7051");
        when(gatewayConfig.getMspId()).thenReturn("ManufacturerMSP");

        ResponseEntity<Map<String, Object>> response = controller.getStatus();
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals("pharma-channel", response.getBody().get("channelName"));
        assertEquals("CONNECTED", response.getBody().get("status"));
    }

    @Test
    void testGetBatchFromLedger() {
        when(fabricGatewayService.getBatch("BATCH-101"))
                .thenReturn("{\"batchId\":\"BATCH-101\",\"state\":\"ACTIVE\"}");

        ResponseEntity<Object> response = controller.getBatchFromLedger("BATCH-101");
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void testGetBatchHistoryFromLedger() {
        when(fabricGatewayService.getBatchHistory("BATCH-101"))
                .thenReturn("[{\"txId\":\"tx-1\",\"state\":\"ACTIVE\"}]");

        ResponseEntity<Object> response = controller.getBatchHistoryFromLedger("BATCH-101");
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
    }
}
