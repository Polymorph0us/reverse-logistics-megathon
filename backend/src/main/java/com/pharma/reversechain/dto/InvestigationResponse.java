package com.pharma.reversechain.dto;

import lombok.Data;

@Data
public class InvestigationResponse {
    private FraudAlertResponse alert;
    private String blockchainProof;
}
