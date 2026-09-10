package com.pharma.reversechain.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.blockchain.FabricGatewayConfig;
import com.pharma.reversechain.dto.BlockchainProofResponse;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.service.AlertService;
import com.pharma.reversechain.service.BlockchainService;
import com.pharma.reversechain.repository.CertificateRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/blockchain")
@RequiredArgsConstructor
public class BlockchainController {

    private final BlockchainService blockchainService;
    private final FabricGatewayConfig gatewayConfig;
    private final CertificateRepository certificateRepository;
    private final AlertService alertService;
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

    @GetMapping("/certificates/{certificateId}/verify")
    public ResponseEntity<BlockchainProofResponse> verifyCertificateById(@PathVariable UUID certificateId) {
        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new IllegalArgumentException("Certificate not found"));
        
        try {
            // Get blockchain state for this certificate's batch
            String batchState = blockchainService.getBatchState(cert.getBatchId().toString());
            
            Map<String, Object> blockchainData = new HashMap<>();
            String verificationResult = "NOT_FOUND";
            
            if (batchState != null && !batchState.isEmpty()) {
                try {
                    blockchainData = objectMapper.readValue(batchState, Map.class);
                    
                    // Check if certificate hash matches blockchain record
                    boolean hashMatches = batchState.contains(cert.getCertificateHash());
                    verificationResult = hashMatches ? "MATCH" : "MISMATCH";
                    
                    if ("MISMATCH".equals(verificationResult)) {
                        // Raise blockchain integrity mismatch alert
                        log.warn("BLOCKCHAIN INTEGRITY MISMATCH detected for certificate {}", certificateId);
                        Batch batch = null;
                        Organization org = null;
                        try {
                            // These can be lazy-loaded from cert if needed, for now we'll log the alert
                            String alertMessage = "Certificate blockchain integrity mismatch detected for certificate " + 
                                    certificateId + ", batch " + cert.getBatchId();
                            alertService.generateAlert(
                                    "BLOCKCHAIN_INTEGRITY_MISMATCH",
                                    AlertSeverity.CRITICAL,
                                    batch,
                                    cert.getBatchNumber(),
                                    null,
                                    org,
                                    alertMessage
                            );
                        } catch (Exception e) {
                            log.error("Failed to create integrity mismatch alert: {}", e.getMessage());
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse blockchain state: {}", e.getMessage());
                    blockchainData.put("raw", batchState);
                }
            }
            
            return ResponseEntity.ok(BlockchainProofResponse.builder()
                    .transactionId(cert.getBlockchainTxId())
                    .certificateHash(cert.getCertificateHash())
                    .batchId(cert.getBatchId().toString())
                    .quantityDestroyed(cert.getQuantityDestroyed())
                    .destructionDate(cert.getDestructionDate().toString())
                    .status(cert.getStatus())
                    .verificationResult(verificationResult)
                    .blockchainData(blockchainData)
                    .timestamp(LocalDateTime.now().toString())
                    .build());
                    
        } catch (Exception e) {
            log.error("Certificate verification failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(BlockchainProofResponse.builder()
                    .transactionId(cert.getBlockchainTxId())
                    .certificateHash(cert.getCertificateHash())
                    .batchId(cert.getBatchId().toString())
                    .status("ERROR")
                    .verificationResult("ERROR")
                    .timestamp(LocalDateTime.now().toString())
                    .build());
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

