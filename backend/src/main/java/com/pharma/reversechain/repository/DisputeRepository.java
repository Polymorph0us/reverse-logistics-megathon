package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
    List<Dispute> findByTrackingId(String trackingId);
    List<Dispute> findByReporterOrganizationId(UUID reporterOrganizationId);
    org.springframework.data.domain.Page<Dispute> findByReporterOrganizationId(UUID reporterOrganizationId, org.springframework.data.domain.Pageable pageable);
}
