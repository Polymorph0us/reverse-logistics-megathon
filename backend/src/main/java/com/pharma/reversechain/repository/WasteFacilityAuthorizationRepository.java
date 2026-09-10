package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.WasteFacilityAuthorization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WasteFacilityAuthorizationRepository extends JpaRepository<WasteFacilityAuthorization, UUID> {
    List<WasteFacilityAuthorization> findByFacilityId(UUID facilityId);
}
