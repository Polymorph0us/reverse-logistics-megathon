package com.pharma.reversechain.controller;

import com.pharma.reversechain.entity.DenaturedBatchTag;
import com.pharma.reversechain.repository.DenaturedBatchTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/denatured")
@RequiredArgsConstructor
public class DenatureController {

    private final DenaturedBatchTagRepository denatureRepository;

    @GetMapping
    public ResponseEntity<List<DenaturedBatchTag>> getAllTags() {
        return ResponseEntity.ok(denatureRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<DenaturedBatchTag> createTag(@RequestBody DenaturedBatchTag tag) {
        if (tag.getTagId() == null || tag.getTagId().isEmpty()) {
            tag.setTagId("DNT-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4));
        }
        if (tag.getDenaturedAt() == null) {
            tag.setDenaturedAt(LocalDateTime.now());
        }
        tag.setStatus("CONFIRMED");
        return ResponseEntity.ok(denatureRepository.save(tag));
    }
}
