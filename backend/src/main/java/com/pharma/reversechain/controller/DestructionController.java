package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.*;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import com.pharma.reversechain.security.UserDetailsImpl;
import com.pharma.reversechain.service.DestructionService;
import com.pharma.reversechain.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DestructionController {

    private final DestructionService destructionService;
    private final UserRepository userRepository;
    private final DestructionRecordRepository destructionRecordRepository;
    private final CertificateRepository certificateRepository;
    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final OrganizationRepository organizationRepository;
    private final FileStorageService fileStorageService;

    @GetMapping({"/destruction/pending", "/destructions/pending"})
    public ResponseEntity<List<DestructionResponse>> getPendingDestructions() {
        List<DestructionRecord> pending = destructionRecordRepository.findByStatus(DestructionStatus.SCHEDULED);
        List<DestructionResponse> responses = pending.stream().map(this::toDestructionResponse).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PostMapping({"/destruction/schedule", "/destructions/schedule"})
    @PreAuthorize("hasRole('MANUFACTURER')")
    public ResponseEntity<DestructionResponse> scheduleDestruction(
            @Valid @RequestBody ScheduleDestructionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        DestructionRecord record = destructionService.scheduleDestruction(request, actor);
        DestructionResponse response = toDestructionResponse(record);

        return ResponseEntity.ok(response);
    }

    @PostMapping({"/destruction/{id}/certificate", "/destructions/{id}/certificate", "/destruction/{id}/confirm", "/destructions/{id}/confirm"})
    @PreAuthorize("hasRole('MANUFACTURER') or hasRole('WASTE_FACILITY')")
    public ResponseEntity<CertificateResponse> confirmDestruction(
            @PathVariable UUID id,
            @Valid @RequestBody ConfirmDestructionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        Certificate certificate = destructionService.confirmDestruction(id, request, actor);
        CertificateResponse response = toCertificateResponse(certificate);

        return ResponseEntity.ok(response);
    }

    @GetMapping({"/certificates/{id}", "/destruction/certificates/{id}", "/destructions/certificates/{id}"})
    public ResponseEntity<CertificateResponse> getCertificate(@PathVariable UUID id) {
        return certificateRepository.findById(id)
                .map(this::toCertificateResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping({"/certificates/verify/{id}", "/certificates/{id}/verify"})
    public ResponseEntity<CertificateResponse> verifyCertificate(@PathVariable UUID id) {
        return certificateRepository.findById(id)
                .map(cert -> {
                    CertificateResponse response = toCertificateResponse(cert);
                    response.setBlockchainVerified("VERIFIED".equals(cert.getStatus()) && cert.getBlockchainTxId() != null);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping({"/certificates/{id}/download"})
    public ResponseEntity<InputStreamResource> downloadCertificate(@PathVariable UUID id) {
        try {
            Certificate cert = certificateRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Certificate not found"));
            
            if (cert.getFileStorageReference() == null) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = fileStorageService.load(cert.getFileStorageReference());
            InputStream inputStream = Files.newInputStream(filePath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=certificate_" + id + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(new InputStreamResource(inputStream));
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private DestructionResponse toDestructionResponse(DestructionRecord record) {
        Batch batch = batchRepository.findById(record.getBatchId()).orElse(null);
        Product product = batch != null ? productRepository.findById(batch.getProductId()).orElse(null) : null;
        Organization facility = organizationRepository.findById(record.getWasteFacilityId()).orElse(null);
        
        return DestructionResponse.builder()
                .destructionId(record.getDestructionId())
                .batchId(record.getBatchId())
                .batchNumber(batch != null ? batch.getBatchNumber() : null)
                .productName(product != null ? product.getProductName() : null)
                .quantity(record.getQuantity())
                .wasteFacilityName(facility != null ? facility.getName() : null)
                .wasteFacilityId(record.getWasteFacilityId())
                .scheduledDate(record.getScheduledDate())
                .status(record.getStatus())
                .createdAt(record.getCreatedAt())
                .build();
    }

    private CertificateResponse toCertificateResponse(Certificate cert) {
        Product product = productRepository.findById(cert.getProductId()).orElse(null);
        Organization manufacturer = organizationRepository.findById(cert.getManufacturerId()).orElse(null);
        Organization facility = organizationRepository.findById(cert.getFacilityId()).orElse(null);
        
        return CertificateResponse.builder()
                .certificateId(cert.getCertificateId())
                .batchNumber(cert.getBatchNumber())
                .productName(product != null ? product.getProductName() : null)
                .manufacturerName(manufacturer != null ? manufacturer.getName() : null)
                .manufacturingDate(cert.getManufacturingDate())
                .expiryDate(cert.getExpiryDate())
                .quantityDestroyed(cert.getQuantityDestroyed())
                .destructionDate(cert.getDestructionDate())
                .destructionMethod(cert.getDestructionMethod())
                .facilityName(facility != null ? facility.getName() : null)
                .facilityLicense(cert.getFacilityLicense())
                .certificateHash(cert.getCertificateHash())
                .blockchainTxId(cert.getBlockchainTxId())
                .status(cert.getStatus())
                .issuedAt(cert.getIssuedAt())
                .blockchainVerified(cert.getBlockchainTxId() != null && !"PENDING".equals(cert.getStatus()))
                .build();
    }
}

