package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.MovementEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MovementEventRepository extends JpaRepository<MovementEvent, UUID> {
    List<MovementEvent> findByTrackingIdOrderByTimestampDesc(String trackingId);
}
