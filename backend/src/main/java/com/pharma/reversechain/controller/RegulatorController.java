package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.AlertSeverity;
import com.pharma.reversechain.entity.BatchStatus;
import com.pharma.reversechain.entity.FraudAlert;
import com.pharma.reversechain.entity.OrganizationType;
import com.pharma.reversechain.dto.FraudAlertResponse;
import com.pharma.reversechain.dto.InvestigationResponse;
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
        long mfrCount = organizationRepository.countByType(OrganizationType.MANUFACTURER);
        long distCount = organizationRepository.countByType(OrganizationType.DISTRIBUTOR);
        long retCount = organizationRepository.countByType(OrganizationType.RETAILER);

        long totalBatches = batchRepository.count();
        long expiredBatches = batchRepository.countByCurrentStatus(BatchStatus.EXPIRED);
        long destroyedBatches = batchRepository.countByCurrentStatus(BatchStatus.DESTROYED);
        long returnsInProgress = returnRequestRepository.count();

        long totalAlerts = fraudAlertRepository.count();
        long criticalAlerts = fraudAlertRepository.countBySeverity(AlertSeverity.CRITICAL);

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
    public Page<FraudAlertResponse> getAlerts(Pageable pageable) {
        return fraudAlertRepository.findAll(pageable).map(this::mapToFraudAlertResponse);
    }

    @GetMapping("/investigations/{alertId}")
    public ResponseEntity<InvestigationResponse> getInvestigationDetails(@PathVariable UUID alertId) {
        return fraudAlertRepository.findById(alertId)
                .map(alert -> {
                    InvestigationResponse response = new InvestigationResponse();
                    response.setAlert(mapToFraudAlertResponse(alert));
                    if (alert.getBatchId() != null) {
                        response.setBlockchainProof("Not applicable (Blockchain Deprecated)");
                    } else {
                        response.setBlockchainProof("No associated batch");
                    }
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    private FraudAlertResponse mapToFraudAlertResponse(FraudAlert alert) {
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
