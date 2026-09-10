package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tracking_records")
@Data
@NoArgsConstructor
public class MedicinePassport {

    @Id
    @Column(name = "tracking_id", length = 50)
    private String trackingId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "batch_number", nullable = false)
    private String batchNumber;

    @Column(name = "manufacturer_id", nullable = false)
    private UUID manufacturerId;

    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "current_holder")
    private UUID currentHolderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_holder", insertable = false, updatable = false)
    private Organization currentHolder;

    @Column(name = "current_location")
    private String currentLocation;

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity;

    @Column(name = "original_quantity", nullable = false)
    private Integer originalQuantity;

    @Column(nullable = false)
    private String status;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "next_action")
    private String nextAction;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
