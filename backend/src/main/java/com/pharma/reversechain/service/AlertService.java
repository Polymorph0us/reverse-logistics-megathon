package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.AlertSeverity;
import com.pharma.reversechain.entity.AlertStatus;
import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.FraudAlert;
import com.pharma.reversechain.entity.Organization;
import com.pharma.reversechain.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final FraudAlertRepository fraudAlertRepository;
    private final NotificationService notificationService;

    @Transactional
    public FraudAlert generateAlert(String type, AlertSeverity severity, Batch batch, String batchNumber, String location, Organization org, String message) {
        FraudAlert alert = new FraudAlert();
        alert.setType(type);
        alert.setSeverity(severity);
        alert.setStatus(AlertStatus.NEW);
        
        if (batch != null) {
            alert.setBatchId(batch.getBatchId());
        }
        alert.setBatchNumber(batchNumber);
        alert.setLocation(location);
        
        if (org != null) {
            alert.setOrganizationId(org.getId());
        }
        alert.setMessage(message);
        
        FraudAlert savedAlert = fraudAlertRepository.save(alert);
        
        // Trigger notification
        notificationService.createNotification(
                "FRAUD_ALERT",
                "Fraud Alert: " + type,
                message,
                severity,
                org != null ? org.getId() : null,
                null // Could optionally send to specific users
        );
        
        return savedAlert;
    }
}
