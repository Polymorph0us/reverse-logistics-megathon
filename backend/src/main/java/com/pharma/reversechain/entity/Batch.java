package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "batches")
@Data
@NoArgsConstructor
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID batchId;

    @Column(name = "batch_number", nullable = false)
    private String batchNumber;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @Column(name = "manufacturer_id", nullable = false)
    private UUID manufacturerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_id", insertable = false, updatable = false)
    private Organization manufacturer;

    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "original_quantity", nullable = false)
    private Integer originalQuantity;

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity;

    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", nullable = false)
    private BatchStatus currentStatus;

    @Column(name = "current_owner_id")
    private UUID currentOwnerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_owner_id", insertable = false, updatable = false)
    private Organization currentOwner;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level")
    private RiskLevel riskLevel;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (riskScore == null) riskScore = 0;
        if (riskLevel == null) riskLevel = RiskLevel.LOW;
        if (currentStatus == null) currentStatus = BatchStatus.ACTIVE;
    }
}
