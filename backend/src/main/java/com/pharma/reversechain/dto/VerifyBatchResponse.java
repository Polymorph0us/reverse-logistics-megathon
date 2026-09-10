package com.pharma.reversechain.dto;

import com.pharma.reversechain.entity.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyBatchResponse {
    private boolean allowSale;
    private String status;
    private RiskLevel riskLevel;
    private String message;
}
