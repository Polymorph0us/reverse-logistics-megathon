package com.pharma.reversechain.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class MedicinePassportResponse {
    private String trackingId;
    private String batchNumber;
    private String productName;
    private String manufacturerName;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String currentHolderName;
    private String currentLocation;
    private Integer currentQuantity;
    private Integer originalQuantity;
    private String status;
    private String displayStatus;
    private String message;
    private String riskLevel;
    private String nextAction;
    private String nextActionCode;
    private LocalDateTime updatedAt;
    
    private List<MovementEventResponse> history;
}
