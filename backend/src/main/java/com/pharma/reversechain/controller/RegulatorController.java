package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.AlertSeverity;
import com.pharma.reversechain.entity.BatchStatus;
import com.pharma.reversechain.entity.FraudAlert;
import com.pharma.reversechain.entity.OrganizationType;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.FraudAlertRepository;
import com.pharma.reversechain.repository.OrganizationRepository;
import com.pharma.reversechain.repository.ReturnRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/regulator")
@RequiredArgsConstructor
@PreAuthorize("hasRole('REGULATOR') or hasRole('ADMIN')")
public class RegulatorController {

    private final FraudAlertRepository fraudAlertRepository;
    private final OrganizationRepository organizationRepository;
    private final BatchRepository batchRepository;
    private final ReturnRequestRepository returnRequestRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        long mfrCount = organizationRepository.findAll().stream().filter(o -> o.getType() == OrganizationType.MANUFACTURER).count();
        long distCount = organizationRepository.findAll().stream().filter(o -> o.getType() == OrganizationType.DISTRIBUTOR).count();
        long retCount = organizationRepository.findAll().stream().filter(o -> o.getType() == OrganizationType.RETAILER).count();

        long totalBatches = batchRepository.count();
        long expiredBatches = batchRepository.findAll().stream().filter(b -> b.getCurrentStatus() == BatchStatus.EXPIRED).count();
        long destroyedBatches = batchRepository.findAll().stream().filter(b -> b.getCurrentStatus() == BatchStatus.DESTROYED).count();
        long returnsInProgress = returnRequestRepository.count();

        long totalAlerts = fraudAlertRepository.count();
        long criticalAlerts = fraudAlertRepository.findAll().stream().filter(a -> a.getSeverity() == AlertSeverity.CRITICAL).count();

        Map<String, Object> resp = new HashMap<>();
        resp.put("totalManufacturers", mfrCount);
        resp.put("totalDistributors", distCount);
        resp.put("totalRetailers", retCount);
        resp.put("totalTrackedBatches", totalBatches);
        resp.put("expiredBatches", expiredBatches);
        resp.put("returnsInProgress", returnsInProgress);
        resp.put("destroyedBatches", destroyedBatches);
        resp.put("fraudAlerts", totalAlerts);
        resp.put("criticalAlerts", criticalAlerts);
        resp.put("openInvestigations", 0);

        return ResponseEntity.ok(resp);
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
                        "blockchainProof", "MOCK_PROOF_TX_" + alertId.toString().substring(0, 8)
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
