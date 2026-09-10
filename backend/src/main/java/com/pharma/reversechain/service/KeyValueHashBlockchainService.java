package com.pharma.reversechain.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.entity.KeyValueHashEntry;
import com.pharma.reversechain.repository.KeyValueHashRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Production-ready Cryptographic Key-Value Hashing Store implementation of BlockchainService.
 * Replaces the multi-node Hyperledger Fabric docker network with an in-database SHA-256 linked
 * hash-chain store in PostgreSQL.
 *
 * Each record chains mathematically to the previous hash:
 *   currentHash = SHA-256(previousHash + ":" + payloadJson)
 * Providing mathematical non-repudiation and tamper detection.
 */
@Slf4j
@RequiredArgsConstructor
public class KeyValueHashBlockchainService implements BlockchainService {

    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final KeyValueHashRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public BlockchainResult registerBatch(String batchId, String batchNumber, String manufacturerId,
                                           int quantity, String manufacturingDate, String expiryDate) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("batchId", batchId);
        payload.put("batchNumber", batchNumber);
        payload.put("manufacturerId", manufacturerId);
        payload.put("quantity", quantity);
        payload.put("manufacturingDate", manufacturingDate);
        payload.put("expiryDate", expiryDate);
        payload.put("currentStatus", "ACTIVE");
        payload.put("eventType", "BATCH_CREATED");
        payload.put("actorOrg", "ManufacturerMSP");

