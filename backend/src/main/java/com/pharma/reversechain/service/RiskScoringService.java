package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.RiskLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiskScoringService {

    @Value("${fraud.thresholds.low:20}")
    private int lowThreshold = 20;

    @Value("${fraud.thresholds.medium:50}")
    private int mediumThreshold = 50;

    @Value("${fraud.thresholds.high:80}")
    private int highThreshold = 80;

    public RiskScoreResult computeRiskScore(List<String> riskFactors) {
        int score = 0;
        for (String factor : riskFactors) {
            switch (factor) {
                case "EXPIRED_BATCH":
                    score += 50;
                    break;
                case "DESTROYED_BATCH_REENTRY":
                    score += 100;
                    break;
                case "QUANTITY_MISMATCH":
                    score += 60;
                    break;
                case "UNKNOWN_BATCH":
                    score += 80;
                    break;
                case "IDENTITY_MISMATCH":
                    score += 90;
                    break;
                case "IMPOSSIBLE_MOVEMENT":
                    score += 70;
                    break;
                case "DUPLICATE_BATCH":
                    score += 85;
                    break;
                case "SUSPICIOUS_REENTRY":
                    score += 75;
                    break;
                default:
                    score += 10;
            }
        }

        score = Math.min(score, 100);
        RiskLevel level;
        if (score <= lowThreshold) {
            level = RiskLevel.LOW;
        } else if (score <= mediumThreshold) {
            level = RiskLevel.MEDIUM;
        } else if (score <= highThreshold) {
            level = RiskLevel.HIGH;
        } else {
            level = RiskLevel.CRITICAL;
        }

        return new RiskScoreResult(score, level, riskFactors);
    }

    public record RiskScoreResult(int score, RiskLevel level, List<String> reasons) {}
}
