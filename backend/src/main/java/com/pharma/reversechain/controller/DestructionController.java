package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.ConfirmDestructionRequest;
import com.pharma.reversechain.dto.ScheduleDestructionRequest;
import com.pharma.reversechain.entity.Certificate;
import com.pharma.reversechain.entity.DestructionRecord;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.UserRepository;
import com.pharma.reversechain.security.UserDetailsImpl;
import com.pharma.reversechain.service.DestructionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/destruction")
@RequiredArgsConstructor
public class DestructionController {

    private final DestructionService destructionService;
    private final UserRepository userRepository;

    @PostMapping("/schedule")
    @PreAuthorize("hasRole('MANUFACTURER')")
    public ResponseEntity<DestructionRecord> scheduleDestruction(
            @Valid @RequestBody ScheduleDestructionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        DestructionRecord record = destructionService.scheduleDestruction(request, actor);

        return ResponseEntity.ok(record);
    }

    @PostMapping("/{id}/certificate")
    @PreAuthorize("hasRole('MANUFACTURER') or hasRole('WASTE_FACILITY')")
    public ResponseEntity<Certificate> confirmDestruction(
            @PathVariable UUID id,
            @Valid @RequestBody ConfirmDestructionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        Certificate certificate = destructionService.confirmDestruction(id, request, actor);

        return ResponseEntity.ok(certificate);
    }
}
