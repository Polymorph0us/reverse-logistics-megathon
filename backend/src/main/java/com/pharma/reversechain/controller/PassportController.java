package com.pharma.reversechain.controller;

import com.pharma.reversechain.dto.MedicinePassportResponse;
import com.pharma.reversechain.security.UserDetailsImpl;
import com.pharma.reversechain.service.PassportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/passport")
@RequiredArgsConstructor
public class PassportController {

    private final PassportService passportService;

    @GetMapping("/{trackingId}")
    public ResponseEntity<MedicinePassportResponse> getPassport(@PathVariable String trackingId, @AuthenticationPrincipal UserDetailsImpl actor) {
        return ResponseEntity.ok(passportService.getPassport(trackingId, actor.getUser()));
    }
}
