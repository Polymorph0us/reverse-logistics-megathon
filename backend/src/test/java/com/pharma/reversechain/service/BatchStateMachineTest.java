package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.BatchStatus;
import com.pharma.reversechain.entity.Role;
import com.pharma.reversechain.repository.BatchEventRepository;
import com.pharma.reversechain.repository.BatchRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchStateMachineTest {

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private BatchEventRepository batchEventRepository;

    @InjectMocks
    private BatchStateMachine batchStateMachine;

    @Test
    void validateTransition_validTransitions() {
        batchStateMachine.validateTransition(BatchStatus.ACTIVE, BatchStatus.RETURN_INITIATED);
        batchStateMachine.validateTransition(BatchStatus.WITH_DISTRIBUTOR, BatchStatus.DISPUTED);
    }

    @Test
    void validateTransition_invalidTransition_throwsException() {
        assertThrows(IllegalStateException.class, () ->
                batchStateMachine.validateTransition(BatchStatus.RETURN_INITIATED, BatchStatus.ACTIVE)
        );
    }

    @Test
    void transitionBatch_success() {
        Batch batch = new Batch();
        batch.setBatchId(UUID.randomUUID());
        batch.setCurrentStatus(BatchStatus.ACTIVE);

        when(batchRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Batch updated = batchStateMachine.transitionBatch(batch, BatchStatus.RETURN_INITIATED, "INIT", "User1", UUID.randomUUID(), Role.RETAILER, null, 10, null, null);

        assertEquals(BatchStatus.RETURN_INITIATED, updated.getCurrentStatus());
    }
}
