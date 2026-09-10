package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "denatured_batch_tags")
@Data
public class DenaturedBatchTag {

    @Id
    @Column(name = "tag_id", length = 100)
    private String tagId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @Column(name = "denatured_at", nullable = false)
    private LocalDateTime denaturedAt;

    @Column(name = "agent", nullable = false, length = 50)
    private String agent;

    @Column(name = "agent_lot_number", length = 100)
    private String agentLotNumber;

    @Column(name = "witness_officer_id", nullable = false, length = 100)
    private String witnessOfficerId;

    @Column(name = "witness_officer_name", nullable = false, length = 255)
    private String witnessOfficerName;

    @Column(name = "photo_evidence_hash", nullable = false, length = 64)
    private String photoEvidenceHash;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "quantity_denatured", nullable = false)
    private Integer quantityDenatured;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "PENDING";
}
