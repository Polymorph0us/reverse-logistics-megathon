package com.pharma.reversechain.service;

import com.pharma.reversechain.controller.ConsignmentController;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsignmentService {

    private final MasterConsignmentRepository consignmentRepository;
    private final ConsignmentItemRepository consignmentItemRepository;
    private final ReturnBagRepository returnBagRepository;
    private final FraudDetectionService fraudDetectionService;

    @Transactional
    public ReturnBag createReturnBag(String trackingId, UUID batchId, Integer quantity, User distributor) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        ReturnBag bag = new ReturnBag();
        bag.setBagId("TER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        bag.setTrackingId(trackingId);
        bag.setBatchId(batchId);
        bag.setQuantity(quantity);
        bag.setCurrentOrganizationId(distributor.getOrganizationId());
        bag.setStatus(ReturnBagStatus.CREATED);
        ReturnBag saved = returnBagRepository.save(bag);
        log.info("Created TER-Bag {} for tracking ID {} by org {}", saved.getBagId(), trackingId, distributor.getOrganizationId());
        return saved;
    }

    @Transactional
    public MasterConsignment createConsignment(UUID targetManufacturerId, User distributor) {
        MasterConsignment mcm = new MasterConsignment();
        mcm.setMcmId("MCM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        mcm.setDistributorId(distributor.getOrganizationId());
        mcm.setTargetManufacturerId(targetManufacturerId);
        mcm.setStatus(ConsignmentStatus.OPEN);
        MasterConsignment saved = consignmentRepository.save(mcm);
        log.info("Created MCM {} by distributor {} targeting manufacturer {}", saved.getMcmId(), distributor.getOrganizationId(), targetManufacturerId);
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<MasterConsignment> listConsignments(User actor, Pageable pageable) {
        return consignmentRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public MasterConsignment getConsignment(UUID mcmId, User actor) {
        return consignmentRepository.findById(mcmId)
                .orElseThrow(() -> new IllegalArgumentException("MCM not found: " + mcmId));
    }

    @Transactional
    public MasterConsignment addBagsToConsignment(UUID mcmId, List<String> bagIds, User distributor) {
        MasterConsignment mcm = consignmentRepository.findById(mcmId)
                .orElseThrow(() -> new IllegalArgumentException("MCM not found: " + mcmId));

        if (mcm.getStatus() != ConsignmentStatus.OPEN) {
            throw new IllegalStateException("Cannot add bags to a non-OPEN MCM. Current status: " + mcm.getStatus());
        }
        if (!mcm.getDistributorId().equals(distributor.getOrganizationId())) {
            throw new IllegalStateException("Unauthorized: You do not own this MCM");
        }

        for (String bagId : bagIds) {
            ReturnBag bag = returnBagRepository.findByBagId(bagId)
                    .orElseThrow(() -> new IllegalArgumentException("TER-Bag not found: " + bagId));

            if (bag.getStatus() == ReturnBagStatus.CONSOLIDATED) {
                throw new IllegalStateException("TER-Bag " + bagId + " is already consolidated in another MCM");
            }
            if (bag.getStatus() == ReturnBagStatus.DISPUTED) {
                throw new IllegalStateException("TER-Bag " + bagId + " is under dispute and cannot be consolidated");
            }
            if (!bag.getCurrentOrganizationId().equals(distributor.getOrganizationId())) {
                throw new IllegalStateException("Unauthorized: TER-Bag " + bagId + " does not belong to your organization");
            }

            // Check this bag isn't already in this MCM
            List<ConsignmentItem> existing = consignmentItemRepository.findByReturnBagId(bag.getId());
            for (ConsignmentItem ei : existing) {
                if (ei.getMcmId().equals(mcmId)) {
                    throw new IllegalStateException("TER-Bag " + bagId + " is already in this MCM");
                }
            }

            ConsignmentItem item = new ConsignmentItem();
            item.setMcmId(mcm.getId());
            item.setReturnBagId(bag.getId());
            consignmentItemRepository.save(item);

            bag.setStatus(ReturnBagStatus.CONSOLIDATED);
            returnBagRepository.save(bag);

            mcm.setTotalBags(mcm.getTotalBags() + 1);
            mcm.setTotalQuantity(mcm.getTotalQuantity() + bag.getQuantity());
        }

        return consignmentRepository.save(mcm);
    }

    @Transactional
    public MasterConsignment sealConsignment(UUID mcmId, String sealId, User distributor) {
        MasterConsignment mcm = consignmentRepository.findById(mcmId)
                .orElseThrow(() -> new IllegalArgumentException("MCM not found: " + mcmId));

        if (mcm.getStatus() != ConsignmentStatus.OPEN) {
            throw new IllegalStateException("Cannot seal MCM with status: " + mcm.getStatus());
        }
        if (!mcm.getDistributorId().equals(distributor.getOrganizationId())) {
            throw new IllegalStateException("Unauthorized: You do not own this MCM");
        }
        if (mcm.getTotalBags() == 0) {
            throw new IllegalStateException("Cannot seal an empty MCM. Add TER-Bags first.");
        }

        // Check seal uniqueness
        consignmentRepository.findBySealId(sealId).ifPresent(existing -> {
            throw new IllegalStateException("Seal ID '" + sealId + "' is already in use by MCM: " + existing.getMcmId());
        });

        String hash = calculateDeterministicHash(mcm.getId());
        mcm.setMcmHash(hash);
        mcm.setSealId(sealId);
        mcm.setStatus(ConsignmentStatus.SEALED);

        log.info("Sealed MCM {} with seal {} and hash {}", mcm.getMcmId(), sealId, hash.substring(0, 16) + "...");
        return consignmentRepository.save(mcm);
    }

    @Transactional
    public MasterConsignment dispatchConsignment(UUID mcmId, User distributor) {
        MasterConsignment mcm = consignmentRepository.findById(mcmId)
                .orElseThrow(() -> new IllegalArgumentException("MCM not found: " + mcmId));

        if (mcm.getStatus() != ConsignmentStatus.SEALED) {
            throw new IllegalStateException("Cannot dispatch MCM with status: " + mcm.getStatus() + ". MCM must be SEALED first.");
        }

        mcm.setStatus(ConsignmentStatus.DISPATCHED);
        mcm.setDispatchedAt(LocalDateTime.now());

        // Update all bags to IN_TRANSIT
        List<ConsignmentItem> items = consignmentItemRepository.findByMcmId(mcmId);
        for (ConsignmentItem item : items) {
            ReturnBag bag = returnBagRepository.findById(item.getReturnBagId()).orElseThrow();
            bag.setStatus(ReturnBagStatus.IN_TRANSIT);
            returnBagRepository.save(bag);
        }

        log.info("Dispatched MCM {} with {} bags", mcm.getMcmId(), items.size());
        return consignmentRepository.save(mcm);
    }

    @Transactional
    public MasterConsignment receiveConsignment(UUID mcmId, String providedSealId, User manufacturer) {
        MasterConsignment mcm = consignmentRepository.findById(mcmId)
                .orElseThrow(() -> new IllegalArgumentException("MCM not found: " + mcmId));

        if (mcm.getStatus() != ConsignmentStatus.DISPATCHED) {
            throw new IllegalStateException("Cannot receive MCM with status: " + mcm.getStatus() + ". MCM must be DISPATCHED.");
        }

        // Authorization check
        if (manufacturer.getOrganizationId() == null) {
            throw new IllegalStateException("Manufacturer's organization ID is not set.");
        }
        if (!mcm.getTargetManufacturerId().equals(manufacturer.getOrganizationId())) {
            log.warn("Unauthorized MCM receipt attempt. MCM target: {}, Requester org: {}",
                    mcm.getTargetManufacturerId(), manufacturer.getOrganizationId());
            throw new IllegalStateException("Unauthorized receipt. This MCM is intended for organization: " + mcm.getTargetManufacturerId());
        }

        // Step 1: Verify seal
        if (!mcm.getSealId().equals(providedSealId)) {
            mcm.setStatus(ConsignmentStatus.COMPROMISED);
            consignmentRepository.save(mcm);
            fraudDetectionService.generateAlert(
                "CONSIGNMENT_SEAL_MISMATCH",
                AlertSeverity.CRITICAL,
                null,
                null,
                null,
                manufacturer.getOrganization(),
                "Physical seal mismatch for MCM " + mcm.getMcmId() + ". Expected: " + mcm.getSealId() + ", Received: " + providedSealId
            );
            log.warn("Seal mismatch for MCM {}. Expected: {}, Got: {}", mcm.getMcmId(), mcm.getSealId(), providedSealId);
            throw new IllegalStateException("Physical Seal Verification Failed. Expected: " + mcm.getSealId() + ", Got: " + providedSealId);
        }

        // Step 2: Verify hash integrity
        String recalculatedHash = calculateDeterministicHash(mcm.getId());
        if (!recalculatedHash.equals(mcm.getMcmHash())) {
            mcm.setStatus(ConsignmentStatus.COMPROMISED);
            consignmentRepository.save(mcm);
            fraudDetectionService.generateAlert(
                "MCM_INTEGRITY_MISMATCH",
                AlertSeverity.CRITICAL,
                null,
                null,
                null,
                manufacturer.getOrganization(),
                "Manifest integrity hash mismatch for MCM: " + mcm.getMcmId() + ". Contents may have been tampered with."
            );
            log.warn("Hash mismatch for MCM {}. Stored: {}, Calculated: {}", mcm.getMcmId(), mcm.getMcmHash(), recalculatedHash);
            throw new IllegalStateException("MCM Integrity Verification Failed. The manifest contents have been tampered.");
        }

        // Step 3: Mark as received
        mcm.setStatus(ConsignmentStatus.RECEIVED);
        mcm.setReceivedAt(LocalDateTime.now());
        consignmentRepository.save(mcm);

        // Step 4: Update all bags
        List<ConsignmentItem> items = consignmentItemRepository.findByMcmId(mcmId);
        for (ConsignmentItem item : items) {
            ReturnBag bag = returnBagRepository.findById(item.getReturnBagId()).orElseThrow();
            bag.setStatus(ReturnBagStatus.RECEIVED);
            bag.setCurrentOrganizationId(manufacturer.getOrganizationId());
            returnBagRepository.save(bag);
        }

        log.info("MCM {} received successfully by manufacturer {} with {} bags", mcm.getMcmId(), manufacturer.getOrganizationId(), items.size());
        return mcm;
    }

    @Transactional(readOnly = true)
    public ConsignmentController.ConsignmentVerifyResponse verifyConsignment(UUID mcmId, User actor) {
        MasterConsignment mcm = consignmentRepository.findById(mcmId)
                .orElseThrow(() -> new IllegalArgumentException("MCM not found: " + mcmId));

        String calculatedHash = calculateDeterministicHash(mcmId);
        boolean hashMatch = calculatedHash.equals(mcm.getMcmHash());

        ConsignmentController.ConsignmentVerifyResponse response = new ConsignmentController.ConsignmentVerifyResponse();
        response.setMcmId(mcm.getMcmId());
        response.setStoredHash(mcm.getMcmHash());
        response.setCalculatedHash(calculatedHash);
        response.setHashMatch(hashMatch);
        response.setStatus(mcm.getStatus().name());
        response.setMessage(hashMatch
                ? "MCM integrity verified. Contents are intact."
                : "WARNING: MCM integrity check FAILED. Contents may have been modified.");

        return response;
    }

    /**
     * Deterministic SHA-256 hash of all constituent TER-Bags.
     * Input: sorted list of "bagId|trackingId|quantity" strings.
     * This ensures the same bags always produce the same hash regardless of insertion order.
     */
    public String calculateDeterministicHash(UUID mcmId) {
        try {
            List<ConsignmentItem> items = consignmentItemRepository.findByMcmId(mcmId);
            if (items.isEmpty()) {
                throw new IllegalStateException("Cannot compute hash for empty MCM");
            }

            List<String> canonicalEntries = new ArrayList<>();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            for (ConsignmentItem item : items) {
                ReturnBag bag = returnBagRepository.findById(item.getReturnBagId())
                        .orElseThrow(() -> new IllegalStateException("ReturnBag not found: " + item.getReturnBagId()));
                // Stable canonical string: bagId + trackingId + quantity (all immutable after bag creation)
                String canonical = bag.getBagId() + "|" + bag.getTrackingId() + "|" + bag.getQuantity();
                canonicalEntries.add(canonical);
            }

            // Sort deterministically by the canonical string itself
            Collections.sort(canonicalEntries);

            StringBuilder masterStr = new StringBuilder();
            for (String entry : canonicalEntries) {
                masterStr.append(entry).append("||");
            }

            byte[] masterHashBytes = digest.digest(masterStr.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(masterHashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
