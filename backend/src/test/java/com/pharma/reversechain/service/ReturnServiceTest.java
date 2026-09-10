package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.ReturnRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import com.pharma.reversechain.blockchain.FabricGatewayService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReturnServiceTest {

    @Mock
    private ReturnRequestRepository returnRequestRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private BatchStateMachine stateMachine;

    @Mock
    private FraudDetectionService fraudDetectionService;

    @Mock
    private FabricGatewayService fabricGatewayService;

    @InjectMocks
    private ReturnService returnService;

    @Test
    void initiateReturn_quantityExceeds_throwsIllegalArgumentException() {
        UUID batchId = UUID.randomUUID();
        Batch batch = new Batch();
        batch.setBatchId(batchId);
        batch.setCurrentQuantity(50);

        when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));

        User actor = new User();
        actor.setName("Charlie Retailer");
        actor.setRole(Role.RETAILER);

        assertThrows(IllegalArgumentException.class, () ->
                returnService.initiateReturn(batchId, 100, "Expired", "Good", null, actor)
        );
    }

    @Test
    void initiateReturn_validQuantity_createsReturnRequest() {
        UUID batchId = UUID.randomUUID();
        Batch batch = new Batch();
        batch.setBatchId(batchId);
        batch.setCurrentQuantity(100);
        batch.setCurrentStatus(BatchStatus.ACTIVE);

        when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
        when(stateMachine.transitionBatch(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(batch);
        when(returnRequestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        User actor = new User();
        actor.setName("Charlie Retailer");
        actor.setRole(Role.RETAILER);
        actor.setOrganizationId(UUID.randomUUID());

        ReturnRequest result = returnService.initiateReturn(batchId, 50, "Expiring", "Intact", null, actor);

        assertNotNull(result);
        assertEquals(50, result.getRequestedQuantity());
        assertEquals(ReturnStatus.INITIATED, result.getStatus());
        verify(returnRequestRepository, times(1)).save(any());
    }

    @Test
    void receiveAtDistributor_withDiscrepancy_flagsDisputeAndHighRisk() {
        UUID returnId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();

        ReturnRequest request = new ReturnRequest();
        request.setReturnId(returnId);
        request.setBatchId(batchId);
        request.setRequestedQuantity(100);

        Batch batch = new Batch();
        batch.setBatchId(batchId);
        batch.setRiskScore(0);
        batch.setCurrentStatus(BatchStatus.RETURN_INITIATED);

        when(returnRequestRepository.findById(returnId)).thenReturn(Optional.of(request));
        when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
        when(stateMachine.transitionBatch(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(batch);
        when(returnRequestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        User actor = new User();
        actor.setName("Bob Distributor");
        actor.setRole(Role.DISTRIBUTOR);
        actor.setOrganizationId(UUID.randomUUID());

        ReturnRequest updated = returnService.receiveAtDistributor(returnId, 94, "6 missing", null, actor);

        assertEquals(ReturnStatus.DISCREPANCY, updated.getStatus());
        assertEquals(94, updated.getReceivedQuantity());
        assertEquals(-6, updated.getDifference());
        assertEquals(RiskLevel.HIGH, batch.getRiskLevel());
        assertEquals(60, batch.getRiskScore());
    }
}
