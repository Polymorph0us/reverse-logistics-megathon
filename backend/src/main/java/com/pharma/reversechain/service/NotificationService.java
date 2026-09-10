package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.AlertSeverity;
import com.pharma.reversechain.entity.Notification;
import com.pharma.reversechain.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void createNotification(String type, String title, String message, AlertSeverity severity, UUID organizationId, UUID userId) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setSeverity(severity);
        notification.setOrganizationId(organizationId);
        notification.setUserId(userId);
        notificationRepository.save(notification);
    }
}
