package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.ConsignmentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConsignmentItemRepository extends JpaRepository<ConsignmentItem, UUID> {
    List<ConsignmentItem> findByMcmId(UUID mcmId);
    List<ConsignmentItem> findByReturnBagId(UUID returnBagId);
}
