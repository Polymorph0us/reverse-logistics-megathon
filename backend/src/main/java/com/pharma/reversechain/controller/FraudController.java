package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.FraudAlert;
import com.pharma.reversechain.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FraudController {

    private final FraudAlertRepository fraudAlertRepository;

    @GetMapping({"/alerts", "/fraud/alerts"})
    public Page<com.pharma.reversechain.dto.FraudAlertResponse> getAlerts(Pageable pageable) {
        return fraudAlertRepository.findAll(pageable).map(alert -> {
            com.pharma.reversechain.dto.FraudAlertResponse response = new com.pharma.reversechain.dto.FraudAlertResponse();
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
        });
    }
}
