package com.pharma.reversechain.service;

import com.pharma.reversechain.dto.MedicinePassportResponse;
import com.pharma.reversechain.dto.MovementEventResponse;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PassportService {

    private final MedicinePassportRepository passportRepository;
    private final MovementEventRepository movementRepository;
    private final ProductRepository productRepository;
    private final OrganizationRepository organizationRepository;
    private final InvalidRegistryRepository invalidRegistryRepository;
    private final FraudDetectionService fraudDetectionService;
    private final ExpiryEngine expiryEngine;

    public MedicinePassportResponse getPassport(String trackingId, User actor) {
        MedicinePassport passport = passportRepository.findById(trackingId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or unknown tracking ID"));

        // Check Invalid Registry
        List<InvalidRegistry> invalids = invalidRegistryRepository.findByBatchNumber(passport.getBatchNumber());
        if (!invalids.isEmpty()) {
            passport.setStatus("PERMANENTLY_INVALID");
            passport.setRiskLevel("CRITICAL");
            passport.setNextAction("CONFISCATE_IMMEDIATELY");
            
            fraudDetectionService.generateAlert(
                "INVALID_BATCH_SCANNED",
                AlertSeverity.CRITICAL,
                null,
                passport.getBatchNumber(),
                actor.getOrganization() != null ? actor.getOrganization().getCity() : "Unknown",
                actor.getOrganization(),
                "A permanently invalid batch was scanned by " + actor.getName()
            );
        }

        List<MovementEvent> history = movementRepository.findByTrackingIdOrderByTimestampDesc(trackingId);

        return mapToResponse(passport, history);
    }

    private MedicinePassportResponse mapToResponse(MedicinePassport passport, List<MovementEvent> history) {
        MedicinePassportResponse response = new MedicinePassportResponse();
        response.setTrackingId(passport.getTrackingId());
        response.setBatchNumber(passport.getBatchNumber());
        
        productRepository.findById(passport.getProductId())
                .ifPresent(p -> response.setProductName(p.getProductName()));
                
        organizationRepository.findById(passport.getManufacturerId())
                .ifPresent(o -> response.setManufacturerName(o.getName()));
                
        response.setManufacturingDate(passport.getManufacturingDate());
        response.setExpiryDate(passport.getExpiryDate());
        
        if (passport.getCurrentHolderId() != null) {
            organizationRepository.findById(passport.getCurrentHolderId())
                    .ifPresent(o -> response.setCurrentHolderName(o.getName()));
        }
        
        response.setCurrentLocation(passport.getCurrentLocation());
        response.setCurrentQuantity(passport.getCurrentQuantity());
        response.setOriginalQuantity(passport.getOriginalQuantity());
        response.setStatus(passport.getStatus());
        response.setDisplayStatus(expiryEngine.calculateDisplayStatus(passport));
        response.setMessage(expiryEngine.calculateExpiryMessage(passport));
        response.setRiskLevel(passport.getRiskLevel());
        response.setNextAction(passport.getNextAction());
        response.setNextActionCode(passport.getNextAction() != null ? passport.getNextAction().toUpperCase().replace(" ", "_") : "NONE");
        response.setUpdatedAt(passport.getUpdatedAt());

        response.setHistory(history.stream().map(this::mapToEventResponse).collect(Collectors.toList()));
        
        return response;
    }

    private MovementEventResponse mapToEventResponse(MovementEvent event) {
        MovementEventResponse resp = new MovementEventResponse();
        resp.setMovementId(event.getMovementId());
        resp.setTrackingId(event.getTrackingId());
        
        if (event.getFromOrganizationId() != null) {
            organizationRepository.findById(event.getFromOrganizationId())
                    .ifPresent(o -> resp.setFromOrganizationName(o.getName()));
        }
        
        if (event.getToOrganizationId() != null) {
            organizationRepository.findById(event.getToOrganizationId())
                    .ifPresent(o -> resp.setToOrganizationName(o.getName()));
        }
        
        resp.setQuantitySent(event.getQuantitySent());
        resp.setQuantityReceived(event.getQuantityReceived());
        resp.setDifference(event.getDifference());
        resp.setLocation(event.getLocation());
        resp.setActor(event.getActor());
        resp.setEventType(event.getEventType());
        resp.setNotes(event.getNotes());
        resp.setTimestamp(event.getTimestamp());
        return resp;
    }
}
