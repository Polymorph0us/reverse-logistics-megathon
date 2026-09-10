package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.FraudAlertRepository;
import com.pharma.reversechain.repository.InvalidRegistryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FraudDetectionService {

    private final FraudAlertRepository fraudAlertRepository;
    private final InvalidRegistryRepository invalidRegistryRepository;
    private final RiskScoringService riskScoringService;

    @Transactional
    public RiskScoringService.RiskScoreResult detectFraudForVerification(Batch batch, String location, Organization organization) {
        List<String> riskFactors = new ArrayList<>();

        if (batch == null) {
            riskFactors.add("UNKNOWN_BATCH");
            return raiseAlertAndScore("UNKNOWN_BATCH", null, "Unknown", location, organization, "Batch not found in system", riskFactors);
        }

        // Check if expired
        if (batch.getExpiryDate().isBefore(LocalDate.now())) {
            riskFactors.add("EXPIRED_BATCH");
            raiseAlert("EXPIRED_BATCH_SALE", batch, location, organization, "Attempt to verify/sell an expired batch");
        }

        // Check invalid registry (Destroyed or invalidated)
        List<InvalidRegistry> invalids = invalidRegistryRepository.findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
                batch.getManufacturerId(), batch.getBatchNumber(), batch.getManufacturingDate(), batch.getExpiryDate());
        
        if (!invalids.isEmpty()) {
            riskFactors.add("DESTROYED_BATCH_REENTRY");
            raiseAlert("DESTROYED_BATCH_REENTRY", batch, location, organization, "Attempt to verify/sell a batch that has been marked as destroyed");
        }

        // State Machine anomaly
        if (batch.getCurrentStatus() == BatchStatus.DESTROYED || batch.getCurrentStatus() == BatchStatus.CLOSED) {
            if (!riskFactors.contains("DESTROYED_BATCH_REENTRY")) {
                riskFactors.add("SUSPICIOUS_REENTRY");
                raiseAlert("SUSPICIOUS_REENTRY", batch, location, organization, "Batch scanned but status is " + batch.getCurrentStatus());
            }
        }

        if (batch.getCurrentStatus() == BatchStatus.DISPUTED) {
             riskFactors.add("QUANTITY_MISMATCH");
             raiseAlert("DISPUTED_BATCH_SCAN", batch, location, organization, "Batch scanned but currently under dispute");
        }

        return riskScoringService.computeRiskScore(riskFactors);
    }

    private void raiseAlert(String type, Batch batch, String location, Organization org, String message) {
        FraudAlert alert = new FraudAlert();
        alert.setType(type);
        alert.setSeverity(AlertSeverity.CRITICAL);
        alert.setBatchId(batch.getBatchId());
        alert.setBatchNumber(batch.getBatchNumber());
        alert.setLocation(location);
        if (org != null) {
            alert.setOrganizationId(org.getId());
        }
        alert.setMessage(message);
        fraudAlertRepository.save(alert);
    }

    private RiskScoringService.RiskScoreResult raiseAlertAndScore(String type, Batch batch, String batchNumber, String location, Organization org, String message, List<String> riskFactors) {
        FraudAlert alert = new FraudAlert();
        alert.setType(type);
        alert.setSeverity(AlertSeverity.CRITICAL);
        if (batch != null) {
            alert.setBatchId(batch.getBatchId());
        }
        alert.setBatchNumber(batchNumber);
        alert.setLocation(location);
        if (org != null) {
            alert.setOrganizationId(org.getId());
        }
        alert.setMessage(message);
        fraudAlertRepository.save(alert);
        return riskScoringService.computeRiskScore(riskFactors);
    }
}
