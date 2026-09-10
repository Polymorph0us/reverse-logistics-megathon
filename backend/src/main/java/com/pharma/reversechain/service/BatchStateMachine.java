package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.BatchEvent;
import com.pharma.reversechain.entity.BatchStatus;
import com.pharma.reversechain.entity.Role;
import com.pharma.reversechain.repository.BatchEventRepository;
import com.pharma.reversechain.repository.BatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BatchStateMachine {

    private final BatchRepository batchRepository;
    private final BatchEventRepository batchEventRepository;

    private static final Map<BatchStatus, Set<BatchStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(BatchStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(BatchStatus.ACTIVE, EnumSet.of(BatchStatus.EXPIRING_SOON, BatchStatus.EXPIRED, BatchStatus.RETURN_INITIATED));
        ALLOWED_TRANSITIONS.put(BatchStatus.EXPIRING_SOON, EnumSet.of(BatchStatus.EXPIRED, BatchStatus.RETURN_INITIATED));
        ALLOWED_TRANSITIONS.put(BatchStatus.EXPIRED, EnumSet.of(BatchStatus.RETURN_INITIATED));
        ALLOWED_TRANSITIONS.put(BatchStatus.RETURN_INITIATED, EnumSet.of(BatchStatus.WITH_DISTRIBUTOR, BatchStatus.DISPUTED));
        ALLOWED_TRANSITIONS.put(BatchStatus.WITH_DISTRIBUTOR, EnumSet.of(BatchStatus.WITH_MANUFACTURER, BatchStatus.DISPUTED));
        ALLOWED_TRANSITIONS.put(BatchStatus.WITH_MANUFACTURER, EnumSet.of(BatchStatus.SCHEDULED_FOR_DESTRUCTION));
        ALLOWED_TRANSITIONS.put(BatchStatus.SCHEDULED_FOR_DESTRUCTION, EnumSet.of(BatchStatus.DESTROYED));
        ALLOWED_TRANSITIONS.put(BatchStatus.DESTROYED, EnumSet.of(BatchStatus.CLOSED));
        ALLOWED_TRANSITIONS.put(BatchStatus.DISPUTED, EnumSet.of(BatchStatus.WITH_MANUFACTURER, BatchStatus.CLOSED));
        ALLOWED_TRANSITIONS.put(BatchStatus.CLOSED, EnumSet.noneOf(BatchStatus.class));
    }

    public void validateTransition(BatchStatus currentStatus, BatchStatus newStatus) {
        if (!ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Collections.emptySet()).contains(newStatus)) {
            throw new IllegalStateException("Invalid transition from " + currentStatus + " to " + newStatus);
        }
    }

    @Transactional
    public Batch transitionBatch(Batch batch, BatchStatus newStatus, String eventType, String actor, UUID organizationId, Role role, String location, Integer quantity, String evidenceRefs, String verificationInfo) {
        validateTransition(batch.getCurrentStatus(), newStatus);

        BatchStatus previousStatus = batch.getCurrentStatus();
        batch.setCurrentStatus(newStatus);
        Batch savedBatch = batchRepository.save(batch);

        BatchEvent event = new BatchEvent();
        event.setBatchId(batch.getBatchId());
        event.setEventType(eventType);
        event.setPreviousStatus(previousStatus);
        event.setNewStatus(newStatus);
        event.setActor(actor);
        event.setOrganizationId(organizationId);
        event.setRole(role);
        event.setTimestamp(LocalDateTime.now());
        event.setLocation(location);
        event.setQuantity(quantity);
        event.setEvidenceRefs(evidenceRefs);
        event.setVerificationInfo(verificationInfo);
        
        // Generate a simple hash of the event data (chain-of-custody link)
        String rawData = batch.getBatchId().toString() + newStatus + timestampString() + actor;
        event.setHash(hashString(rawData));

        batchEventRepository.save(event);

        return savedBatch;
    }

    private String timestampString() {
        return String.valueOf(System.currentTimeMillis());
    }

    private String hashString(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}
