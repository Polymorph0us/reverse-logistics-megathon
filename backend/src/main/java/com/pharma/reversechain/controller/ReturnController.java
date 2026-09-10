package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.ReturnInitiateRequest;
import com.pharma.reversechain.dto.ReturnReceiveRequest;
import com.pharma.reversechain.dto.ReturnResponse;
import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.Organization;
import com.pharma.reversechain.entity.Product;
import com.pharma.reversechain.entity.ReturnRequest;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.BatchRepository;
import com.pharma.reversechain.repository.OrganizationRepository;
import com.pharma.reversechain.repository.ProductRepository;
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
    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final OrganizationRepository organizationRepository;

    @PostMapping
    @PreAuthorize("hasRole('RETAILER') or hasRole('DISTRIBUTOR')")
    public ResponseEntity<ReturnResponse> initiateReturn(
            @Valid @RequestBody ReturnInitiateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        ReturnRequest returnReq = returnService.initiateReturn(
                request.getBatchId(), request.getRequestedQuantity(), request.getReason(), request.getCondition(), request.getEvidence(), actor);
        
        return ResponseEntity.ok(toReturnResponse(returnReq));
    }

    @GetMapping
    public Page<ReturnResponse> getReturns(Pageable pageable) {
        return returnRequestRepository.findAll(pageable).map(this::toReturnResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReturnResponse> getReturn(@PathVariable UUID id) {
        return returnRequestRepository.findById(id)
                .map(this::toReturnResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasRole('DISTRIBUTOR')")
    public ResponseEntity<ReturnResponse> receiveAtDistributor(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnReceiveRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        ReturnRequest returnReq = returnService.receiveAtDistributor(
                id, request.getReceivedQuantity(), request.getCondition(), request.getEvidence(), actor);

        return ResponseEntity.ok(toReturnResponse(returnReq));
    }

    @PostMapping("/{id}/manufacturer-receive")
    @PreAuthorize("hasRole('MANUFACTURER')")
    public ResponseEntity<ReturnResponse> receiveAtManufacturer(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnReceiveRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        User actor = userRepository.findById(userDetails.getId()).orElseThrow();
        ReturnRequest returnReq = returnService.receiveAtManufacturer(
                id, request.getReceivedQuantity(), request.getCondition(), request.getEvidence(), actor);

        return ResponseEntity.ok(toReturnResponse(returnReq));
    }

    private ReturnResponse toReturnResponse(ReturnRequest returnReq) {
        Batch batch = batchRepository.findById(returnReq.getBatchId()).orElse(null);
        Product product = batch != null ? productRepository.findById(batch.getProductId()).orElse(null) : null;
        Organization initiator = organizationRepository.findById(returnReq.getInitiatedBy()).orElse(null);
        
        return ReturnResponse.builder()
                .returnId(returnReq.getReturnId())
                .batchId(returnReq.getBatchId())
                .batchNumber(batch != null ? batch.getBatchNumber() : null)
                .productName(product != null ? product.getProductName() : null)
                .initiatorName(initiator != null ? initiator.getName() : null)
                .reason(returnReq.getReason())
                .requestedQuantity(returnReq.getRequestedQuantity())
                .receivedQuantity(returnReq.getReceivedQuantity())
                .difference(returnReq.getDifference())
                .status(returnReq.getStatus())
                .initiatedAt(returnReq.getCreatedAt())
                .receivedAt(null) // Could add receivedAt timestamp to ReturnRequest entity if needed
                .build();
    }
}

