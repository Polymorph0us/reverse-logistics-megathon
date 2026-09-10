package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.DenaturedBatchTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DenaturedBatchTagRepository extends JpaRepository<DenaturedBatchTag, String> {
}
