package com.pharma.reversechain.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MovementEventResponse {
    private UUID movementId;
    private String trackingId;
    private String fromOrganizationName;
    private String toOrganizationName;
    private Integer quantitySent;
    private Integer quantityReceived;
    private Integer difference;
    private String location;
    private String actor;
    private String eventType;
    private String notes;
    private LocalDateTime timestamp;
}
