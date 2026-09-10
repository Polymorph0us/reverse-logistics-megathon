package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {
    Optional<Batch> findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
            UUID manufacturerId, String batchNumber, LocalDate manufacturingDate, LocalDate expiryDate);

    List<Batch> findByBatchNumber(String batchNumber);
}
