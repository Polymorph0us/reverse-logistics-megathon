package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.VerifyBatchRequest;
import com.pharma.reversechain.dto.VerifyBatchResponse;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.BatchEventRepository;
import com.pharma.reversechain.repository.BatchRepository;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchRepository batchRepository;
    private final BatchEventRepository batchEventRepository;
    private final FraudDetectionService fraudDetectionService;
    private final OrganizationRepository organizationRepository;

    @GetMapping
    public Page<Batch> getBatches(@AuthenticationPrincipal UserDetailsImpl userDetails, Pageable pageable) {
        // Implement filter by organization id unless REGULATOR
        // For simplicity, returning all paginated, real implementation would add Specifications
        return batchRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Batch> getBatch(@PathVariable UUID id) {
        return batchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<BatchEvent>> getBatchTimeline(@PathVariable UUID id) {
        return ResponseEntity.ok(batchEventRepository.findByBatchIdOrderByTimestampDesc(id));
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyBatchResponse> verifyBatch(
            @Valid @RequestBody VerifyBatchRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Batch batch = batchRepository.findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
                request.getManufacturerId(), request.getBatchNumber(), request.getManufacturingDate(), request.getExpiryDate()
        ).orElse(null);

        Organization org = null;
        if (userDetails != null && userDetails.getOrganizationId() != null) {
            org = organizationRepository.findById(userDetails.getOrganizationId()).orElse(null);
        }

        RiskScoringService.RiskScoreResult riskResult = fraudDetectionService.detectFraudForVerification(batch, request.getLocation(), org);

        boolean allowSale = true;
        String status = "UNKNOWN";
        String message = "Batch verified successfully.";

        if (batch != null) {
            status = batch.getCurrentStatus().name();
        }

        if (riskResult.level() == RiskLevel.CRITICAL || riskResult.level() == RiskLevel.HIGH) {
            allowSale = false;
            message = "High risk detected: " + String.join(", ", riskResult.reasons()) + ". Sale should be blocked.";
        }

        return ResponseEntity.ok(new VerifyBatchResponse(allowSale, status, riskResult.level(), message));
    }
}
