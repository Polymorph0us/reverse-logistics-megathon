package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.Dispute;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.service.DisputeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DISTRIBUTOR', 'MANUFACTURER', 'MEDICAL_REP', 'RETAILER', 'REGULATOR', 'ADMIN')")
@Tag(name = "Disputes", description = "Quantity discrepancy dispute management APIs")
public class DisputeController {

    private final DisputeService disputeService;

    @GetMapping
    @Operation(summary = "List all disputes")
    public ResponseEntity<Page<Dispute>> listDisputes(@AuthenticationPrincipal User actor, Pageable pageable) {
        return ResponseEntity.ok(disputeService.getDisputes(actor, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a dispute by ID")
    public ResponseEntity<Dispute> getDispute(@PathVariable UUID id, @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(disputeService.getDispute(id, actor));
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Resolve a dispute")
    public ResponseEntity<Dispute> resolveDispute(@PathVariable UUID id, @RequestBody ResolveDisputeRequest request, @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(disputeService.resolveDispute(id, request.getResolutionNotes()));
    }

    @Data
    static class ResolveDisputeRequest {
        private String resolutionNotes;
    }
}
