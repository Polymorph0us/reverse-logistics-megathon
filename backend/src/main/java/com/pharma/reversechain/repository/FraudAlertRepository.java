package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import com.pharma.reversechain.entity.AlertSeverity;
import com.pharma.reversechain.entity.AlertStatus;
import java.util.List;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, UUID> {
    List<FraudAlert> findByBatchId(UUID batchId);
    List<FraudAlert> findByStatus(AlertStatus status);
    List<FraudAlert> findBySeverity(AlertSeverity severity);
    long countBySeverity(AlertSeverity severity);
}
