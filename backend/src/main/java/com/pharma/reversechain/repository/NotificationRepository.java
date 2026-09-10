package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
