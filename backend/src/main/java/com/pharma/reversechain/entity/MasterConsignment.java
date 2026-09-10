package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "master_consignments")
@Data
public class MasterConsignment {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "mcm_id", unique = true, nullable = false)
    private String mcmId;

    @Column(name = "distributor_id", nullable = false)
    private UUID distributorId;

    @Column(name = "target_manufacturer_id", nullable = false)
    private UUID targetManufacturerId;

    @Column(name = "total_bags", nullable = false)
    private Integer totalBags = 0;

    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity = 0;

    @Column(name = "mcm_hash", length = 255)
    private String mcmHash;

    @Column(name = "seal_id", unique = true)
    private String sealId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsignmentStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Version
    private Long version;
}
