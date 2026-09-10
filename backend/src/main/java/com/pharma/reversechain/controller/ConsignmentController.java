package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.Dispute;
import com.pharma.reversechain.entity.MasterConsignment;
import com.pharma.reversechain.entity.ReturnBag;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.service.ConsignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/consignments")
@RequiredArgsConstructor
@Tag(name = "Consignments", description = "Master Consignment Manifest (MCM) management APIs")
public class ConsignmentController {

    private final ConsignmentService consignmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DISTRIBUTOR', 'MANUFACTURER', 'MEDICAL_REP')")
    @Operation(summary = "Create a new Master Consignment Manifest")
    public ResponseEntity<MasterConsignment> createConsignment(@RequestBody CreateConsignmentRequest request, @AuthenticationPrincipal User actor) {
        MasterConsignment mcm = consignmentService.createConsignment(request.getTargetManufacturerId(), actor);
        return ResponseEntity.ok(mcm);
    }

    @GetMapping
    @Operation(summary = "List all consignments visible to the authenticated organization")
    public ResponseEntity<Page<MasterConsignment>> listConsignments(@AuthenticationPrincipal User actor, Pageable pageable) {
        return ResponseEntity.ok(consignmentService.listConsignments(actor, pageable));
    }

    @GetMapping("/{mcmId}")
    @Operation(summary = "Get a consignment by ID")
    public ResponseEntity<MasterConsignment> getConsignment(@PathVariable UUID mcmId, @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(consignmentService.getConsignment(mcmId, actor));
    }

    @GetMapping("/{mcmId}/verify")
    @Operation(summary = "Verify MCM hash integrity")
    public ResponseEntity<ConsignmentVerifyResponse> verifyConsignment(@PathVariable UUID mcmId, @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(consignmentService.verifyConsignment(mcmId, actor));
    }

    @PostMapping("/{mcmId}/bags")
    @PreAuthorize("hasAnyRole('DISTRIBUTOR', 'MANUFACTURER', 'MEDICAL_REP')")
    @Operation(summary = "Add TER-Bags to MCM")
    public ResponseEntity<MasterConsignment> addBagsToConsignment(@PathVariable UUID mcmId, @RequestBody AddBagsRequest request, @AuthenticationPrincipal User actor) {
        MasterConsignment mcm = consignmentService.addBagsToConsignment(mcmId, request.getBagIds(), actor);
        return ResponseEntity.ok(mcm);
    }

    @PostMapping("/{mcmId}/seal")
    @PreAuthorize("hasAnyRole('DISTRIBUTOR', 'MANUFACTURER', 'MEDICAL_REP')")
    @Operation(summary = "Seal the MCM and generate integrity hash")
    public ResponseEntity<MasterConsignment> sealConsignment(@PathVariable UUID mcmId, @RequestBody SealRequest request, @AuthenticationPrincipal User actor) {
        MasterConsignment mcm = consignmentService.sealConsignment(mcmId, request.getSealId(), actor);
        return ResponseEntity.ok(mcm);
    }

    @PostMapping("/{mcmId}/dispatch")
    @PreAuthorize("hasAnyRole('DISTRIBUTOR', 'MANUFACTURER', 'MEDICAL_REP')")
    @Operation(summary = "Dispatch the sealed MCM to manufacturer")
    public ResponseEntity<MasterConsignment> dispatchConsignment(@PathVariable UUID mcmId, @AuthenticationPrincipal User actor) {
        MasterConsignment mcm = consignmentService.dispatchConsignment(mcmId, actor);
        return ResponseEntity.ok(mcm);
    }

    @PostMapping("/{mcmId}/receive")
    @PreAuthorize("hasAnyRole('MANUFACTURER', 'MEDICAL_REP')")
    @Operation(summary = "Manufacturer receives MCM — verifies seal and hash")
    public ResponseEntity<MasterConsignment> receiveConsignment(@PathVariable UUID mcmId, @RequestBody SealRequest request, @AuthenticationPrincipal User actor) {
        MasterConsignment mcm = consignmentService.receiveConsignment(mcmId, request.getSealId(), actor);
        return ResponseEntity.ok(mcm);
    }

    @PostMapping("/return-bags")
    @PreAuthorize("hasAnyRole('DISTRIBUTOR', 'MANUFACTURER', 'MEDICAL_REP', 'RETAILER')")
    @Operation(summary = "Create a TER-Bag for a returned batch")
    public ResponseEntity<ReturnBag> createReturnBag(@RequestBody CreateReturnBagRequest request, @AuthenticationPrincipal User actor) {
        ReturnBag bag = consignmentService.createReturnBag(request.getTrackingId(), request.getBatchId(), request.getQuantity(), actor);
        return ResponseEntity.ok(bag);
    }

    // -------- Request/Response DTOs --------

    @Data
    public static class CreateConsignmentRequest {
        private UUID targetManufacturerId;
    }

    @Data
    public static class AddBagsRequest {
        private List<String> bagIds;
    }

    @Data
    public static class SealRequest {
        private String sealId;
    }

    @Data
    public static class CreateReturnBagRequest {
        private String trackingId;
        private UUID batchId;
        private Integer quantity;
    }

    @Data
    public static class ConsignmentVerifyResponse {
        private String mcmId;
        private String storedHash;
        private String calculatedHash;
        private boolean hashMatch;
        private String status;
        private String message;
    }
}
