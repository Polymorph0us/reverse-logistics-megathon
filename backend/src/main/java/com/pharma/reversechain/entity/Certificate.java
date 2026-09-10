package com.pharma.reversechain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID certificateId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", insertable = false, updatable = false)
    @JsonIgnore
    private Batch batch;

    @Column(name = "destruction_id", nullable = false)
    private UUID destructionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destruction_id", insertable = false, updatable = false)
    @JsonIgnore
    private DestructionRecord destructionRecord;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    @JsonIgnore
    private Product product;

    @Column(name = "batch_number", nullable = false)
    private String batchNumber;

    @Column(name = "manufacturer_id", nullable = false)
    private UUID manufacturerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_id", insertable = false, updatable = false)
    @JsonIgnore
    private Organization manufacturer;

    @Column(name = "manufacturing_date", nullable = false)
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "quantity_destroyed", nullable = false)
    private Integer quantityDestroyed;

    @Column(name = "destruction_date", nullable = false)
    private LocalDateTime destructionDate;

    @Column(name = "destruction_method")
    private String destructionMethod;

    @Column(name = "facility_id", nullable = false)
    private UUID facilityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", insertable = false, updatable = false)
    @JsonIgnore
    private Organization wasteFacility;

    @Column(name = "facility_license")
    private String facilityLicense;

    @Column(name = "certificate_hash", nullable = false, unique = true)
    private String certificateHash;

    @Column(name = "blockchain_tx_id", nullable = false)
    private String blockchainTxId;

    @Column(name = "file_storage_reference")
    private String fileStorageReference;

    @Column(nullable = false)
    private String status;

    @Column(name = "issuer_id", nullable = false)
    private UUID issuerId;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (issuedAt == null) issuedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}

