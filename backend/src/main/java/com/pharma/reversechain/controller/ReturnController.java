package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.ReturnInitiateRequest;
import com.pharma.reversechain.dto.ReturnReceiveRequest;
import com.pharma.reversechain.entity.ReturnRequest;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.ReturnRequestRepository;
import com.pharma.reversechain.repository.UserRepository;
import com.pharma.reversechain.security.UserDetailsImpl;
import com.pharma.reversechain.service.ReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;
    private final ReturnRequestRepository returnRequestRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('RETAILER') or hasRole('DISTRIBUTOR')")
    public ResponseEntity<ReturnRequest> initiateReturn(
            @Valid @RequestBody ReturnInitiateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        ReturnRequest returnReq = returnService.initiateReturn(
                request.getBatchId(), request.getRequestedQuantity(), request.getReason(), request.getCondition(), request.getEvidence(), actor);
        
        return ResponseEntity.ok(returnReq);
    }

    @GetMapping
    public Page<ReturnRequest> getReturns(Pageable pageable) {
        return returnRequestRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReturnRequest> getReturn(@PathVariable UUID id) {
        return returnRequestRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasRole('DISTRIBUTOR')")
    public ResponseEntity<ReturnRequest> receiveAtDistributor(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnReceiveRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        ReturnRequest returnReq = returnService.receiveAtDistributor(
                id, request.getReceivedQuantity(), request.getCondition(), request.getEvidence(), actor);

        return ResponseEntity.ok(returnReq);
    }

    @PostMapping("/{id}/manufacturer-receive")
    @PreAuthorize("hasRole('MANUFACTURER')")
    public ResponseEntity<ReturnRequest> receiveAtManufacturer(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnReceiveRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        ReturnRequest returnReq = returnService.receiveAtManufacturer(
                id, request.getReceivedQuantity(), request.getCondition(), request.getEvidence(), actor);

        return ResponseEntity.ok(returnReq);
    }
}
