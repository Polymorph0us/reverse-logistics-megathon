package com.pharma.reversechain.blockchain;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.client.ChaincodeEvent;
import org.hyperledger.fabric.client.CloseableIterator;
import org.hyperledger.fabric.client.Gateway;
import org.hyperledger.fabric.client.Network;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.pharma.reversechain.repository.BatchRepository;

@Slf4j
@Component
@RequiredArgsConstructor
public class FabricEventListener {

    private final FabricGatewayConfig gatewayConfig;
    private final BatchRepository batchRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    private volatile boolean running = true;

    @PostConstruct
    public void startEventListener() {
        if (!gatewayConfig.isEnabled()) {
            log.info("FabricEventListener: Fabric is disabled, skipping event listener daemon.");
            return;
        }

        executorService.submit(() -> {
            log.info("FabricEventListener: Starting background event listener for channel '{}'...", gatewayConfig.getChannelName());
            while (running) {
                try (Gateway gateway = gatewayConfig.connectGateway()) {
                    if (gateway == null) {
                        Thread.sleep(15000);
                        continue;
                    }

                    Network network = gateway.getNetwork(gatewayConfig.getChannelName());
                    try (CloseableIterator<ChaincodeEvent> eventIterator = network.getChaincodeEvents(gatewayConfig.getChaincodeName())) {
                        log.info("FabricEventListener: Successfully subscribed to chaincode events for '{}'", gatewayConfig.getChaincodeName());
                        while (running && eventIterator.hasNext()) {
                            ChaincodeEvent event = eventIterator.next();
                            handleEvent(event);
                        }
                    }
                } catch (Exception e) {
                    if (running) {
                        log.warn("FabricEventListener: Connection lost ({}), retrying in 10 seconds...", e.getMessage());
                        try {
                            Thread.sleep(10000);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
            }
        });
    }

    private void handleEvent(ChaincodeEvent event) {
        String eventName = event.getEventName();
        String payload = new String(event.getPayload(), StandardCharsets.UTF_8);
        long blockNumber = event.getBlockNumber();
        String txId = event.getTransactionId();

        log.info(">>> [FABRIC EVENT RECEIVED] Name: '{}', Block: {}, TxId: {}, Payload: {}",
                eventName, blockNumber, txId, payload);
                
        try {
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(payload);
            if (node.has("batchId")) {
                String batchIdStr = node.get("batchId").asText();
                try {
                    java.util.UUID batchId = java.util.UUID.fromString(batchIdStr);
                    // Check if we have this batch in our local DB
                    if (!batchRepository.existsById(batchId)) {
                        log.error("RECONCILIATION MISMATCH: Ledger event for batchId {} but not found in local DB!", batchIdStr);
                        // In a real system, we would trigger a full state sync here
                    } else {
                        log.debug("Reconciliation successful: batch {} exists locally.", batchIdStr);
                    }
                } catch (Exception e) {
                    log.warn("Could not parse batchId or access repository during reconciliation: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Fabric event payload for reconciliation", e);
        }
    }

    @PreDestroy
    public void stopEventListener() {
        running = false;
        executorService.shutdownNow();
    }
}
