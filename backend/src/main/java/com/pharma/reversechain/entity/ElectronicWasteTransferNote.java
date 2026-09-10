package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "electronic_waste_transfer_notes")
@Data
public class ElectronicWasteTransferNote {

    @Id
    @Column(name = "ewtn_id", length = 100)
    private String ewtnId;

    @Column(name = "denatured_tag_id", nullable = false, length = 100)
    private String denaturedTagId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @Column(name = "cbwtf_name", nullable = false, length = 255)
    private String cbwtfName;

    @Column(name = "cbwtf_reg_number", nullable = false, length = 100)
    private String cbwtfRegNumber;

    @Column(name = "cbwtf_address", nullable = false, columnDefinition = "TEXT")
    private String cbwtfAddress;

    @Column(name = "vehicle_number", nullable = false, length = 50)
    private String vehicleNumber;

    @Column(name = "driver_name", nullable = false, length = 255)
    private String driverName;

    @Column(name = "hazmat_license_number", nullable = false, length = 100)
    private String hazmatLicenseNumber;

    @Column(name = "scheduled_pickup_start", nullable = false)
    private LocalDateTime scheduledPickupStart;

    @Column(name = "scheduled_pickup_end", nullable = false)
    private LocalDateTime scheduledPickupEnd;

    @Column(name = "total_net_mass_kg", nullable = false)
    private Double totalNetMassKg;

    @Column(name = "waste_category", nullable = false, length = 100)
    private String wasteCategory;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "status", nullable = false, length = 50)
    private String status = "SCHEDULED";

    @Column(name = "pickup_confirmed_at")
    private LocalDateTime pickupConfirmedAt;
}
