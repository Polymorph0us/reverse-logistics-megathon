package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.DestructionRecord;
import com.pharma.reversechain.entity.DestructionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DestructionRecordRepository extends JpaRepository<DestructionRecord, UUID> {
    List<DestructionRecord> findByStatus(DestructionStatus status);
}
