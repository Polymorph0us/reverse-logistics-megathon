package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.FraudAlertResponse;
import com.pharma.reversechain.entity.AlertSeverity;
import com.pharma.reversechain.entity.AlertStatus;
import com.pharma.reversechain.entity.FraudAlert;
import com.pharma.reversechain.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fraud")
@RequiredArgsConstructor
public class FraudDetectionController {

    private final FraudAlertRepository fraudAlertRepository;

    @GetMapping("/alerts")
    public ResponseEntity<List<FraudAlertResponse>> getAllAlerts(
            @RequestParam(required = false) AlertSeverity severity,
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) UUID batchId) {
            
        List<FraudAlert> alerts;
        if (batchId != null) {
            alerts = fraudAlertRepository.findByBatchId(batchId);
        } else if (severity != null) {
            alerts = fraudAlertRepository.findBySeverity(severity);
        } else if (status != null) {
            alerts = fraudAlertRepository.findByStatus(status);
        } else {
            alerts = fraudAlertRepository.findAll();
        }
        
        return ResponseEntity.ok(alerts.stream().map(this::toFraudAlertResponse).toList());
    }

    @PatchMapping("/alerts/{alertId}/status")
    public ResponseEntity<FraudAlertResponse> updateAlertStatus(
            @PathVariable UUID alertId,
            @RequestParam AlertStatus status) {
            
        FraudAlert alert = fraudAlertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found"));
                
        alert.setStatus(status);
        
        return ResponseEntity.ok(toFraudAlertResponse(fraudAlertRepository.save(alert)));
    }

    private FraudAlertResponse toFraudAlertResponse(FraudAlert alert) {
        FraudAlertResponse response = new FraudAlertResponse();
        response.setAlertId(alert.getAlertId());
        response.setType(alert.getType());
        response.setSeverity(alert.getSeverity());
        response.setStatus(alert.getStatus());
        response.setBatchId(alert.getBatchId());
        response.setBatchNumber(alert.getBatchNumber());
        response.setDetectedAt(alert.getDetectedAt());
        response.setLocation(alert.getLocation());
        response.setOrganizationId(alert.getOrganizationId());
        response.setMessage(alert.getMessage());
        return response;
    }
}
