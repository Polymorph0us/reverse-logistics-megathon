package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.ReturnRequestRepository;
import com.pharma.reversechain.repository.MedicinePassportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final BatchRepository batchRepository;
    private final BatchStateMachine stateMachine;
    private final FraudDetectionService fraudDetectionService;
    private final ConsignmentService consignmentService;
    private final DisputeService disputeService;
    private final MedicinePassportRepository passportRepository;

    @Transactional
    public ReturnRequest initiateReturn(UUID batchId, Integer quantity, String reason, String condition, String evidence, User actor) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found"));

        if (batch.getCurrentQuantity() < quantity) {
            throw new IllegalArgumentException("Requested return quantity exceeds current batch quantity");
        }

        // State transition
        batch = stateMachine.transitionBatch(batch, BatchStatus.RETURN_INITIATED, "RETURN_INITIATED",
                actor.getName(), actor.getOrganizationId(), actor.getRole(), null, quantity, evidence, null);
        
        batch.setCurrentOwnerId(null); // In transit basically, or still with retailer. Let's keep it with retailer until pickup, but we'll leave it as is.
        batchRepository.save(batch);

        ReturnRequest request = new ReturnRequest();
        request.setBatchId(batchId);
        request.setRequestedQuantity(quantity);
        request.setReason(reason);
        request.setCondition(condition);
        request.setInitiatedBy(actor.getOrganizationId());
        request.setEvidence(evidence);
        request.setStatus(ReturnStatus.INITIATED);

        ReturnRequest savedRequest = returnRequestRepository.save(request);

        return savedRequest;
    }

    @Transactional
    public ReturnRequest receiveAtDistributor(UUID returnId, Integer receivedQuantity, String condition, String evidence, User actor) {
        ReturnRequest request = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Return Request not found"));

        Batch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found"));

        int diff = receivedQuantity - request.getRequestedQuantity();
        request.setReceivedQuantity(receivedQuantity);
        request.setDifference(diff);

        BatchStatus nextStatus = diff != 0 ? BatchStatus.DISPUTED : BatchStatus.WITH_DISTRIBUTOR;

        batch = stateMachine.transitionBatch(batch, nextStatus, "RECEIVED_BY_DISTRIBUTOR",
                actor.getName(), actor.getOrganizationId(), actor.getRole(), null, receivedQuantity, evidence, "Diff: " + diff);

        if (diff != 0) {
            batch.setRiskLevel(RiskLevel.HIGH);
            batch.setRiskScore(batch.getRiskScore() + 60);
            
            // Generate Fraud Alert via FraudDetectionService is already done inside DisputeService, but keeping this old one or replacing it:
            // We'll rely on the one in DisputeService.
            String trackingId = passportRepository.findByBatchId(batch.getBatchId()).stream().findFirst()
                .map(MedicinePassport::getTrackingId).orElse("UNKNOWN");

            disputeService.createDispute(trackingId, request.getRequestedQuantity(), receivedQuantity, actor, "Quantity discrepancy detected during distributor receipt.");
        } else {
            String trackingId = passportRepository.findByBatchId(batch.getBatchId()).stream().findFirst()
                .map(MedicinePassport::getTrackingId).orElse("UNKNOWN");
            
            consignmentService.createReturnBag(trackingId, batch.getBatchId(), receivedQuantity, actor);
        }
        batch.setCurrentOwnerId(actor.getOrganizationId());
        batchRepository.save(batch);

        request.setStatus(diff != 0 ? ReturnStatus.DISCREPANCY : ReturnStatus.RECEIVED_DISTRIBUTOR);
        request.setCondition(condition);
        if (evidence != null) request.setEvidence(evidence);

        ReturnRequest savedRequest = returnRequestRepository.save(request);

        return savedRequest;
    }

    @Transactional
    public ReturnRequest receiveAtManufacturer(UUID returnId, Integer receivedQuantity, String condition, String evidence, User actor) {
        ReturnRequest request = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new IllegalArgumentException("Return Request not found"));

        Batch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found"));

        int expectedQuantity = request.getReceivedQuantity() != null ? request.getReceivedQuantity() : request.getRequestedQuantity();
        int diff = receivedQuantity - expectedQuantity; // Diff from what distributor or retailer sent
        
        BatchStatus nextStatus = diff != 0 ? BatchStatus.DISPUTED : BatchStatus.WITH_MANUFACTURER;
        
        batch = stateMachine.transitionBatch(batch, nextStatus, "RECEIVED_BY_MANUFACTURER",
                actor.getName(), actor.getOrganizationId(), actor.getRole(), null, receivedQuantity, evidence, "Diff: " + diff);

        if (diff != 0) {
            batch.setRiskLevel(RiskLevel.HIGH);
            batch.setRiskScore(batch.getRiskScore() + 60);
            
            fraudDetectionService.generateAlert(
                "RETURN_QUANTITY_DISCREPANCY",
                AlertSeverity.HIGH,
                batch,
                batch.getBatchNumber(),
                "MANUFACTURER_RECEIPT",
                actor.getOrganization(),
                "Quantity discrepancy detected during manufacturer receipt. Expected: " + expectedQuantity + ", Received: " + receivedQuantity
            );
        } else if (nextStatus == BatchStatus.WITH_MANUFACTURER) {
            // They accepted the received quantity. Update the batch's current quantity to the received one to reflect reality.
            batch.setCurrentQuantity(receivedQuantity);
        }
        
        batch.setCurrentOwnerId(actor.getOrganizationId());
        batchRepository.save(batch);

        request.setReceivedQuantity(receivedQuantity);
        request.setDifference(diff);
        request.setStatus(diff != 0 ? ReturnStatus.DISCREPANCY : ReturnStatus.RECEIVED_MANUFACTURER);
        request.setCondition(condition);
        if (evidence != null) request.setEvidence(evidence);

        ReturnRequest savedRequest = returnRequestRepository.save(request);

        return savedRequest;
    }
}
