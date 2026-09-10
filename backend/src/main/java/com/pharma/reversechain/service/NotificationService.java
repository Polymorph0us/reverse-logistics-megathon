package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
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
        log.info("Created notification for organization {}: {}", organizationId, title);
    }

    public void notifyDestruction(Batch batch, Certificate certificate, Organization manufacturer, Organization wasteFacility) {
        String message = String.format("Batch %s has been destroyed. Certificate ID: %s, Quantity: %d units",
                batch.getBatchNumber(), certificate.getCertificateId(), certificate.getQuantityDestroyed());
        
        // Notify manufacturer
        createNotification(
                "DESTRUCTION_CONFIRMED",
                "Batch Destruction Confirmed",
                message,
                AlertSeverity.INFO,
                manufacturer.getId(),
                null
        );
        
        // Notify waste facility
        createNotification(
                "DESTRUCTION_CONFIRMED",
                "Destruction Certificate Issued",
                message + ". Certificate available for download.",
                AlertSeverity.INFO,
                wasteFacility.getId(),
                null
        );
        
        log.info("Sent destruction notifications for batch {} and certificate {}", batch.getBatchNumber(), certificate.getCertificateId());
    }
}
