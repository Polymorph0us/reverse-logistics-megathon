package com.pharma.reversechain.dto;

import com.pharma.reversechain.entity.DestructionStatus;
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
public class DestructionResponse {
    private UUID destructionId;
    private UUID batchId;
    private String batchNumber;
    private String productName;
    private Integer quantity;
    private String wasteFacilityName;
    private UUID wasteFacilityId;
    private LocalDate scheduledDate;
    private DestructionStatus status;
    private LocalDateTime createdAt;
}
