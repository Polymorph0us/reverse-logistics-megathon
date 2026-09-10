package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.VerifyBatchRequest;
import com.pharma.reversechain.dto.VerifyBatchResponse;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.BatchEventRepository;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.InvalidRegistryRepository;
import com.pharma.reversechain.repository.OrganizationRepository;
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

    @GetMapping("/batches")
    public Page<Batch> getBatches(@AuthenticationPrincipal UserDetailsImpl userDetails, Pageable pageable) {
        return batchRepository.findAll(pageable);
    }

    @GetMapping("/batches/{id}")
    public ResponseEntity<Batch> getBatch(@PathVariable String id) {
        return findBatchByIdOrNumber(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping({"/batches/{id}/timeline", "/batches/{id}/events"})
    public ResponseEntity<List<BatchEvent>> getBatchTimeline(@PathVariable String id) {
        Optional<Batch> batchOpt = findBatchByIdOrNumber(id);
        if (batchOpt.isPresent()) {
            return ResponseEntity.ok(batchEventRepository.findByBatchIdOrderByTimestampDesc(batchOpt.get().getBatchId()));
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
}
