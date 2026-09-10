package com.pharma.reversechain.dto;

import com.pharma.reversechain.entity.AlertSeverity;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class NotificationResponse {
    private UUID id;
    private String type;
    private String title;
    private String message;
    private AlertSeverity severity;
    private boolean read;
    private LocalDateTime createdAt;
}
