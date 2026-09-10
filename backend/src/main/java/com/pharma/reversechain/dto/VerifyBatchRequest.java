package com.pharma.reversechain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class VerifyBatchRequest {
    @NotNull
    private UUID manufacturerId;

    @NotBlank
    private String batchNumber;

    @NotNull
    private LocalDate manufacturingDate;

    @NotNull
    private LocalDate expiryDate;

    private String location;
}
