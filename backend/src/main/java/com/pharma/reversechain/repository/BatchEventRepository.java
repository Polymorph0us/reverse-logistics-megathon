package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.BatchEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BatchEventRepository extends JpaRepository<BatchEvent, UUID> {
    List<BatchEvent> findByBatchIdOrderByTimestampDesc(UUID batchId);
}
