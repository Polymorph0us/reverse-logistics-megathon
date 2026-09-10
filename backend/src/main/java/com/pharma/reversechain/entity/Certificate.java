package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID certificateId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @Column(name = "destruction_id", nullable = false)
    private UUID destructionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destruction_id", insertable = false, updatable = false)
    private DestructionRecord destructionRecord;

    @Column(name = "quantity_destroyed", nullable = false)
    private Integer quantityDestroyed;

    @Column(name = "destruction_date", nullable = false)
    private LocalDateTime destructionDate;

    @Column(name = "facility_id", nullable = false)
    private UUID facilityId;

    @Column(name = "certificate_hash", nullable = false)
    private String certificateHash;

    @Column(name = "blockchain_tx_id", nullable = false)
    private String blockchainTxId;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
