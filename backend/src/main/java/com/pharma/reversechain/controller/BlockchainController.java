package com.pharma.reversechain.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.blockchain.FabricGatewayConfig;
import com.pharma.reversechain.entity.Certificate;
import com.pharma.reversechain.service.BlockchainService;
import com.pharma.reversechain.repository.CertificateRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/blockchain")
@RequiredArgsConstructor
public class BlockchainController {

    private final BlockchainService blockchainService;
    private final FabricGatewayConfig gatewayConfig;
    private final CertificateRepository certificateRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "fabricEnabled", gatewayConfig.isEnabled(),
                "channelName", gatewayConfig.getChannelName(),
                "chaincodeName", gatewayConfig.getChaincodeName(),
                "peerEndpoint", gatewayConfig.getPeerEndpoint(),
                "mspId", gatewayConfig.getMspId(),
                "status", "CONNECTED"
        ));
    }

    @GetMapping("/batches/{batchId}")
    public ResponseEntity<Object> getBatchFromLedger(@PathVariable String batchId) {
        String result = blockchainService.getBatchState(batchId);
        try {
            return ResponseEntity.ok(objectMapper.readValue(result, Object.class));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("raw", result));
        }
    }

    @GetMapping("/batches/{batchId}/history")
    public ResponseEntity<Object> getBatchHistoryFromLedger(@PathVariable String batchId) {
        String history = blockchainService.getBatchHistory(batchId);
        try {
            return ResponseEntity.ok(objectMapper.readValue(history, Object.class));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("raw", history));
        }
    }

    @PostMapping("/certificates/verify")
    public ResponseEntity<Map<String, Object>> verifyCertificateHash(@RequestBody VerifyCertRequest request) {
        // Look up certificate in PostgreSQL
        Certificate cert = null;
        if (request.getCertificateId() != null) {
            cert = certificateRepository.findById(request.getCertificateId()).orElse(null);
        }

        String ledgerBatch = blockchainService.getBatchState(request.getBatchId());
        boolean hashMatches = false;
        String recordedHash = cert != null ? cert.getCertificateHash() : null;

        if (request.getCertificateContent() != null) {
            String calculatedHash = blockchainService.computeSha256(request.getCertificateContent());
            hashMatches = calculatedHash.equalsIgnoreCase(recordedHash) ||
                    (ledgerBatch != null && ledgerBatch.contains(calculatedHash));
            return ResponseEntity.ok(Map.of(
                    "verified", hashMatches,
                    "computedHash", calculatedHash,
                    "ledgerHash", recordedHash != null ? recordedHash : "N/A",
                    "blockchainTxId", cert != null ? cert.getBlockchainTxId() : "N/A",
                    "status", hashMatches ? "TAMPER_FREE" : "TAMPERED_OR_NOT_FOUND"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "verified", cert != null,
                "certificateHash", recordedHash != null ? recordedHash : "N/A",
                "blockchainTxId", cert != null ? cert.getBlockchainTxId() : "N/A"
        ));
    }

    @Data
    public static class VerifyCertRequest {
        private UUID certificateId;
        private String batchId;
        private String certificateContent;
    }
}
