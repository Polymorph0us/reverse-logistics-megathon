package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "incineration_logs")
@Data
public class IncinerationLog {

    @Id
    @Column(name = "log_id", length = 100)
    private String logId;

    @Column(name = "ewtn_id", nullable = false, length = 100)
    private String ewtnId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @Column(name = "primary_chamber_temp_c", nullable = false)
    private Double primaryChamberTempC;

    @Column(name = "secondary_chamber_temp_c", nullable = false)
    private Double secondaryChamberTempC;

    @Column(name = "incineration_start_time", nullable = false)
    private LocalDateTime incinerationStartTime;

    @Column(name = "incineration_end_time", nullable = false)
    private LocalDateTime incinerationEndTime;

    @Column(name = "ash_disposal_waybill", nullable = false, length = 100)
    private String ashDisposalWaybill;

    @Column(name = "operator_id", nullable = false, length = 100)
    private String operatorId;

    @Column(name = "passed", nullable = false)
    private Boolean passed;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();
}
