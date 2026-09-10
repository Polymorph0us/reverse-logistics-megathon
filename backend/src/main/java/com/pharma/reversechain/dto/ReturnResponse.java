package com.pharma.reversechain.dto;

import com.pharma.reversechain.entity.ReturnStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnResponse {
    private UUID returnId;
    private UUID batchId;
    private String batchNumber;
    private String productName;
    private String initiatorName;
    private String reason;
    private Integer requestedQuantity;
    private Integer receivedQuantity;
    private Integer difference;  // Changed from quantityDifference to match test and entity field name
    private ReturnStatus status;
    private LocalDateTime initiatedAt;
    private LocalDateTime receivedAt;
}
