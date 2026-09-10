package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.MovementEvent;
import com.pharma.reversechain.security.UserDetailsImpl;
import com.pharma.reversechain.service.MovementService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movement")
@RequiredArgsConstructor
public class MovementController {

    private final MovementService movementService;

    @PostMapping
    public ResponseEntity<MovementEvent> recordMovement(@RequestBody MovementRequest request, @AuthenticationPrincipal UserDetailsImpl actor) {
        MovementEvent event = movementService.recordMovement(
            request.getTrackingId(),
            request.getQuantityReceived(),
            request.getLocation(),
            request.getNotes(),
            actor.getUser()
        );
        return ResponseEntity.ok(event);
    }

    @Data
    static class MovementRequest {
        private String trackingId;
        private Integer quantityReceived;
        private String location;
        private String notes;
    }
}
