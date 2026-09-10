package com.pharma.reversechain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConfirmDestructionRequest {
    @NotNull
    @Positive
    private Integer quantityDestroyed;

    @NotNull
    private LocalDateTime destructionDate;

    private String destructionMethod;
    
    private String facilityLicense;
}
