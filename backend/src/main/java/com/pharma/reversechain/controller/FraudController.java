package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.FraudAlert;
import com.pharma.reversechain.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fraud")
@RequiredArgsConstructor
public class FraudController {

    private final FraudAlertRepository fraudAlertRepository;

    @GetMapping("/alerts")
    public Page<FraudAlert> getAlerts(Pageable pageable) {
        return fraudAlertRepository.findAll(pageable);
    }
}
