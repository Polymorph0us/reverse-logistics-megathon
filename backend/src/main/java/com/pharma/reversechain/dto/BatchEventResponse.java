package com.pharma.reversechain.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BatchEventResponse {
    private UUID eventId;
    private UUID batchId;
    private String eventType;
    private String previousStatus;
    private String newStatus;
    private String actor;
    private UUID organizationId;
    private String role;
    private LocalDateTime timestamp;
    private String location;
    private Integer quantity;
    private String evidenceRefs;
    private String verificationInfo;
    private String hash;
}
