package com.pharma.reversechain.blockchain;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.client.Contract;
import org.hyperledger.fabric.client.Gateway;
import org.hyperledger.fabric.client.Network;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class FabricGatewayService {

    private final FabricGatewayConfig gatewayConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Gateway gateway;
    private Network network;
    private Contract contract;

    // In-memory ledger cache for local simulation / fallback when Fabric network is offline
    private final Map<String, String> localLedgerSimulation = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> localHistorySimulation = new ConcurrentHashMap<>();

    private synchronized Contract getContract() {
        if (contract != null) {
            return contract;
        }

        try {
            this.gateway = gatewayConfig.connectGateway();
            if (this.gateway != null) {
                this.network = gateway.getNetwork(gatewayConfig.getChannelName());
                this.contract = network.getContract(gatewayConfig.getChaincodeName());
                log.info("Successfully connected to Fabric Contract '{}' on channel '{}'",
                        gatewayConfig.getChaincodeName(), gatewayConfig.getChannelName());
                return this.contract;
            }
        } catch (Exception e) {
            log.warn("Fabric Gateway connection could not be established ({}). Operating with local ledger fallback.", e.getMessage());
        }

        return null;
    }

    /**
     * Helper to process the transaction to the ledger, sending full true data JSON
     */
    private FabricTransactionResult submitTransaction(String methodName, String batchId, Object payloadData) {
        Contract c = getContract();
        String payloadJson = toJson(payloadData);
        
        if (c != null) {
            try {
                byte[] result = c.submitTransaction(methodName, batchId, payloadJson);
                return new FabricTransactionResult(true, new String(result, StandardCharsets.UTF_8), null, null);
            } catch (Exception e) {
                log.error("Fabric {} failed: {}", methodName, e.getMessage(), e);
                return new FabricTransactionResult(false, null, e.getMessage(), null);
            }
        }

        // Fallback / simulation record
        String txId = "tx-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> state = fromJson(payloadJson);
        state.put("transactionId", txId);
        state.put("timestamp", LocalDateTime.now().toString());

        recordLocalSimulation(batchId, state, txId);
        return new FabricTransactionResult(true, toJson(state), null, null);
    }

    public FabricTransactionResult createBatch(String batchId, String batchNumber, String manufacturerId,
                                               int quantity, String manufacturingDate, String expiryDate) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("batchId", batchId);
        payload.put("batchNumber", batchNumber);
        payload.put("manufacturerId", manufacturerId);
        payload.put("quantity", quantity);
        payload.put("manufacturingDate", manufacturingDate);
        payload.put("expiryDate", expiryDate);
        payload.put("currentStatus", "ACTIVE");
        
        return submitTransaction("createBatch", batchId, payload);
    }

    public FabricTransactionResult initiateReturn(String batchId, String returnId, int quantity,
                                                  String reason, String conditionNote) {
        Map<String, Object> payload = getOrMockBatch(batchId);
        payload.put("returnId", returnId);
        payload.put("returnQuantity", quantity);
        payload.put("returnReason", reason);
        payload.put("conditionNote", conditionNote);
        payload.put("currentStatus", "RETURN_INITIATED");

        return submitTransaction("initiateReturn", batchId, payload);
    }

    public FabricTransactionResult receiveReturn(String batchId, String returnId, int receivedQuantity,
                                                int difference, String conditionNote) {
        Map<String, Object> payload = getOrMockBatch(batchId);
        payload.put("returnId", returnId);
        payload.put("receivedQuantity", receivedQuantity);
        payload.put("difference", difference);
        payload.put("conditionNote", conditionNote);
        payload.put("currentStatus", difference != 0 ? "DISPUTED" : "WITH_DISTRIBUTOR");

        return submitTransaction("receiveReturn", batchId, payload);
    }

    public FabricTransactionResult manufacturerReceive(String batchId, String returnId, int receivedQuantity, String conditionNote) {
        Map<String, Object> payload = getOrMockBatch(batchId);
        payload.put("returnId", returnId);
        payload.put("receivedQuantity", receivedQuantity);
        payload.put("conditionNote", conditionNote);
        payload.put("currentStatus", "WITH_MANUFACTURER");

        return submitTransaction("manufacturerReceive", batchId, payload);
    }

    public FabricTransactionResult sendForDisposal(String batchId, String destructionId, int quantity,
                                                   String wasteFacilityId, String scheduledDate) {
        Map<String, Object> payload = getOrMockBatch(batchId);
        payload.put("destructionId", destructionId);
        payload.put("destructionQuantity", quantity);
        payload.put("wasteFacilityId", wasteFacilityId);
        payload.put("scheduledDate", scheduledDate);
        payload.put("currentStatus", "SCHEDULED_FOR_DESTRUCTION");

        return submitTransaction("sendForDisposal", batchId, payload);
    }

    public FabricTransactionResult confirmDestruction(String batchId, String destructionId, int quantityDestroyed,
                                                      String destructionDate, String certificateId, String certificateHash) {
        Map<String, Object> payload = getOrMockBatch(batchId);
        payload.put("destructionId", destructionId);
        payload.put("quantityDestroyed", quantityDestroyed);
        payload.put("destructionDate", destructionDate);
        payload.put("certificateId", certificateId);
        payload.put("certificateHash", certificateHash);
        payload.put("currentStatus", "DESTROYED");

        return submitTransaction("confirmDestruction", batchId, payload);
    }

    public FabricTransactionResult closeBatch(String batchId, String closureReason) {
        Map<String, Object> payload = getOrMockBatch(batchId);
        payload.put("closureReason", closureReason);
        payload.put("currentStatus", "CLOSED");

        return submitTransaction("closeBatch", batchId, payload);
    }

    public String getBatch(String batchId) {
        Contract c = getContract();
        if (c != null) {
            try {
                byte[] result = c.evaluateTransaction("getBatch", batchId);
                return new String(result, StandardCharsets.UTF_8);
            } catch (Exception e) {
                log.error("Fabric getBatch failed for {}: {}", batchId, e.getMessage());
            }
        }
        return localLedgerSimulation.getOrDefault(batchId, toJson(getOrMockBatch(batchId)));
    }

    public String getBatchHistory(String batchId) {
        Contract c = getContract();
        if (c != null) {
            try {
                byte[] result = c.evaluateTransaction("getBatchHistory", batchId);
                return new String(result, StandardCharsets.UTF_8);
            } catch (Exception e) {
                log.error("Fabric getBatchHistory failed for {}: {}", batchId, e.getMessage());
            }
        }
        List<Map<String, Object>> history = localHistorySimulation.getOrDefault(batchId, Collections.emptyList());
        return toJson(history);
    }

    private void recordLocalSimulation(String batchId, Map<String, Object> state, String txId) {
        String json = toJson(state);
        localLedgerSimulation.put(batchId, json);
        localHistorySimulation.computeIfAbsent(batchId, k -> new ArrayList<>()).add(Map.of(
                "txId", txId,
                "timestamp", LocalDateTime.now().toString(),
                "isDelete", false,
                "value", state
        ));
    }

    private Map<String, Object> getOrMockBatch(String batchId) {
        if (localLedgerSimulation.containsKey(batchId)) {
            return fromJson(localLedgerSimulation.get(batchId));
        }
        Map<String, Object> mock = new HashMap<>();
        mock.put("batchId", batchId);
        mock.put("batchNumber", "UNKNOWN");
        return mock;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fromJson(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    /**
     * Compute SHA-256 hash (Kept here for the verification endpoint which still needs to verify certificate PDFs)
     */
    public String computeSha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    public record FabricTransactionResult(boolean success, String payload, String error, String eventHash) {}
}
