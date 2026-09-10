package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "movement_events")
@Data
@NoArgsConstructor
public class MovementEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "movement_id")
    private UUID movementId;

    @Column(name = "tracking_id", nullable = false)
    private String trackingId;

    @Column(name = "from_organization")
    private UUID fromOrganizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_organization", insertable = false, updatable = false)
    private Organization fromOrganization;

    @Column(name = "to_organization")
    private UUID toOrganizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_organization", insertable = false, updatable = false)
    private Organization toOrganization;

    @Column(name = "quantity_sent")
    private Integer quantitySent;

    @Column(name = "quantity_received")
    private Integer quantityReceived;

    private Integer difference;

    private String location;

    private String actor;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
