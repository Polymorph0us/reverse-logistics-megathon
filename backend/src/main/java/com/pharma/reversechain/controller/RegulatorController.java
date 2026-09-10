package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.FraudAlert;
import com.pharma.reversechain.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/regulator")
@RequiredArgsConstructor
@PreAuthorize("hasRole('REGULATOR') or hasRole('ADMIN')")
public class RegulatorController {

    private final FraudAlertRepository fraudAlertRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        long totalAlerts = fraudAlertRepository.count();
        // In reality we'd do complex aggregations
        return ResponseEntity.ok(Map.of(
                "totalAlerts", totalAlerts,
                "highRiskBatches", 0 // Stub
        ));
    }

    @GetMapping("/alerts")
    public Page<FraudAlert> getAlerts(Pageable pageable) {
        return fraudAlertRepository.findAll(pageable);
    }

    @GetMapping("/investigations/{alertId}")
    public ResponseEntity<Map<String, Object>> getInvestigationDetails(@PathVariable UUID alertId) {
        return fraudAlertRepository.findById(alertId)
                .map(alert -> ResponseEntity.ok(Map.of(
                        "alert", alert,
                        "blockchainProof", "MOCK_PROOF_12345"
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
