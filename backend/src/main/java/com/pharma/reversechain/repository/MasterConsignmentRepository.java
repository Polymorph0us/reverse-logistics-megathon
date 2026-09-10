package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.MasterConsignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MasterConsignmentRepository extends JpaRepository<MasterConsignment, UUID> {
    Optional<MasterConsignment> findByMcmId(String mcmId);
    List<MasterConsignment> findByDistributorId(UUID distributorId);
    List<MasterConsignment> findByTargetManufacturerId(UUID targetManufacturerId);
    Optional<MasterConsignment> findBySealId(String sealId);
    org.springframework.data.domain.Page<MasterConsignment> findByDistributorIdOrTargetManufacturerId(UUID distributorId, UUID targetManufacturerId, org.springframework.data.domain.Pageable pageable);
}
