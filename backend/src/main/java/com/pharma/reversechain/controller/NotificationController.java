package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.Notification;
import com.pharma.reversechain.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<Notification>> getOrganizationNotifications(@PathVariable UUID orgId) {
        return ResponseEntity.ok(notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable UUID userId) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        return ResponseEntity.ok(notificationRepository.save(notification));
    }
}
