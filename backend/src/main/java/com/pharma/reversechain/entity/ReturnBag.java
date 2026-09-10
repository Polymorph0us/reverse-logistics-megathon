package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "return_bags")
@Data
public class ReturnBag {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "bag_id", unique = true, nullable = false)
    private String bagId; // e.g., TER-2026-000001

    @Column(name = "tracking_id", nullable = false)
    private String trackingId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "current_organization_id", nullable = false)
    private UUID currentOrganizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnBagStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
