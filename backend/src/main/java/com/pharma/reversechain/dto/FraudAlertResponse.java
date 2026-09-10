package com.pharma.reversechain.dto;

import com.pharma.reversechain.entity.AlertSeverity;
import com.pharma.reversechain.entity.AlertStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FraudAlertResponse {
    private UUID alertId;
    private String type;
    private AlertSeverity severity;
    private AlertStatus status;
    private UUID batchId;
    private String batchNumber;
    private LocalDateTime detectedAt;
    private String location;
    private UUID organizationId;
    private String message;
}
