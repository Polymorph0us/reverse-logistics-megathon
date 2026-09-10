package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.MedicinePassport;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.repository.MedicinePassportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRepService {

    private final MedicinePassportRepository passportRepository;

    public List<MedicinePassport> getExpiringPassports(User actor) {
        // Find all passports that are expiring soon and belong to the same manufacturer
        return passportRepository.findAll().stream()
                .filter(p -> p.getManufacturerId().equals(actor.getOrganizationId()))
                .filter(p -> "EXPIRING_SOON".equals(p.getStatus()) || "ACTIVE".equals(p.getStatus()))
                .collect(Collectors.toList());
    }
}
