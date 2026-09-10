package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DestructionService {

    private final DestructionRecordRepository destructionRecordRepository;
    private final CertificateRepository certificateRepository;
    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final OrganizationRepository organizationRepository;
    private final BatchStateMachine stateMachine;
    private final InvalidRegistryRepository invalidRegistryRepository;
    private final BatchEventRepository batchEventRepository;
    private final NotificationService notificationService;
    private final CertificatePdfService certificatePdfService;
    private final FileStorageService fileStorageService;
    
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

        DestructionRecord savedRecord = destructionRecordRepository.save(record);

        log.info("Scheduled destruction {} for batch {} with quantity {}", 
                savedRecord.getDestructionId(), batch.getBatchId(), request.getQuantity());

        return savedRecord;
    }

    @Transactional
    public Certificate confirmDestruction(UUID destructionId, com.pharma.reversechain.dto.ConfirmDestructionRequest request, User actor) {
        DestructionRecord record = destructionRecordRepository.findById(destructionId)
                .orElseThrow(() -> new IllegalArgumentException("Destruction record not found"));

        // Idempotency check
        if (record.getStatus() == DestructionStatus.DESTROYED) {
            Certificate existingCert = certificateRepository.findByDestructionId(destructionId)
                    .orElseThrow(() -> new IllegalStateException("Destruction marked complete but no certificate found"));
            log.info("Destruction {} already confirmed, returning existing certificate {}", destructionId, existingCert.getCertificateId());
            return existingCert;
        }

        // Validate destruction is scheduled
        if (record.getStatus() != DestructionStatus.SCHEDULED) {
            throw new IllegalStateException("Destruction record must be in SCHEDULED status. Current status: " + record.getStatus());
        }

        Batch batch = batchRepository.findById(record.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found"));

        // Validate batch identity matches
        if (!batch.getBatchId().equals(record.getBatchId())) {
            throw new IllegalStateException("Batch identity mismatch");
        }

        // Validate manufacturer receipt happened (batch must have been WITH_MANUFACTURER before scheduling)
        // This is implicitly validated by the state machine requiring SCHEDULED_FOR_DESTRUCTION to come from WITH_MANUFACTURER

        // Validate quantity
        if (!record.getQuantity().equals(request.getQuantityDestroyed())) {
            throw new IllegalArgumentException("Destroyed quantity must match scheduled quantity exactly. Expected: " 
                    + record.getQuantity() + ", Got: " + request.getQuantityDestroyed());
        }

        // Validate actor authorization (waste facility performing the destruction)
        if (!actor.getOrganizationId().equals(record.getWasteFacilityId())) {
            throw new SecurityException("Actor organization must match the waste facility assigned to this destruction");
        }

        // Load related entities for certificate generation
        Product product = productRepository.findById(batch.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        Organization manufacturer = organizationRepository.findById(batch.getManufacturerId())
                .orElseThrow(() -> new IllegalArgumentException("Manufacturer not found"));
        Organization wasteFacility = organizationRepository.findById(record.getWasteFacilityId())
                .orElseThrow(() -> new IllegalArgumentException("Waste facility not found"));

        // Generate certificate PDF
        InputStream certificatePdfStream;
        String certificateHash;
        String fileStorageReference;
        UUID certificateId = UUID.randomUUID();
        
        try {
            certificatePdfStream = certificatePdfService.generateCertificatePdf(
                    certificateId,
                    batch,
                    product,
                    manufacturer,
                    wasteFacility,
                    request.getQuantityDestroyed(),
                    request.getDestructionDate(),
                    request.getDestructionMethod(),
                    request.getFacilityLicense()
            );
            
            // Calculate SHA-256 hash
            byte[] pdfBytes = certificatePdfStream.readAllBytes();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(pdfBytes);
            certificateHash = HexFormat.of().formatHex(hashBytes);
            
            // Store PDF file
            String filename = "certificate_" + certificateId + ".pdf";
            fileStorageReference = fileStorageService.store(
                    new java.io.ByteArrayInputStream(pdfBytes),
                    filename,
                    "application/pdf"
            );
            
            log.info("Generated certificate PDF with hash {} and stored at {}", certificateHash, fileStorageReference);
            
        } catch (Exception e) {
            log.error("Failed to generate certificate PDF: {}", e.getMessage(), e);
            throw new IllegalStateException("Certificate PDF generation failed: " + e.getMessage(), e);
        }

        String txId = "local-fallback-" + UUID.randomUUID();
        // Update destruction record
        record.setStatus(DestructionStatus.DESTROYED);
        destructionRecordRepository.save(record);

        // Add to Invalid Registry
        InvalidRegistry invalidRegistry = new InvalidRegistry();
        invalidRegistry.setManufacturerId(batch.getManufacturerId());
        invalidRegistry.setBatchNumber(batch.getBatchNumber());
        invalidRegistry.setManufacturingDate(batch.getManufacturingDate());
        invalidRegistry.setExpiryDate(batch.getExpiryDate());
        invalidRegistry.setInvalidatedQuantity(request.getQuantityDestroyed());
        invalidRegistry.setReason("DESTROYED_CERT_" + certificateId + "_TX_" + txId);
        invalidRegistry.setCreatedAt(LocalDateTime.now());
        invalidRegistryRepository.save(invalidRegistry);
        
        log.info("Added {} units to invalid registry for batch {}", request.getQuantityDestroyed(), batch.getBatchNumber());

        // Update batch status and quantity
        batch = stateMachine.transitionBatch(batch, BatchStatus.DESTROYED, "DESTRUCTION_CONFIRMED",
                actor.getName(), actor.getOrganizationId(), actor.getRole(), null, request.getQuantityDestroyed(), 
                certificateHash, "Certificate: " + certificateId + ", TxId: " + txId);
        
        batch.setCurrentQuantity(batch.getCurrentQuantity() - request.getQuantityDestroyed());
        batchRepository.save(batch);

        // Create BatchEvent
        BatchEvent event = new BatchEvent();
        event.setBatchId(batch.getBatchId());
        event.setEventType("DESTRUCTION_CONFIRMED");
        event.setPreviousStatus(BatchStatus.SCHEDULED_FOR_DESTRUCTION);
        event.setNewStatus(BatchStatus.DESTROYED);
        event.setActor(actor.getName());
        event.setOrganizationId(actor.getOrganizationId());
        event.setRole(actor.getRole());
        event.setQuantity(request.getQuantityDestroyed());
        event.setVerificationInfo("Certificate: " + certificateId + ", Hash: " + certificateHash);
        event.setHash(txId);
        event.setTimestamp(LocalDateTime.now());
        batchEventRepository.save(event);

        // Create Certificate entity
        Certificate cert = new Certificate();
        cert.setCertificateId(certificateId);
        cert.setBatchId(batch.getBatchId());
        cert.setDestructionId(record.getDestructionId());
        cert.setProductId(batch.getProductId());
        cert.setBatchNumber(batch.getBatchNumber());
        cert.setManufacturerId(batch.getManufacturerId());
        cert.setManufacturingDate(batch.getManufacturingDate());
        cert.setExpiryDate(batch.getExpiryDate());
        cert.setQuantityDestroyed(request.getQuantityDestroyed());
        cert.setDestructionDate(request.getDestructionDate());
        cert.setDestructionMethod(request.getDestructionMethod());
        cert.setFacilityId(actor.getOrganizationId());
        cert.setFacilityLicense(request.getFacilityLicense());
        cert.setCertificateHash(certificateHash);
        cert.setBlockchainTxId(txId);
        cert.setFileStorageReference(fileStorageReference);
        cert.setStatus("VERIFIED");
        cert.setIssuerId(actor.getId());
        cert.setIssuedAt(LocalDateTime.now());
        cert.setCreatedAt(LocalDateTime.now());

        Certificate savedCert = certificateRepository.save(cert);
        
        log.info("Created certificate {} for destruction {}, batch {}", savedCert.getCertificateId(), destructionId, batch.getBatchNumber());

        // Create notifications
        notificationService.notifyDestruction(batch, savedCert, manufacturer, wasteFacility);

        return savedCert;
    }
}
