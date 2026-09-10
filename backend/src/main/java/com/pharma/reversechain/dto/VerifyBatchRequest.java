package com.pharma.reversechain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class VerifyBatchRequest {
    private UUID manufacturerId;

    @NotBlank
    private String batchNumber;

    private LocalDate manufacturingDate;

    private LocalDate expiryDate;

    private String location;
}
