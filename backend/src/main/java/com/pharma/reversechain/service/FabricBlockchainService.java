package com.pharma.reversechain.service;

import com.pharma.reversechain.blockchain.FabricGatewayService;
import com.pharma.reversechain.blockchain.FabricGatewayService.FabricTransactionResult;
import com.pharma.reversechain.exception.BlockchainUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Real Hyperledger Fabric implementation of BlockchainService.
 * Active when blockchain.mode=fabric.
 * If Fabric is unreachable, operations FAIL explicitly — never silently fall back.
 */
@Slf4j
@RequiredArgsConstructor
public class FabricBlockchainService implements BlockchainService {

    private final FabricGatewayService fabricGatewayService;

    @Override
    public BlockchainResult registerBatch(String batchId, String batchNumber, String manufacturerId,
                                           int quantity, String manufacturingDate, String expiryDate) {
        FabricTransactionResult result = fabricGatewayService.createBatch(batchId, batchNumber, manufacturerId,
                quantity, manufacturingDate, expiryDate);
        return toBlockchainResult(result, "createBatch");
    }

    @Override
    public BlockchainResult recordReturn(String batchId, String returnId, int quantity, String reason, String conditionNote) {
        FabricTransactionResult result = fabricGatewayService.initiateReturn(batchId, returnId, quantity, reason, conditionNote);
        return toBlockchainResult(result, "initiateReturn");
    }

    @Override
    public BlockchainResult recordDistributorReceipt(String batchId, String returnId, int receivedQuantity,
                                                      int difference, String conditionNote) {
        FabricTransactionResult result = fabricGatewayService.receiveReturn(batchId, returnId, receivedQuantity, difference, conditionNote);
        return toBlockchainResult(result, "receiveReturn");
    }

    @Override
    public BlockchainResult recordManufacturerReceipt(String batchId, String returnId, int receivedQuantity, String conditionNote) {
        FabricTransactionResult result = fabricGatewayService.manufacturerReceive(batchId, returnId, receivedQuantity, conditionNote);
        return toBlockchainResult(result, "manufacturerReceive");
    }

    @Override
    public BlockchainResult recordDisposalScheduled(String batchId, String destructionId, int quantity,
                                                     String wasteFacilityId, String scheduledDate) {
        FabricTransactionResult result = fabricGatewayService.sendForDisposal(batchId, destructionId, quantity, wasteFacilityId, scheduledDate);
        return toBlockchainResult(result, "sendForDisposal");
    }

    @Override
    public BlockchainResult recordDestruction(String batchId, String destructionId, int quantityDestroyed,
                                               String destructionDate, String certificateId, String certificateHash) {
        FabricTransactionResult result = fabricGatewayService.confirmDestruction(batchId, destructionId, quantityDestroyed,
                destructionDate, certificateId, certificateHash);
        return toBlockchainResult(result, "confirmDestruction");
    }

    @Override
    public BlockchainResult closeBatch(String batchId, String closureReason) {
        FabricTransactionResult result = fabricGatewayService.closeBatch(batchId, closureReason);
        return toBlockchainResult(result, "closeBatch");
    }

    @Override
    public String getBatchState(String batchId) {
        return fabricGatewayService.getBatch(batchId);
    }

    @Override
    public String getBatchHistory(String batchId) {
        return fabricGatewayService.getBatchHistory(batchId);
    }

    @Override
    public boolean isBatchReturned(String batchId) {
        return fabricGatewayService.isBatchReturned(batchId);
    }

    @Override
    public String computeSha256(String text) {
        return fabricGatewayService.computeSha256(text);
    }

    @Override
    public String computeSha256(byte[] bytes) {
        return fabricGatewayService.computeSha256(bytes);
    }

    private BlockchainResult toBlockchainResult(FabricTransactionResult result, String operation) {
        if (!result.success()) {
            String errorMsg = result.error() != null ? result.error() : "Unknown Fabric error";
            log.error("Fabric operation '{}' failed: {}", operation, errorMsg);
            throw new BlockchainUnavailableException("Fabric transaction '" + operation + "' failed: " + errorMsg);
        }
        // Extract txId from the payload if available
        String txId = result.eventHash() != null ? result.eventHash() : "unknown";
        return new BlockchainResult(true, txId, result.payload(), result.eventHash(), null);
    }
}
