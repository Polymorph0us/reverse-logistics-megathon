package com.pharma.reversechain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockchainProofResponse {
    private String transactionId;
    private String certificateHash;
    private String batchId;
    private Integer quantityDestroyed;
    private String destructionDate;
    private String status;
    private String verificationResult; // "MATCH", "MISMATCH", "NOT_FOUND"
    private Map<String, Object> blockchainData;
    private String timestamp;
}
