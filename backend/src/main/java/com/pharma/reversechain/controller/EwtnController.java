package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.ElectronicWasteTransferNote;
import com.pharma.reversechain.repository.ElectronicWasteTransferNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ewtn")
@RequiredArgsConstructor
public class EwtnController {

    private final ElectronicWasteTransferNoteRepository ewtnRepository;

    @GetMapping
    public ResponseEntity<List<ElectronicWasteTransferNote>> getAllEwtns() {
        return ResponseEntity.ok(ewtnRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<ElectronicWasteTransferNote> createEwtn(@RequestBody ElectronicWasteTransferNote ewtn) {
        if (ewtn.getEwtnId() == null || ewtn.getEwtnId().isEmpty()) {
            ewtn.setEwtnId("EWTN-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }
        if (ewtn.getCreatedAt() == null) {
            ewtn.setCreatedAt(LocalDateTime.now());
        }
        ewtn.setStatus("SCHEDULED");
        return ResponseEntity.ok(ewtnRepository.save(ewtn));
    }
}
