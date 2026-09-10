package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.KeyValueHashEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KeyValueHashRepository extends JpaRepository<KeyValueHashEntry, UUID> {

    List<KeyValueHashEntry> findByRecordKeyOrderBySequenceNumberAsc(String recordKey);

    Optional<KeyValueHashEntry> findTopByRecordKeyOrderBySequenceNumberDesc(String recordKey);

    @Query("SELECT COUNT(e) FROM KeyValueHashEntry e WHERE e.recordKey = :key")
    long countByRecordKey(@Param("key") String recordKey);

    Optional<KeyValueHashEntry> findByTransactionId(String transactionId);
}
