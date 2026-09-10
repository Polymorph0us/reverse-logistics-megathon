package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.CertificateRepository;
import com.pharma.reversechain.repository.DestructionRecordRepository;
import com.pharma.reversechain.repository.InvalidRegistryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DestructionService {

    private final DestructionRecordRepository destructionRecordRepository;
    private final CertificateRepository certificateRepository;
    private final BatchRepository batchRepository;
    private final BatchStateMachine stateMachine;
    private final BlockchainService blockchainService;
    private final InvalidRegistryRepository invalidRegistryRepository;

    @Transactional
    public DestructionRecord scheduleDestruction(com.pharma.reversechain.dto.ScheduleDestructionRequest request, User actor) {
        Batch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found"));

        if (!batch.getCurrentStatus().equals(BatchStatus.WITH_MANUFACTURER) && !batch.getCurrentStatus().equals(BatchStatus.EXPIRED)) {
            throw new IllegalStateException("Only batches currently WITH_MANUFACTURER or EXPIRED can be scheduled for destruction.");
        }

        if (batch.getCurrentQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException("Quantity to destroy exceeds current batch quantity");
        }

        batch = stateMachine.transitionBatch(batch, BatchStatus.SCHEDULED_FOR_DESTRUCTION, "SCHEDULED_FOR_DESTRUCTION",
                actor.getName(), actor.getOrganizationId(), actor.getRole(), null, request.getQuantity(), null, null);
        
        batchRepository.save(batch);

        DestructionRecord record = new DestructionRecord();
        record.setBatchId(batch.getBatchId());
        record.setQuantity(request.getQuantity());
        record.setWasteFacilityId(request.getWasteFacilityId());
        record.setScheduledDate(request.getScheduledDate());
        record.setStatus(DestructionStatus.SCHEDULED);

        return destructionRecordRepository.save(record);
    }

    @Transactional
    public Certificate confirmDestruction(UUID destructionId, com.pharma.reversechain.dto.ConfirmDestructionRequest request, User actor) {
        DestructionRecord record = destructionRecordRepository.findById(destructionId)
                .orElseThrow(() -> new IllegalArgumentException("Destruction record not found"));

        if (record.getStatus() == DestructionStatus.DESTROYED) {
            // Idempotent return if already destroyed
            return certificateRepository.findAll().stream()
                    .filter(c -> c.getDestructionId().equals(destructionId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Destruction marked complete but no certificate found"));
        }

        Batch batch = batchRepository.findById(record.getBatchId()).get();

        if (!record.getQuantity().equals(request.getQuantityDestroyed())) {
            throw new IllegalArgumentException("Destroyed quantity must match scheduled quantity for this record exactly");
        }

        // Mock Blockchain Call
        String txId = blockchainService.recordDestruction(request.getCertificateHash());

        // Update batch status and quantity
        batch = stateMachine.transitionBatch(batch, BatchStatus.DESTROYED, "DESTRUCTION_CONFIRMED",
                actor.getName(), actor.getOrganizationId(), actor.getRole(), null, request.getQuantityDestroyed(), request.getCertificateHash(), "TxId: " + txId);
        
        batch.setCurrentQuantity(batch.getCurrentQuantity() - request.getQuantityDestroyed());
        // Note: Batch stays in DESTROYED status until it's explicitly CLOSED if we want, but DESTROYED is terminal enough for this flow.
        batchRepository.save(batch);

        // Update Destruction Record
        record.setStatus(DestructionStatus.DESTROYED);
        destructionRecordRepository.save(record);

        // Add to Invalid Registry for Reentry Checks
        InvalidRegistry invalidRegistry = new InvalidRegistry();
        invalidRegistry.setManufacturerId(batch.getManufacturerId());
        invalidRegistry.setBatchNumber(batch.getBatchNumber());
        invalidRegistry.setManufacturingDate(batch.getManufacturingDate());
        invalidRegistry.setExpiryDate(batch.getExpiryDate());
        invalidRegistry.setInvalidatedQuantity(request.getQuantityDestroyed());
        invalidRegistry.setReason("DESTROYED_BY_FACILITY_CERT_" + txId);
        invalidRegistryRepository.save(invalidRegistry);

        // Create Certificate
        Certificate cert = new Certificate();
        cert.setBatchId(batch.getBatchId());
        cert.setDestructionId(record.getDestructionId());
        cert.setQuantityDestroyed(request.getQuantityDestroyed());
        cert.setDestructionDate(request.getDestructionDate());
        cert.setFacilityId(actor.getOrganizationId());
        cert.setCertificateHash(request.getCertificateHash());
        cert.setBlockchainTxId(txId);
        cert.setStatus("VERIFIED");
        cert.setCreatedAt(LocalDateTime.now());

        return certificateRepository.save(cert);
    }
}
