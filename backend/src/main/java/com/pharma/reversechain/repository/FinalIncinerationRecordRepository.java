package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.FinalIncinerationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FinalIncinerationRecordRepository extends JpaRepository<FinalIncinerationRecord, String> {
}
