package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.DisputeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final FraudDetectionService fraudDetectionService;

    @Transactional
    public Dispute createDispute(String trackingId, Integer expectedQuantity, Integer receivedQuantity, User reporter, String notes) {
        Dispute dispute = new Dispute();
        dispute.setTrackingId(trackingId);
        dispute.setReporterOrganizationId(reporter.getOrganizationId());
        dispute.setExpectedQuantity(expectedQuantity);
        dispute.setReceivedQuantity(receivedQuantity);
        dispute.setDifference(expectedQuantity - receivedQuantity);
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setNotes(notes);

        dispute = disputeRepository.save(dispute);

        // Use the Organization association if available, but don't fail if it's null
        Organization org = null;
        try {
            org = reporter.getOrganization();
        } catch (Exception e) {
            log.warn("Could not load organization for dispute alert: {}", e.getMessage());
        }

        fraudDetectionService.generateAlert(
            "QUANTITY_MISMATCH",
            AlertSeverity.HIGH,
            null,
            null,
            null,
            org,
            "Quantity discrepancy during receipt. Expected: " + expectedQuantity + ", Received: " + receivedQuantity
        );

        return dispute;
    }

    @Transactional
    public Dispute resolveDispute(UUID disputeId, String resolutionNotes) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found: " + disputeId));

        dispute.setStatus(DisputeStatus.RESOLVED);
        String existing = dispute.getNotes() != null ? dispute.getNotes() : "";
        dispute.setNotes(existing + "\nResolution: " + resolutionNotes);
        dispute.setResolvedAt(LocalDateTime.now());
        
        return disputeRepository.save(dispute);
    }

    @Transactional(readOnly = true)
    public Page<Dispute> getDisputes(User actor, Pageable pageable) {
        if ("ADMIN".equals(actor.getRole()) || "REGULATOR".equals(actor.getRole())) {
            return disputeRepository.findAll(pageable);
        }
        return disputeRepository.findByReporterOrganizationId(actor.getOrganizationId(), pageable);
    }

    @Transactional(readOnly = true)
    public Dispute getDispute(UUID id, User actor) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found: " + id));
        if (!"ADMIN".equals(actor.getRole()) && !"REGULATOR".equals(actor.getRole())) {
            if (!dispute.getReporterOrganizationId().equals(actor.getOrganizationId())) {
                throw new IllegalStateException("Unauthorized: You do not have access to this Dispute");
            }
        }
        return dispute;
    }

    @Transactional(readOnly = true)
    public List<Dispute> getDisputesByTrackingId(String trackingId) {
        return disputeRepository.findByTrackingId(trackingId);
    }
}
