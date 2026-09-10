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
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FabricGatewayService {

    private final FabricGatewayConfig gatewayConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Gateway gateway;
    private Network network;
    private Contract contract;

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
            log.error("Fabric Gateway connection could not be established ({}).", e.getMessage());
            throw new RuntimeException("Fabric Gateway connection failed", e);
        }

        throw new RuntimeException("Fabric Gateway is disabled or null");
    }

    /**
     * Helper to process the transaction to the ledger, sending full true data JSON
     */
    private FabricTransactionResult submitTransaction(String methodName, String batchId, Object payloadData) {
        Contract c = getContract();
        String payloadJson = toJson(payloadData);
        
        try {
            byte[] result = c.submitTransaction(methodName, batchId, payloadJson);
            String eventHash = computeSha256(result);
            return new FabricTransactionResult(true, new String(result, StandardCharsets.UTF_8), null, eventHash);
        } catch (Exception e) {
            log.error("Fabric {} failed: {}", methodName, e.getMessage(), e);
            return new FabricTransactionResult(false, null, e.getMessage(), null);
        }
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
        payload.put("eventType", "BATCH_CREATED");
        
        return submitTransaction("createBatch", batchId, payload);
    }

    public FabricTransactionResult initiateReturn(String batchId, String returnId, int quantity,
                                                  String reason, String conditionNote) {
        Map<String, Object> payload = getExistingBatchAsMap(batchId);
        payload.put("returnId", returnId);
        payload.put("returnQuantity", quantity);
        payload.put("returnReason", reason);
        payload.put("conditionNote", conditionNote);
        payload.put("currentStatus", "RETURN_INITIATED");
        payload.put("eventType", "RETURN_INITIATED");

        return submitTransaction("initiateReturn", batchId, payload);
    }

    public FabricTransactionResult receiveReturn(String batchId, String returnId, int receivedQuantity,
                                                int difference, String conditionNote) {
        Map<String, Object> payload = getExistingBatchAsMap(batchId);
        payload.put("returnId", returnId);
        payload.put("receivedQuantity", receivedQuantity);
        payload.put("difference", difference);
        payload.put("conditionNote", conditionNote);
        payload.put("currentStatus", difference != 0 ? "DISPUTED" : "WITH_DISTRIBUTOR");
        payload.put("eventType", "RETURN_RECEIVED_DISTRIBUTOR");

        return submitTransaction("receiveReturn", batchId, payload);
    }

    public FabricTransactionResult manufacturerReceive(String batchId, String returnId, int receivedQuantity, String conditionNote) {
        Map<String, Object> payload = getExistingBatchAsMap(batchId);
        payload.put("returnId", returnId);
        payload.put("receivedQuantity", receivedQuantity);
        payload.put("conditionNote", conditionNote);
        payload.put("currentStatus", "WITH_MANUFACTURER");
        payload.put("eventType", "RETURN_RECEIVED_MANUFACTURER");

        return submitTransaction("manufacturerReceive", batchId, payload);
    }

    public FabricTransactionResult sendForDisposal(String batchId, String destructionId, int quantity,
                                                   String wasteFacilityId, String scheduledDate) {
        Map<String, Object> payload = getExistingBatchAsMap(batchId);
        payload.put("destructionId", destructionId);
        payload.put("destructionQuantity", quantity);
        payload.put("wasteFacilityId", wasteFacilityId);
        payload.put("scheduledDate", scheduledDate);
        payload.put("currentStatus", "SCHEDULED_FOR_DESTRUCTION");
        payload.put("eventType", "SENT_FOR_DISPOSAL");

        return submitTransaction("sendForDisposal", batchId, payload);
    }

    public FabricTransactionResult confirmDestruction(String batchId, String destructionId, int quantityDestroyed,
                                                      String destructionDate, String certificateId, String certificateHash) {
        Map<String, Object> payload = getExistingBatchAsMap(batchId);
        payload.put("destructionId", destructionId);
        payload.put("quantityDestroyed", quantityDestroyed);
        payload.put("destructionDate", destructionDate);
        payload.put("certificateId", certificateId);
        payload.put("certificateHash", certificateHash);
        payload.put("currentStatus", "DESTROYED");
        payload.put("eventType", "DESTRUCTION_CONFIRMED");

        return submitTransaction("confirmDestruction", batchId, payload);
    }

    public FabricTransactionResult closeBatch(String batchId, String closureReason) {
        Map<String, Object> payload = getExistingBatchAsMap(batchId);
        payload.put("closureReason", closureReason);
        payload.put("currentStatus", "CLOSED");
        payload.put("eventType", "BATCH_CLOSED");
        return submitTransaction("closeBatch", batchId, payload);
    }

    public String getBatch(String batchId) {
        Contract c = getContract();
        try {
            byte[] result = c.evaluateTransaction("getBatch", batchId);
            return new String(result, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Fabric getBatch failed for {}: {}", batchId, e.getMessage());
            throw new RuntimeException("Fabric getBatch failed", e);
        }
    }

    public String getBatchHistory(String batchId) {
        Contract c = getContract();
        try {
            byte[] result = c.evaluateTransaction("getBatchHistory", batchId);
            return new String(result, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Fabric getBatchHistory failed for {}: {}", batchId, e.getMessage());
            throw new RuntimeException("Fabric getBatchHistory failed", e);
        }
    }

    private Map<String, Object> getExistingBatchAsMap(String batchId) {
        String json = getBatch(batchId);
        return fromJson(json);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize to JSON", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fromJson(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize JSON", e);
        }
    }

    public boolean isBatchReturned(String batchId) {
        String batchJson = getBatch(batchId);
        if (batchJson != null) {
            Map<String, Object> map = fromJson(batchJson);
            String status = (String) map.get("currentStatus");
            return "RETURN_INITIATED".equals(status) ||
                   "WITH_DISTRIBUTOR".equals(status) ||
                   "WITH_MANUFACTURER".equals(status) ||
                   "SCHEDULED_FOR_DESTRUCTION".equals(status) ||
                   "DESTROYED".equals(status) ||
                   "CLOSED".equals(status);
        }
        return false;
    }

    /**
     * Compute SHA-256 hash
     */
    public String computeSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
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

    public String computeSha256(String text) {
        return computeSha256(text.getBytes(StandardCharsets.UTF_8));
    }

    public record FabricTransactionResult(boolean success, String payload, String error, String eventHash) {}
}
