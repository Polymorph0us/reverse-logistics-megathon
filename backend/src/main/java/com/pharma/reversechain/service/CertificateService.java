package com.pharma.reversechain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.entity.Certificate;
import com.pharma.reversechain.entity.MedicinePassport;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Certificate generateDestructionCertificate(MedicinePassport passport, User issuer, String destructionMethod, String facilityId) {
        Certificate cert = new Certificate();
        cert.setTrackingId(passport.getTrackingId());
        cert.setBatchId(passport.getBatchId());
        cert.setBatchNumber(passport.getBatchNumber());
        cert.setIssuerId(issuer.getOrganizationId());
        cert.setDestructionMethod(destructionMethod);
        
        try {
            Map<String, Object> certData = new HashMap<>();
            certData.put("trackingId", passport.getTrackingId());
            certData.put("batchNumber", passport.getBatchNumber());
            certData.put("quantityDestroyed", passport.getCurrentQuantity());
            certData.put("destructionMethod", destructionMethod);
            certData.put("facilityId", facilityId);
            certData.put("issuer", issuer.getName());
            certData.put("timestamp", java.time.Instant.now().toString());
            
            String documentContent = objectMapper.writeValueAsString(certData);
            cert.setDocumentContent(documentContent);
            
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(documentContent.getBytes(StandardCharsets.UTF_8));
            String hashStr = Base64.getEncoder().encodeToString(encodedhash);
            
            cert.setCertificateHash(hashStr);
            cert.setStatus("ISSUED");
            
            return certificateRepository.save(cert);
        } catch (Exception e) {
            log.error("Failed to generate certificate", e);
            throw new RuntimeException("Failed to generate certificate", e);
        }
    }
}
