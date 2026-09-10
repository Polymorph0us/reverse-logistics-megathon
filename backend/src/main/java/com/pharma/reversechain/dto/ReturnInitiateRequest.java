package com.pharma.reversechain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class ReturnInitiateRequest {
    @NotNull
    private UUID batchId;

    @NotNull
    @Positive
    private Integer requestedQuantity;

    private String reason;
    private String condition;
    private String evidence;
}
