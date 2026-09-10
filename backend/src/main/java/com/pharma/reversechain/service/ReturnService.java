package com.pharma.reversechain.service;

import com.pharma.reversechain.blockchain.FabricGatewayService;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.ReturnRequestRepository;
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
    private final FabricGatewayService fabricGatewayService;

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

        // Record RETURN_INITIATED on Fabric Audit Ledger
        try {
            fabricGatewayService.initiateReturn(
                    batch.getBatchId().toString(),
                    savedRequest.getReturnId().toString(),
                    quantity,
                    reason,
                    condition
            );
        } catch (Exception e) {
            log.warn("Fabric audit record for initiateReturn encountered exception: {}", e.getMessage());
        }

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
        }
        batch.setCurrentOwnerId(actor.getOrganizationId());
        batchRepository.save(batch);

        request.setStatus(diff != 0 ? ReturnStatus.DISCREPANCY : ReturnStatus.RECEIVED_DISTRIBUTOR);
        request.setCondition(condition);
        if (evidence != null) request.setEvidence(evidence);

        ReturnRequest savedRequest = returnRequestRepository.save(request);

        // Record RETURN_RECEIVED on Fabric Audit Ledger
        try {
            fabricGatewayService.receiveReturn(
                    batch.getBatchId().toString(),
                    savedRequest.getReturnId().toString(),
                    receivedQuantity,
                    diff,
                    condition
            );
        } catch (Exception e) {
            log.warn("Fabric audit record for receiveReturn encountered exception: {}", e.getMessage());
        }

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

        // Record MANUFACTURER_RECEIVED on Fabric Audit Ledger
        try {
            fabricGatewayService.manufacturerReceive(
                    batch.getBatchId().toString(),
                    savedRequest.getReturnId().toString(),
                    receivedQuantity,
                    condition
            );
        } catch (Exception e) {
            log.warn("Fabric audit record for manufacturerReceive encountered exception: {}", e.getMessage());
        }

        return savedRequest;
    }
}
