package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.ReturnBag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReturnBagRepository extends JpaRepository<ReturnBag, UUID> {
    Optional<ReturnBag> findByBagId(String bagId);
    List<ReturnBag> findByCurrentOrganizationId(UUID currentOrganizationId);
    List<ReturnBag> findByTrackingId(String trackingId);
}
