package com.pharma.reversechain.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ScheduleDestructionRequest {
    @NotNull
    private UUID batchId;

    @NotNull
    @Positive
    private Integer quantity;

    @NotNull
    private UUID wasteFacilityId;

    @NotNull
    @FutureOrPresent
    private LocalDate scheduledDate;
}
