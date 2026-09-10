package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.IncinerationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncinerationLogRepository extends JpaRepository<IncinerationLog, String> {
}
