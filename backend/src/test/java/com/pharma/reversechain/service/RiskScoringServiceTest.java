package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.RiskLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RiskScoringServiceTest {

    private RiskScoringService riskScoringService;

    @BeforeEach
    void setUp() {
        riskScoringService = new RiskScoringService();
    }

    @Test
    void computeRiskScore_emptyFactors_returnsLow() {
        RiskScoringService.RiskScoreResult result = riskScoringService.computeRiskScore(Collections.emptyList());
        assertEquals(0, result.score());
        assertEquals(RiskLevel.LOW, result.level());
        assertTrue(result.reasons().isEmpty());
    }

    @Test
    void computeRiskScore_expiredBatch_returnsMedium() {
        RiskScoringService.RiskScoreResult result = riskScoringService.computeRiskScore(List.of("EXPIRED_BATCH"));
        assertEquals(50, result.score());
        assertEquals(RiskLevel.MEDIUM, result.level());
    }

    @Test
    void computeRiskScore_destroyedBatchReentry_returnsCritical() {
        RiskScoringService.RiskScoreResult result = riskScoringService.computeRiskScore(List.of("DESTROYED_BATCH_REENTRY"));
        assertEquals(100, result.score());
        assertEquals(RiskLevel.CRITICAL, result.level());
    }

    @Test
    void computeRiskScore_multipleFactors_capsAt100() {
        RiskScoringService.RiskScoreResult result = riskScoringService.computeRiskScore(
                List.of("EXPIRED_BATCH", "QUANTITY_MISMATCH", "UNKNOWN_BATCH")
        );
        assertEquals(100, result.score());
        assertEquals(RiskLevel.CRITICAL, result.level());
    }
}
