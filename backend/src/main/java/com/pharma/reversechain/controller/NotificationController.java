package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.NotificationResponse;
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
    public ResponseEntity<List<NotificationResponse>> getOrganizationNotifications(@PathVariable UUID orgId) {
        return ResponseEntity.ok(notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream().map(this::toNotificationResponse).toList());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@PathVariable UUID userId) {
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toNotificationResponse).toList());
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        return ResponseEntity.ok(toNotificationResponse(notificationRepository.save(notification)));
    }

    private NotificationResponse toNotificationResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setType(notification.getType());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setSeverity(notification.getSeverity());
        response.setRead(notification.getRead());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}
