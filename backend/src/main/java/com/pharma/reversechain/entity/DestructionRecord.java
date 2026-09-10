package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "destruction_records")
@Data
@NoArgsConstructor
public class DestructionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID destructionId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", insertable = false, updatable = false)
    private Batch batch;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "waste_facility_id", nullable = false)
    private UUID wasteFacilityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waste_facility_id", insertable = false, updatable = false)
    private Organization wasteFacility;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DestructionStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = DestructionStatus.SCHEDULED;
    }
}
