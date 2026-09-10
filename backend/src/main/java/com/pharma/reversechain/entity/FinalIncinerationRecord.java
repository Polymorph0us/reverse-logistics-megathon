package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "final_incineration_records")
@Data
public class FinalIncinerationRecord {

    @Id
    @Column(name = "record_id", length = 100)
    private String recordId;

    @Column(name = "ewtn_id", nullable = false, length = 100)
    private String ewtnId;

    @Column(name = "mcm_id", nullable = false, length = 50)
    private String mcmId;

    @Column(name = "facility_name", nullable = false, length = 255)
    private String facilityName;

    @Column(name = "facility_reg_number", nullable = false, length = 100)
    private String facilityRegNumber;

    @Column(name = "geo_lat", nullable = false)
    private Double geoLat;

    @Column(name = "geo_lng", nullable = false)
    private Double geoLng;

    @Column(name = "geo_address", nullable = false, columnDefinition = "TEXT")
    private String geoAddress;

    @Column(name = "master_crate_qr_scanned_at", nullable = false)
    private LocalDateTime masterCrateQrScannedAt;

    @Column(name = "master_crate_qr_scanned_by", nullable = false, length = 100)
    private String masterCrateQrScannedBy;

    // KilnWeightVerification fields embedded
    @Column(name = "logged_weight_kg", nullable = false)
    private Double loggedWeightKg;

    @Column(name = "hopper_weight_kg", nullable = false)
    private Double hopperWeightKg;

    @Column(name = "weight_delta_kg", nullable = false)
    private Double weightDeltaKg;

    @Column(name = "weight_delta_percent", nullable = false)
    private Double weightDeltaPercent;

    @Column(name = "weight_tolerance_percent", nullable = false)
    private Double weightTolerancePercent;

    @Column(name = "weight_passed", nullable = false)
    private Boolean weightPassed;

    @Column(name = "weight_checked_at", nullable = false)
    private LocalDateTime weightCheckedAt;

    @Column(name = "telemetry_readings", columnDefinition = "TEXT")
    private String telemetryReadings;

    @Column(name = "kiln_start_time", nullable = false)
    private LocalDateTime kilnStartTime;

    @Column(name = "kiln_end_time", nullable = false)
    private LocalDateTime kilnEndTime;

    @Column(name = "peak_primary_chamber_temp_c", nullable = false)
    private Double peakPrimaryChamberTempC;

    @Column(name = "peak_secondary_chamber_temp_c", nullable = false)
    private Double peakSecondaryChamberTempC;

    @Column(name = "total_ash_mass_kg", nullable = false)
    private Double totalAshMassKg;

    @Column(name = "ash_disposal_waybill", nullable = false, length = 100)
    private String ashDisposalWaybill;

    @Column(name = "destroyed_batch_ids", nullable = false, columnDefinition = "TEXT")
    private String destroyedBatchIds;

    @Column(name = "destroyed_batch_numbers", nullable = false, columnDefinition = "TEXT")
    private String destroyedBatchNumbers;

    @Column(name = "source_pharmacy_ids", nullable = false, columnDefinition = "TEXT")
    private String sourcePharmacyIds;

    @Column(name = "total_units_destroyed", nullable = false)
    private Integer totalUnitsDestroyed;

    @Column(name = "plant_manager_id", nullable = false, length = 100)
    private String plantManagerId;

    @Column(name = "plant_manager_name", nullable = false, length = 255)
    private String plantManagerName;

    @Column(name = "plant_manager_signature_hash", nullable = false, length = 64)
    private String plantManagerSignatureHash;

    @Column(name = "certificate_id", nullable = false, length = 100)
    private String certificateId;

    @Column(name = "certificate_hash", nullable = false, length = 64)
    private String certificateHash;

    @Column(name = "blockchain_tx_id", nullable = false, length = 255)
    private String blockchainTxId;

    @Column(name = "completed_at", nullable = false, updatable = false)
    private LocalDateTime completedAt = LocalDateTime.now();

    @Column(name = "status", nullable = false, length = 50)
    private String status;
}