        return commitHashEntry(batchId, "BATCH_CREATED", "ManufacturerMSP", payload);
    }

    @Override
    @Transactional
    public BlockchainResult recordReturn(String batchId, String returnId, int quantity, String reason, String conditionNote) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("returnId", returnId);
        payload.put("returnQuantity", quantity);
        payload.put("returnReason", reason);
        payload.put("conditionNote", conditionNote != null ? conditionNote : "");
        payload.put("currentStatus", "RETURN_INITIATED");
        payload.put("eventType", "RETURN_INITIATED");
        payload.put("actorOrg", "RetailerMSP");

        return commitHashEntry(batchId, "RETURN_INITIATED", "RetailerMSP", payload);
    }

    @Override
    @Transactional
    public BlockchainResult recordDistributorReceipt(String batchId, String returnId, int receivedQuantity,
                                                      int difference, String conditionNote) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("returnId", returnId);
        payload.put("receivedQuantity", receivedQuantity);
        payload.put("difference", difference);
        payload.put("conditionNote", conditionNote != null ? conditionNote : "");
        payload.put("currentStatus", difference != 0 ? "DISPUTED" : "WITH_DISTRIBUTOR");
        payload.put("eventType", "RETURN_RECEIVED_DISTRIBUTOR");
        payload.put("actorOrg", "DistributorMSP");

        return commitHashEntry(batchId, "RETURN_RECEIVED_DISTRIBUTOR", "DistributorMSP", payload);
    }

    @Override
    @Transactional
    public BlockchainResult recordManufacturerReceipt(String batchId, String returnId, int receivedQuantity, String conditionNote) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("returnId", returnId);
        payload.put("receivedQuantity", receivedQuantity);
        payload.put("conditionNote", conditionNote != null ? conditionNote : "");
        payload.put("currentStatus", "WITH_MANUFACTURER");
        payload.put("eventType", "RETURN_RECEIVED_MANUFACTURER");
        payload.put("actorOrg", "ManufacturerMSP");

        return commitHashEntry(batchId, "RETURN_RECEIVED_MANUFACTURER", "ManufacturerMSP", payload);
    }

    @Override
    @Transactional
    public BlockchainResult recordDisposalScheduled(String batchId, String destructionId, int quantity,
                                                     String wasteFacilityId, String scheduledDate) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("destructionId", destructionId);
        payload.put("destructionQuantity", quantity);
        payload.put("wasteFacilityId", wasteFacilityId);
        payload.put("scheduledDate", scheduledDate);
        payload.put("currentStatus", "SCHEDULED_FOR_DESTRUCTION");
        payload.put("eventType", "SENT_FOR_DISPOSAL");
        payload.put("actorOrg", "ManufacturerMSP");

        return commitHashEntry(batchId, "SENT_FOR_DISPOSAL", "ManufacturerMSP", payload);
    }

    @Override
    @Transactional
    public BlockchainResult recordDestruction(String batchId, String destructionId, int quantityDestroyed,
                                               String destructionDate, String certificateId, String certificateHash) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("destructionId", destructionId);
        payload.put("quantityDestroyed", quantityDestroyed);
        payload.put("destructionDate", destructionDate);
        payload.put("certificateId", certificateId);
        payload.put("certificateHash", certificateHash);
        payload.put("currentStatus", "DESTROYED");
        payload.put("eventType", "DESTRUCTION_CONFIRMED");
        payload.put("actorOrg", "WasteFacilityMSP");

        return commitHashEntry(batchId, "DESTRUCTION_CONFIRMED", "WasteFacilityMSP", payload);
    }

    @Override
    @Transactional
    public BlockchainResult closeBatch(String batchId, String closureReason) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("closureReason", closureReason);
        payload.put("currentStatus", "CLOSED");
        payload.put("eventType", "BATCH_CLOSED");
        payload.put("actorOrg", "ControllerMSP");

        return commitHashEntry(batchId, "BATCH_CLOSED", "ControllerMSP", payload);
    }

    @Override
    public String getBatchState(String batchId) {
        return repository.findTopByRecordKeyOrderBySequenceNumberDesc(batchId)
                .map(KeyValueHashEntry::getValueJson)
                .orElse("{\"batchId\":\"" + batchId + "\",\"batchNumber\":\"UNKNOWN\"}");
    }

    @Override
    public String getBatchHistory(String batchId) {
        List<KeyValueHashEntry> entries = repository.findByRecordKeyOrderBySequenceNumberAsc(batchId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (KeyValueHashEntry entry : entries) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("txId", entry.getTransactionId());
            item.put("sequenceNumber", entry.getSequenceNumber());
            item.put("timestamp", entry.getCreatedAt().toString());
            item.put("eventType", entry.getEventType());
            item.put("actorOrg", entry.getActorOrg());
            item.put("previousHash", entry.getPreviousHash());
            item.put("currentHash", entry.getCurrentHash());
            try {
                item.put("value", objectMapper.readValue(entry.getValueJson(), new TypeReference<Map<String, Object>>() {}));
            } catch (Exception e) {
                item.put("value", entry.getValueJson());
            }
            item.put("isDelete", false);
            result.add(item);
        }

        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            log.error("Failed to serialize batch history for batchId={}", batchId, e);
            return "[]";
        }
    }

    @Override
    public boolean isBatchReturned(String batchId) {
        String state = getBatchState(batchId);
        return state.contains("RETURN_INITIATED") || state.contains("WITH_DISTRIBUTOR") ||
               state.contains("WITH_MANUFACTURER") || state.contains("SCHEDULED_FOR_DESTRUCTION") ||
               state.contains("DESTROYED") || state.contains("CLOSED") || state.contains("DISPUTED");
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

    /**
     * Mathematically verify the cryptographic hash chain for a given batch.
     * Returns true if all SHA-256 links are intact and untampered.
     */
    public boolean verifyChainIntegrity(String batchId) {
        List<KeyValueHashEntry> entries = repository.findByRecordKeyOrderBySequenceNumberAsc(batchId);
        if (entries.isEmpty()) return true;

        String expectedPreviousHash = GENESIS_HASH;
        for (KeyValueHashEntry entry : entries) {
            if (!entry.getPreviousHash().equalsIgnoreCase(expectedPreviousHash)) {
                log.warn("Hash chain broken for key {}: expected prevHash {}, found {}",
                        batchId, expectedPreviousHash, entry.getPreviousHash());
                return false;
            }
            String calculatedCurrentHash = computeSha256(entry.getPreviousHash() + ":" + entry.getValueJson());
            if (!entry.getCurrentHash().equalsIgnoreCase(calculatedCurrentHash)) {
                log.warn("Current hash mismatch for key {} at seq {}: calculated {}, recorded {}",
                        batchId, entry.getSequenceNumber(), calculatedCurrentHash, entry.getCurrentHash());
                return false;
            }
            expectedPreviousHash = entry.getCurrentHash();
        }
        return true;
    }

    private BlockchainResult commitHashEntry(String key, String eventType, String actorOrg, Map<String, Object> data) {
        try {
            String txId = "hash-tx-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            data.put("batchId", key);
            data.put("transactionId", txId);
            data.put("timestamp", LocalDateTime.now().toString());

            String jsonPayload = objectMapper.writeValueAsString(data);

            Optional<KeyValueHashEntry> latest = repository.findTopByRecordKeyOrderBySequenceNumberDesc(key);
            long seq = latest.map(e -> e.getSequenceNumber() + 1).orElse(1L);
            String prevHash = latest.map(KeyValueHashEntry::getCurrentHash).orElse(GENESIS_HASH);

            String currentHash = computeSha256(prevHash + ":" + jsonPayload);

            KeyValueHashEntry entry = KeyValueHashEntry.builder()
                    .recordKey(key)
                    .valueJson(jsonPayload)
                    .eventType(eventType)
                    .actorOrg(actorOrg)
                    .transactionId(txId)
                    .sequenceNumber(seq)
                    .previousHash(prevHash)
                    .currentHash(currentHash)
                    .createdAt(LocalDateTime.now())
                    .build();

            repository.save(entry);

            log.info("[KEY-VALUE HASH STORE] Committed {} for key={}: seq={}, txId={}, hash={}",
                    eventType, key, seq, txId, currentHash);

            return new BlockchainResult(true, txId, jsonPayload, currentHash, null);
        } catch (Exception e) {
            log.error("Failed to commit hash entry for key={}", key, e);
            return new BlockchainResult(false, null, null, null, e.getMessage());
        }
    }
}
