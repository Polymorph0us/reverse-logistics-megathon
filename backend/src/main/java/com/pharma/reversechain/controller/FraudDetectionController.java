package com.pharma.reversechain.controller;

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
    public ResponseEntity<List<FraudAlert>> getAllAlerts(
            @RequestParam(required = false) AlertSeverity severity,
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) UUID batchId) {
            
        if (batchId != null) {
            return ResponseEntity.ok(fraudAlertRepository.findByBatchId(batchId));
        } else if (severity != null) {
            return ResponseEntity.ok(fraudAlertRepository.findBySeverity(severity));
        } else if (status != null) {
            return ResponseEntity.ok(fraudAlertRepository.findByStatus(status));
        }
        
        return ResponseEntity.ok(fraudAlertRepository.findAll());
    }

    @PatchMapping("/alerts/{alertId}/status")
    public ResponseEntity<FraudAlert> updateAlertStatus(
            @PathVariable UUID alertId,
            @RequestParam AlertStatus status) {
            
        FraudAlert alert = fraudAlertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found"));
                
        alert.setStatus(status);
        
        return ResponseEntity.ok(fraudAlertRepository.save(alert));
    }
}
