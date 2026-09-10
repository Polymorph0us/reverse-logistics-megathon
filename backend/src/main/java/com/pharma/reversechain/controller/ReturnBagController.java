package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.ReturnBag;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.ReturnBagRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/return-bags")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('DISTRIBUTOR', 'MANUFACTURER', 'MEDICAL_REP', 'RETAILER', 'REGULATOR', 'ADMIN')")
@Tag(name = "Return Bags", description = "TER-Bag / Return-Bag lifecycle management APIs")
public class ReturnBagController {

    private final ReturnBagRepository returnBagRepository;

    @GetMapping
    @Operation(summary = "List TER-Bags for the authenticated organization")
    public ResponseEntity<List<ReturnBag>> listReturnBags(@AuthenticationPrincipal User actor) {
        List<ReturnBag> bags = returnBagRepository.findByCurrentOrganizationId(actor.getOrganizationId());
        return ResponseEntity.ok(bags);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a TER-Bag by database UUID")
    public ResponseEntity<ReturnBag> getReturnBag(@PathVariable UUID id, @AuthenticationPrincipal User actor) {
        ReturnBag bag = returnBagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TER-Bag not found: " + id));
        if (!"ADMIN".equals(actor.getRole()) && !"REGULATOR".equals(actor.getRole())) {
            if (!bag.getCurrentOrganizationId().equals(actor.getOrganizationId())) {
                throw new IllegalStateException("Unauthorized: TER-Bag does not belong to your organization");
            }
        }
        return ResponseEntity.ok(bag);
    }

    @GetMapping("/by-bag-id/{bagId}")
    @Operation(summary = "Get a TER-Bag by bag identifier (e.g. TER-XXXXXXXX)")
    public ResponseEntity<ReturnBag> getReturnBagByBagId(@PathVariable String bagId, @AuthenticationPrincipal User actor) {
        ReturnBag bag = returnBagRepository.findByBagId(bagId)
                .orElseThrow(() -> new IllegalArgumentException("TER-Bag not found: " + bagId));
        if (!"ADMIN".equals(actor.getRole()) && !"REGULATOR".equals(actor.getRole())) {
            if (!bag.getCurrentOrganizationId().equals(actor.getOrganizationId())) {
                throw new IllegalStateException("Unauthorized: TER-Bag does not belong to your organization");
            }
        }
        return ResponseEntity.ok(bag);
    }
}
