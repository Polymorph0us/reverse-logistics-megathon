package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.Notification;
import com.pharma.reversechain.entity.Organization;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.NotificationRepository;
import com.pharma.reversechain.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GeneralController {

    private final OrganizationRepository organizationRepository;
    private final NotificationRepository notificationRepository;
    private final BatchRepository batchRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        // Mock dashboard stats
        return ResponseEntity.ok(Map.of(
                "activeReturns", 5,
                "pendingDestructions", 2,
                "recentAlerts", 1
        ));
    }

    @GetMapping("/batches/expiring")
    public ResponseEntity<List<Batch>> getExpiringBatches() {
        // Mock logic - in reality query where expiryDate < now + 30 days
        List<Batch> expiring = batchRepository.findAll().stream()
                .filter(b -> b.getExpiryDate().isBefore(LocalDate.now().plusDays(30)) && b.getExpiryDate().isAfter(LocalDate.now()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(expiring);
    }

    @GetMapping("/notifications")
    public Page<Notification> getNotifications(Pageable pageable) {
        return notificationRepository.findAll(pageable);
    }

    @GetMapping("/organizations/{id}")
    public ResponseEntity<Organization> getOrganization(@PathVariable UUID id) {
        return organizationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(String query) {
        // Mock search
        return ResponseEntity.ok(Map.of("results", List.of()));
    }
}
