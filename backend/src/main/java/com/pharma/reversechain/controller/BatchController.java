package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.BatchResponse;
import com.pharma.reversechain.dto.BatchEventResponse;
import com.pharma.reversechain.dto.VerifyBatchRequest;
import com.pharma.reversechain.dto.VerifyBatchResponse;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.BatchEventRepository;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.InvalidRegistryRepository;
import com.pharma.reversechain.repository.OrganizationRepository;
import com.pharma.reversechain.repository.ProductRepository;
import com.pharma.reversechain.security.UserDetailsImpl;
import com.pharma.reversechain.service.FraudDetectionService;
import com.pharma.reversechain.service.RiskScoringService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BatchController {

    private final BatchRepository batchRepository;
    private final BatchEventRepository batchEventRepository;
    private final FraudDetectionService fraudDetectionService;
    private final OrganizationRepository organizationRepository;
    private final InvalidRegistryRepository invalidRegistryRepository;
    private final ProductRepository productRepository;

    @GetMapping("/batches")
    public Page<BatchResponse> getBatches(@AuthenticationPrincipal UserDetailsImpl userDetails, Pageable pageable) {
        return batchRepository.findAll(pageable).map(this::toBatchResponse);
    }

    @GetMapping("/batches/{id}")
    public ResponseEntity<BatchResponse> getBatch(@PathVariable String id) {
        return findBatchByIdOrNumber(id)
                .map(this::toBatchResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping({"/batches/{id}/timeline", "/batches/{id}/events"})
    public ResponseEntity<List<BatchEventResponse>> getBatchTimeline(@PathVariable String id) {
        Optional<Batch> batchOpt = findBatchByIdOrNumber(id);
        if (batchOpt.isPresent()) {
            List<BatchEventResponse> events = batchEventRepository.findByBatchIdOrderByTimestampDesc(batchOpt.get().getBatchId())
                .stream()
                .map(this::toBatchEventResponse)
                .toList();
            return ResponseEntity.ok(events);
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping({"/verify", "/batches/verify"})
    public ResponseEntity<VerifyBatchResponse> verifyBatch(
            @Valid @RequestBody VerifyBatchRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Batch batch = null;
        if (request.getManufacturerId() != null && request.getManufacturingDate() != null && request.getExpiryDate() != null) {
            batch = batchRepository.findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
                    request.getManufacturerId(), request.getBatchNumber(), request.getManufacturingDate(), request.getExpiryDate()
            ).orElse(null);
        }

        if (batch == null) {
            List<Batch> matches = batchRepository.findByBatchNumber(request.getBatchNumber());
            if (!matches.isEmpty()) {
                batch = matches.get(0);
            }
        }

        // Check invalid registry if not found or already invalid
        boolean inInvalidRegistry = invalidRegistryRepository.existsByBatchNumber(request.getBatchNumber());

        Organization org = null;
        if (userDetails != null && userDetails.getOrganizationId() != null) {
            org = organizationRepository.findById(userDetails.getOrganizationId()).orElse(null);
        }

        RiskScoringService.RiskScoreResult riskResult = fraudDetectionService.detectFraudForVerification(
                batch, request.getBatchNumber(), request.getLocation(), org);

        boolean allowSale = true;
        String status = "UNKNOWN";
        String message = "Batch verified successfully.";

        if (batch != null) {
            status = batch.getCurrentStatus().name();
        }

        if (inInvalidRegistry || status.equals("DESTROYED")) {
            allowSale = false;
            status = "DESTROYED";
            message = "SALE BLOCKED: BATCH PREVIOUSLY DESTROYED. CDSCO and Manufacturer have been alerted.";
            return ResponseEntity.ok(new VerifyBatchResponse(allowSale, status, RiskLevel.CRITICAL, message));
        }

        if (riskResult.level() == RiskLevel.CRITICAL || riskResult.level() == RiskLevel.HIGH) {
            allowSale = false;
            message = "High risk detected: " + String.join(", ", riskResult.reasons()) + ". Sale should be blocked.";
        }

        return ResponseEntity.ok(new VerifyBatchResponse(allowSale, status, riskResult.level(), message));
    }

    private Optional<Batch> findBatchByIdOrNumber(String id) {
        try {
            UUID uuid = UUID.fromString(id);
            Optional<Batch> byId = batchRepository.findById(uuid);
            if (byId.isPresent()) {
                return byId;
            }
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, fallback to batch number
        }

        List<Batch> byNumber = batchRepository.findByBatchNumber(id);
        if (!byNumber.isEmpty()) {
            return Optional.of(byNumber.get(0));
        }

        return Optional.empty();
    }

    private BatchResponse toBatchResponse(Batch batch) {
        Product product = productRepository.findById(batch.getProductId()).orElse(null);
        Organization manufacturer = organizationRepository.findById(batch.getManufacturerId()).orElse(null);
        Organization currentOwner = batch.getCurrentOwnerId() != null 
                ? organizationRepository.findById(batch.getCurrentOwnerId()).orElse(null) 
                : null;
        
        return BatchResponse.builder()
                .batchId(batch.getBatchId())
                .batchNumber(batch.getBatchNumber())
                .productName(product != null ? product.getProductName() : null)
                .productId(batch.getProductId())
                .manufacturerName(manufacturer != null ? manufacturer.getName() : null)
                .manufacturerId(batch.getManufacturerId())
                .manufacturingDate(batch.getManufacturingDate())
                .expiryDate(batch.getExpiryDate())
                .originalQuantity(batch.getOriginalQuantity())
                .currentQuantity(batch.getCurrentQuantity())
                .unit(batch.getUnit())
                .currentStatus(batch.getCurrentStatus())
                .currentOwnerName(currentOwner != null ? currentOwner.getName() : null)
                .currentOwnerId(batch.getCurrentOwnerId())
                .riskScore(batch.getRiskScore())
                .riskLevel(batch.getRiskLevel())
                .createdAt(batch.getCreatedAt())
                .build();
    }

    private BatchEventResponse toBatchEventResponse(BatchEvent event) {
        return BatchEventResponse.builder()
                .eventId(event.getEventId())
                .batchId(event.getBatchId())
                .eventType(event.getEventType())
                .previousStatus(event.getPreviousStatus() != null ? event.getPreviousStatus().name() : null)
                .newStatus(event.getNewStatus() != null ? event.getNewStatus().name() : null)
                .actor(event.getActor())
                .organizationId(event.getOrganizationId())
                .role(event.getRole() != null ? event.getRole().name() : null)
                .timestamp(event.getTimestamp())
                .location(event.getLocation())
                .quantity(event.getQuantity())
                .evidenceRefs(event.getEvidenceRefs())
                .verificationInfo(event.getVerificationInfo())
                .hash(event.getHash())
                .build();
    }
}
