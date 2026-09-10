package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.ConfirmDestructionRequest;
import com.pharma.reversechain.dto.ScheduleDestructionRequest;
import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.BatchStatus;
import com.pharma.reversechain.entity.Certificate;
import com.pharma.reversechain.entity.DestructionRecord;
import com.pharma.reversechain.entity.DestructionStatus;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.CertificateRepository;
import com.pharma.reversechain.repository.DestructionRecordRepository;
import com.pharma.reversechain.repository.UserRepository;
import com.pharma.reversechain.security.UserDetailsImpl;
import com.pharma.reversechain.service.DestructionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DestructionController {

    private final DestructionService destructionService;
    private final UserRepository userRepository;
    private final DestructionRecordRepository destructionRecordRepository;
    private final CertificateRepository certificateRepository;
    private final BatchRepository batchRepository;

    @GetMapping({"/destruction/pending", "/destructions/pending"})
    public ResponseEntity<List<DestructionRecord>> getPendingDestructions() {
        List<DestructionRecord> pending = destructionRecordRepository.findByStatus(DestructionStatus.SCHEDULED);
        return ResponseEntity.ok(pending);
    }

    @PostMapping({"/destruction/schedule", "/destructions/schedule"})
    @PreAuthorize("hasRole('MANUFACTURER')")
    public ResponseEntity<DestructionRecord> scheduleDestruction(
            @Valid @RequestBody ScheduleDestructionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        DestructionRecord record = destructionService.scheduleDestruction(request, actor);

        return ResponseEntity.ok(record);
    }

    @PostMapping({"/destruction/{id}/certificate", "/destructions/{id}/certificate", "/destruction/{id}/confirm", "/destructions/{id}/confirm"})
    @PreAuthorize("hasRole('MANUFACTURER') or hasRole('WASTE_FACILITY')")
    public ResponseEntity<Certificate> confirmDestruction(
            @PathVariable UUID id,
            @Valid @RequestBody ConfirmDestructionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        Certificate certificate = destructionService.confirmDestruction(id, request, actor);

        return ResponseEntity.ok(certificate);
    }

    @GetMapping({"/certificates/{id}", "/destruction/certificates/{id}", "/destructions/certificates/{id}"})
    public ResponseEntity<Certificate> getCertificate(@PathVariable UUID id) {
        return certificateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
