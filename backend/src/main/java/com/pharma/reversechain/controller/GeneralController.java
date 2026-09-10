package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
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
    private final ProductRepository productRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final DestructionRecordRepository destructionRecordRepository;
    private final FraudAlertRepository fraudAlertRepository;

    @GetMapping({"/dashboard", "/dashboard/kpis"})
    public ResponseEntity<Map<String, Object>> getDashboard() {
        List<Batch> allBatches = batchRepository.findAll();
        long totalBatches = allBatches.size();
        long activeBatches = allBatches.stream().filter(b -> b.getCurrentStatus() == BatchStatus.ACTIVE).count();
        long expiringSoon = allBatches.stream().filter(b -> b.getCurrentStatus() == BatchStatus.EXPIRING_SOON).count();
        long expired = allBatches.stream().filter(b -> b.getCurrentStatus() == BatchStatus.EXPIRED).count();
        long destroyed = allBatches.stream().filter(b -> b.getCurrentStatus() == BatchStatus.DESTROYED).count();
        long awaitingDestruction = allBatches.stream().filter(b -> b.getCurrentStatus() == BatchStatus.SCHEDULED_FOR_DESTRUCTION).count();
        long returnsPending = returnRequestRepository.count();
        long totalAlerts = fraudAlertRepository.count();

        Map<String, Object> kpis = new HashMap<>();
        kpis.put("totalBatches", totalBatches);
        kpis.put("activeBatches", activeBatches);
        kpis.put("expiringSoon", expiringSoon);
        kpis.put("expired", expired);
        kpis.put("returnsPending", returnsPending);
        kpis.put("inTransit", 0);
        kpis.put("awaitingDestruction", awaitingDestruction);
        kpis.put("destroyed", destroyed);
        kpis.put("fraudAlerts", totalAlerts);
        kpis.put("criticalAlerts", 0);

        // Keep legacy fields for backward compatibility
        kpis.put("activeReturns", returnsPending);
        kpis.put("pendingDestructions", awaitingDestruction);
        kpis.put("recentAlerts", totalAlerts);

        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/batches/expiring")
    public ResponseEntity<List<Batch>> getExpiringBatches() {
        List<Batch> expiring = batchRepository.findAll().stream()
                .filter(b -> b.getCurrentStatus() == BatchStatus.EXPIRING_SOON || 
                        (b.getExpiryDate() != null && b.getExpiryDate().isBefore(LocalDate.now().plusDays(30)) && b.getExpiryDate().isAfter(LocalDate.now())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(expiring);
    }

    @GetMapping("/notifications")
    public Page<Notification> getNotifications(Pageable pageable) {
        return notificationRepository.findAll(pageable);
    }

    @GetMapping("/organizations")
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(organizationRepository.findAll());
    }

    @GetMapping("/organizations/{id}")
    public ResponseEntity<Organization> getOrganization(@PathVariable UUID id) {
        return organizationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam(required = false, defaultValue = "") String query) {
        List<Batch> matches = batchRepository.findByBatchNumber(query);
        return ResponseEntity.ok(Map.of("results", matches));
    }
}
