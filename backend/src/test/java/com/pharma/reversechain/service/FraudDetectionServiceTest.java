package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.BatchStatus;
import com.pharma.reversechain.entity.InvalidRegistry;
import com.pharma.reversechain.entity.RiskLevel;
import com.pharma.reversechain.repository.FraudAlertRepository;
import com.pharma.reversechain.repository.InvalidRegistryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FraudDetectionServiceTest {

    @Mock
    private FraudAlertRepository fraudAlertRepository;

    @Mock
    private InvalidRegistryRepository invalidRegistryRepository;

    private RiskScoringService riskScoringService;
    private FraudDetectionService fraudDetectionService;

    @BeforeEach
    void setUp() {
        riskScoringService = new RiskScoringService();
        fraudDetectionService = new FraudDetectionService(fraudAlertRepository, invalidRegistryRepository, riskScoringService);
    }

    @Test
    void detectFraud_nullBatch_returnsUnknownBatchHighRisk() {
        RiskScoringService.RiskScoreResult result = fraudDetectionService.detectFraudForVerification(
                null, "TEST-BATCH-999", "Jaipur POS", null);

        assertEquals(RiskLevel.HIGH, result.level());
        assertEquals(80, result.score());
        assertTrue(result.reasons().contains("UNKNOWN_BATCH"));
        verify(fraudAlertRepository, times(1)).save(any());
    }

    @Test
    void detectFraud_activeValidBatch_returnsLowRisk() {
        Batch batch = new Batch();
        batch.setBatchId(UUID.randomUUID());
        batch.setBatchNumber("BATCH-OK");
        batch.setManufacturerId(UUID.randomUUID());
        batch.setManufacturingDate(LocalDate.now().minusMonths(6));
        batch.setExpiryDate(LocalDate.now().plusYears(1));
        batch.setCurrentStatus(BatchStatus.ACTIVE);

        when(invalidRegistryRepository.findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
                any(), any(), any(), any())).thenReturn(Collections.emptyList());

        RiskScoringService.RiskScoreResult result = fraudDetectionService.detectFraudForVerification(
                batch, "Jaipur POS", null);

        assertEquals(RiskLevel.LOW, result.level());
        assertEquals(0, result.score());
        verify(fraudAlertRepository, never()).save(any());
    }

    @Test
    void detectFraud_destroyedBatchReentry_flagsCritical() {
        Batch batch = new Batch();
        batch.setBatchId(UUID.randomUUID());
        batch.setBatchNumber("BATCH-DESTROYED");
        batch.setManufacturerId(UUID.randomUUID());
        batch.setManufacturingDate(LocalDate.now().minusYears(2));
        batch.setExpiryDate(LocalDate.now().plusMonths(6));
        batch.setCurrentStatus(BatchStatus.DESTROYED);

        InvalidRegistry invalidEntry = new InvalidRegistry();
        invalidEntry.setBatchNumber("BATCH-DESTROYED");
        when(invalidRegistryRepository.findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
                any(), any(), any(), any())).thenReturn(List.of(invalidEntry));

        RiskScoringService.RiskScoreResult result = fraudDetectionService.detectFraudForVerification(
                batch, "Mumbai Pharmacy", null);

        assertEquals(RiskLevel.CRITICAL, result.level());
        assertTrue(result.reasons().contains("DESTROYED_BATCH_REENTRY"));
        verify(fraudAlertRepository, atLeastOnce()).save(any());
    }

    @Test
    void detectFraud_expiredBatch_flagsMediumRisk() {
        Batch batch = new Batch();
        batch.setBatchId(UUID.randomUUID());
        batch.setBatchNumber("BATCH-EXPIRED");
        batch.setManufacturerId(UUID.randomUUID());
        batch.setManufacturingDate(LocalDate.now().minusYears(3));
        batch.setExpiryDate(LocalDate.now().minusDays(10));
        batch.setCurrentStatus(BatchStatus.EXPIRED);

        when(invalidRegistryRepository.findByManufacturerIdAndBatchNumberAndManufacturingDateAndExpiryDate(
                any(), any(), any(), any())).thenReturn(Collections.emptyList());

        RiskScoringService.RiskScoreResult result = fraudDetectionService.detectFraudForVerification(
                batch, "Delhi Pharmacy", null);

        assertEquals(RiskLevel.MEDIUM, result.level());
        assertTrue(result.reasons().contains("EXPIRED_BATCH"));
        verify(fraudAlertRepository, times(1)).save(any());
    }
}
