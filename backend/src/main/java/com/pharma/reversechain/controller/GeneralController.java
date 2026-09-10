package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.BatchResponse;
import com.pharma.reversechain.dto.NotificationResponse;
import com.pharma.reversechain.dto.OrganizationResponse;
import com.pharma.reversechain.dto.ProductResponse;
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
        long totalBatches = batchRepository.count();
        long activeBatches = batchRepository.countByCurrentStatus(BatchStatus.ACTIVE);
        long expiringSoon = batchRepository.countByCurrentStatus(BatchStatus.EXPIRING_SOON);
        long expired = batchRepository.countByCurrentStatus(BatchStatus.EXPIRED);
        long destroyed = batchRepository.countByCurrentStatus(BatchStatus.DESTROYED);
        long awaitingDestruction = batchRepository.countByCurrentStatus(BatchStatus.SCHEDULED_FOR_DESTRUCTION);
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
    public ResponseEntity<List<BatchResponse>> getExpiringBatches() {
        List<BatchResponse> expiring = batchRepository.findAll().stream()
                .filter(b -> b.getCurrentStatus() == BatchStatus.EXPIRING_SOON || 
                        (b.getExpiryDate() != null && b.getExpiryDate().isBefore(LocalDate.now().plusDays(30)) && b.getExpiryDate().isAfter(LocalDate.now())))
                .map(this::toBatchResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(expiring);
    }

    @GetMapping("/notifications")
    public Page<NotificationResponse> getNotifications(Pageable pageable) {
        return notificationRepository.findAll(pageable).map(this::toNotificationResponse);
    }

    @GetMapping("/organizations")
    public ResponseEntity<List<OrganizationResponse>> getAllOrganizations() {
        List<OrganizationResponse> orgs = organizationRepository.findAll().stream()
                .map(this::toOrganizationResponse)
                .toList();
        return ResponseEntity.ok(orgs);
    }

    @GetMapping("/organizations/{id}")
    public ResponseEntity<OrganizationResponse> getOrganization(@PathVariable UUID id) {
        return organizationRepository.findById(id)
                .map(this::toOrganizationResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        List<ProductResponse> products = productRepository.findAll().stream()
                .map(this::toProductResponse)
                .toList();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam(required = false, defaultValue = "") String query) {
        List<BatchResponse> matches = batchRepository.findByBatchNumber(query).stream()
                .map(this::toBatchResponse)
                .toList();
        return ResponseEntity.ok(Map.of("results", matches));
    }

    private BatchResponse toBatchResponse(Batch batch) {
        Product product = productRepository.findById(batch.getProductId()).orElse(null);
        Organization manufacturer = organizationRepository.findById(batch.getManufacturerId()).orElse(null);
        Organization currentOwner = batch.getCurrentOwnerId() != null 
                ? organizationRepository.findById(batch.getCurrentOwnerId()).orElse(null) 
                : null;
        
        return BatchResponse.builder()
                .batchId(batch.getBatchId())
                .batchNumber(batch.getBatchNumber())
                .productName(product != null ? product.getProductName() : null)
                .productId(batch.getProductId())
                .manufacturerName(manufacturer != null ? manufacturer.getName() : null)
                .manufacturerId(batch.getManufacturerId())
                .manufacturingDate(batch.getManufacturingDate())
                .expiryDate(batch.getExpiryDate())
                .originalQuantity(batch.getOriginalQuantity())
                .currentQuantity(batch.getCurrentQuantity())
                .unit(batch.getUnit())
                .currentStatus(batch.getCurrentStatus())
                .currentOwnerName(currentOwner != null ? currentOwner.getName() : null)
                .currentOwnerId(batch.getCurrentOwnerId())
                .riskScore(batch.getRiskScore())
                .riskLevel(batch.getRiskLevel())
                .createdAt(batch.getCreatedAt())
                .build();
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

    private OrganizationResponse toOrganizationResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .type(org.getType())
                .licenseNumber(org.getLicenseNumber())
                .city(org.getCity())
                .state(org.getState())
                .complianceScore(org.getComplianceScore())
                .active(org.getActive())
                .build();
    }

    private ProductResponse toProductResponse(Product product) {
        return ProductResponse.builder()
                .productId(product.getProductId())
                .productName(product.getProductName())
                .genericName(product.getGenericName())
                .brandName(product.getBrandName())
                .manufacturerId(product.getManufacturerId())
                .dosageForm(product.getDosageForm())
                .strength(product.getStrength())
                .unitType(product.getUnitType())
                .build();
    }
}
