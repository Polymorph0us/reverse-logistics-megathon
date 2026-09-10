package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fraud_alerts")
@Data
@NoArgsConstructor
public class FraudAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID alertId;

    @Column(nullable = false)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertSeverity severity;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "batch_number", nullable = false)
    private String batchNumber;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    private String location;

    @Column(name = "organization_id")
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", insertable = false, updatable = false)
    private Organization organization;

    @Column(nullable = false, length = 1000)
    private String message;

    private Boolean resolved = false;

    @PrePersist
    protected void onCreate() {
        if (detectedAt == null) detectedAt = LocalDateTime.now();
    }
}
