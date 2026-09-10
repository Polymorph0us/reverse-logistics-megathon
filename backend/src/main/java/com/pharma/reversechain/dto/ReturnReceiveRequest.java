package com.pharma.reversechain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class ReturnReceiveRequest {
    @NotNull
    @PositiveOrZero
    private Integer receivedQuantity;

    private String condition;
    private String evidence;
}
