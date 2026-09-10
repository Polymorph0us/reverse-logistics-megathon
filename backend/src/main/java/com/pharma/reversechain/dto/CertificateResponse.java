package com.pharma.reversechain.dto;

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
public class CertificateResponse {
    private UUID certificateId;
    private String batchNumber;
    private String productName;
    private String manufacturerName;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private Integer quantityDestroyed;
    private LocalDateTime destructionDate;
    private String destructionMethod;
    private String facilityName;
    private String facilityLicense;
    private String certificateHash;
    private String blockchainTxId;
    private String status;
    private LocalDateTime issuedAt;
    private boolean blockchainVerified;
}
