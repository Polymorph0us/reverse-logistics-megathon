package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.MedicinePassport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicinePassportRepository extends JpaRepository<MedicinePassport, String> {
    List<MedicinePassport> findByCurrentHolderId(UUID currentHolderId);
    List<MedicinePassport> findByBatchId(UUID batchId);
}
