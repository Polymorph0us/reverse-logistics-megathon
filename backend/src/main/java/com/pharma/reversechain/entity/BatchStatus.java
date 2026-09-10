package com.pharma.reversechain.entity;

public enum BatchStatus {
    ACTIVE,
    EXPIRING_SOON,
    EXPIRED,
    RETURN_INITIATED,
    WITH_DISTRIBUTOR,
    WITH_MANUFACTURER,
    SCHEDULED_FOR_DESTRUCTION,
    DESTROYED,
    CLOSED,
    DISPUTED
}
