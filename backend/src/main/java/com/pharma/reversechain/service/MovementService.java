package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovementService {

    private final MedicinePassportRepository passportRepository;
    private final MovementEventRepository movementRepository;
    private final FraudDetectionService fraudDetectionService;
    private final InvalidRegistryRepository invalidRegistryRepository;

    @Transactional
    public MovementEvent recordMovement(String trackingId, Integer quantityReceived, String location, String notes, User actor) {
        MedicinePassport passport = passportRepository.findById(trackingId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid tracking ID"));

        // Check if invalid
        if (!invalidRegistryRepository.findByBatchNumber(passport.getBatchNumber()).isEmpty()) {
            throw new IllegalStateException("Cannot move a permanently invalid batch.");
        }

        Organization fromOrg = passport.getCurrentHolder();
        Organization toOrg = actor.getOrganization();

        int diff = quantityReceived - passport.getCurrentQuantity();

        MovementEvent event = new MovementEvent();
        event.setTrackingId(trackingId);
        event.setFromOrganizationId(fromOrg != null ? fromOrg.getId() : null);
        event.setToOrganizationId(toOrg.getId());
        event.setQuantitySent(passport.getCurrentQuantity());
        event.setQuantityReceived(quantityReceived);
        event.setDifference(diff);
        event.setLocation(location);
        event.setActor(actor.getName());
        event.setEventType("HANDOFF");
        event.setNotes(notes);

        movementRepository.save(event);

        // Update passport
        passport.setCurrentHolderId(toOrg.getId());
        passport.setCurrentLocation(location);
        passport.setCurrentQuantity(quantityReceived);

        if (diff != 0) {
            passport.setRiskLevel("HIGH");
            passport.setRiskScore(passport.getRiskScore() + 50);
            passport.setNextAction("INVESTIGATE_DISCREPANCY");
            
            fraudDetectionService.generateAlert(
                "QUANTITY_DISCREPANCY",
                AlertSeverity.HIGH,
                null,
                passport.getBatchNumber(),
                location,
                toOrg,
                "Quantity discrepancy during handoff to " + toOrg.getName() + ". Expected: " + event.getQuantitySent() + ", Received: " + quantityReceived
            );
        } else {
            // Update next action based on role if no discrepancy
            if (toOrg.getType() == OrganizationType.MANUFACTURER) {
                passport.setNextAction("SCHEDULE_DESTRUCTION");
            } else if (toOrg.getType() == OrganizationType.WASTE_FACILITY) {
                passport.setNextAction("CONFIRM_DESTRUCTION");
            } else {
                passport.setNextAction("SEND_TO_NEXT_NODE");
            }
        }

        passportRepository.save(passport);

        return event;
    }
}
