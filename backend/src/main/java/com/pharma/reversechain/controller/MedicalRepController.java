package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.MedicinePassport;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.service.MedicalRepService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medical-rep")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MEDICAL_REP') or hasRole('ADMIN')")
public class MedicalRepController {

    private final MedicalRepService medicalRepService;

    @GetMapping("/dashboard")
    public ResponseEntity<List<MedicinePassport>> getDashboard(@AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(medicalRepService.getExpiringPassports(actor));
    }
}
