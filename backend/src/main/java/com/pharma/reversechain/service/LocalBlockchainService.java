package com.pharma.reversechain.service;

import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory mock implementation of BlockchainService.
 * Active when blockchain.mode=local (development and testing only).
 * Never active in production/demo profiles.
 */
@Slf4j
public class LocalBlockchainService implements BlockchainService {

    private final Map<String, String> ledger = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> history = new ConcurrentHashMap<>();

    @Override
    public BlockchainResult registerBatch(String batchId, String batchNumber, String manufacturerId,
                                           int quantity, String manufacturingDate, String expiryDate) {
        return simulateTransaction("createBatch", batchId, Map.of(
                "batchId", batchId, "batchNumber", batchNumber, "manufacturerId", manufacturerId,
                "quantity", quantity, "manufacturingDate", manufacturingDate, "expiryDate", expiryDate,
                "currentStatus", "ACTIVE", "eventType", "BATCH_CREATED"
        ));
    }

    @Override
    public BlockchainResult recordReturn(String batchId, String returnId, int quantity, String reason, String conditionNote) {
        return simulateTransaction("initiateReturn", batchId, Map.of(
                "returnId", returnId, "returnQuantity", quantity, "returnReason", reason,
                "conditionNote", conditionNote != null ? conditionNote : "",
                "currentStatus", "RETURN_INITIATED", "eventType", "RETURN_INITIATED"
        ));
    }

    @Override
    public BlockchainResult recordDistributorReceipt(String batchId, String returnId, int receivedQuantity,
                                                      int difference, String conditionNote) {
        return simulateTransaction("receiveReturn", batchId, Map.of(
                "returnId", returnId, "receivedQuantity", receivedQuantity, "difference", difference,
                "conditionNote", conditionNote != null ? conditionNote : "",
                "currentStatus", difference != 0 ? "DISPUTED" : "WITH_DISTRIBUTOR",
                "eventType", "RETURN_RECEIVED_DISTRIBUTOR"
        ));
    }

    @Override
    public BlockchainResult recordManufacturerReceipt(String batchId, String returnId, int receivedQuantity, String conditionNote) {
        return simulateTransaction("manufacturerReceive", batchId, Map.of(
                "returnId", returnId, "receivedQuantity", receivedQuantity,
                "conditionNote", conditionNote != null ? conditionNote : "",
                "currentStatus", "WITH_MANUFACTURER", "eventType", "RETURN_RECEIVED_MANUFACTURER"
        ));
    }

    @Override
    public BlockchainResult recordDisposalScheduled(String batchId, String destructionId, int quantity,
                                                     String wasteFacilityId, String scheduledDate) {
        return simulateTransaction("sendForDisposal", batchId, Map.of(
                "destructionId", destructionId, "destructionQuantity", quantity,
                "wasteFacilityId", wasteFacilityId, "scheduledDate", scheduledDate,
                "currentStatus", "SCHEDULED_FOR_DESTRUCTION", "eventType", "SENT_FOR_DISPOSAL"
        ));
    }

    @Override
    public BlockchainResult recordDestruction(String batchId, String destructionId, int quantityDestroyed,
                                               String destructionDate, String certificateId, String certificateHash) {
        return simulateTransaction("confirmDestruction", batchId, Map.of(
                "destructionId", destructionId, "quantityDestroyed", quantityDestroyed,
                "destructionDate", destructionDate, "certificateId", certificateId,
                "certificateHash", certificateHash,
                "currentStatus", "DESTROYED", "eventType", "DESTRUCTION_CONFIRMED"
        ));
    }

    @Override
    public BlockchainResult closeBatch(String batchId, String closureReason) {
        return simulateTransaction("closeBatch", batchId, Map.of(
                "closureReason", closureReason,
                "currentStatus", "CLOSED", "eventType", "BATCH_CLOSED"
        ));
    }

    @Override
    public String getBatchState(String batchId) {
        return ledger.getOrDefault(batchId, "{\"batchId\":\"" + batchId + "\",\"batchNumber\":\"UNKNOWN\"}");
    }

    @Override
    public String getBatchHistory(String batchId) {
        List<Map<String, Object>> hist = history.getOrDefault(batchId, Collections.emptyList());
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            return om.writeValueAsString(hist);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Override
    public boolean isBatchReturned(String batchId) {
        String state = ledger.get(batchId);
        if (state == null) return false;
        return state.contains("RETURN_INITIATED") || state.contains("WITH_DISTRIBUTOR") ||
               state.contains("WITH_MANUFACTURER") || state.contains("SCHEDULED_FOR_DESTRUCTION") ||
               state.contains("DESTROYED") || state.contains("CLOSED");
    }

    @Override
    public String computeSha256(String text) {
        return computeSha256(text.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public String computeSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    private BlockchainResult simulateTransaction(String method, String batchId, Map<String, Object> data) {
        String txId = "local-tx-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> state = new HashMap<>(data);
        state.put("batchId", batchId);
        state.put("transactionId", txId);
        state.put("timestamp", LocalDateTime.now().toString());

        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            String json = om.writeValueAsString(state);
            ledger.put(batchId, json);
            history.computeIfAbsent(batchId, k -> new ArrayList<>()).add(Map.of(
                    "txId", txId, "timestamp", LocalDateTime.now().toString(), "isDelete", false, "value", state
            ));
            String eventHash = computeSha256(json);
            log.debug("[LOCAL BLOCKCHAIN] {} on batch {}: txId={}", method, batchId, txId);
            return new BlockchainResult(true, txId, json, eventHash, null);
        } catch (Exception e) {
            return new BlockchainResult(false, null, null, null, e.getMessage());
        }
    }
}
