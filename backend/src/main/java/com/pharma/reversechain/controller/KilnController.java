package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.IncinerationLog;
import com.pharma.reversechain.entity.FinalIncinerationRecord;
import com.pharma.reversechain.repository.IncinerationLogRepository;
import com.pharma.reversechain.repository.FinalIncinerationRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/kiln")
@RequiredArgsConstructor
public class KilnController {

    private final IncinerationLogRepository logRepository;
    private final FinalIncinerationRecordRepository recordRepository;

    @GetMapping("/incineration-logs")
    public ResponseEntity<List<IncinerationLog>> getLogs() {
        return ResponseEntity.ok(logRepository.findAll());
    }

    @PostMapping("/incineration-logs")
    public ResponseEntity<IncinerationLog> createLog(@RequestBody IncinerationLog log) {
        if (log.getLogId() == null || log.getLogId().isEmpty()) {
            log.setLogId("ILOG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (log.getRecordedAt() == null) {
            log.setRecordedAt(LocalDateTime.now());
        }
        return ResponseEntity.ok(logRepository.save(log));
    }

    @GetMapping("/records")
    public ResponseEntity<List<FinalIncinerationRecord>> getRecords() {
        return ResponseEntity.ok(recordRepository.findAll());
    }

    @PostMapping("/run")
    public ResponseEntity<FinalIncinerationRecord> runKiln(@RequestBody FinalIncinerationRecord record) {
        if (record.getRecordId() == null || record.getRecordId().isEmpty()) {
            record.setRecordId("FIR-" + LocalDateTime.now().getYear() + "-CBWTF-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase());
        }
        if (record.getCompletedAt() == null) {
            record.setCompletedAt(LocalDateTime.now());
        }
        record.setStatus("COMPLETED");
        return ResponseEntity.ok(recordRepository.save(record));
    }
}
