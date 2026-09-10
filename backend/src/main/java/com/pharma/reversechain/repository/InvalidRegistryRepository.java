package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.InvalidRegistry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface InvalidRegistryRepository extends JpaRepository<InvalidRegistry, UUID> {
    List<InvalidRegistry> findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
            UUID manufacturerId, String batchNumber, LocalDate manufacturingDate, LocalDate expiryDate);
}
