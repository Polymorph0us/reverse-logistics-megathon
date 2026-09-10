package com.pharma.reversechain.dto;

import com.pharma.reversechain.entity.BatchStatus;
import com.pharma.reversechain.entity.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchResponse {
    private UUID batchId;
    private String batchNumber;
    private String productName;
    private UUID productId;
    private String manufacturerName;
    private UUID manufacturerId;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private Integer originalQuantity;
    private Integer currentQuantity;
    private String unit;
    private BatchStatus currentStatus;
    private String currentOwnerName;
    private UUID currentOwnerId;
    private Integer riskScore;
    private RiskLevel riskLevel;
    private LocalDateTime createdAt;
}
