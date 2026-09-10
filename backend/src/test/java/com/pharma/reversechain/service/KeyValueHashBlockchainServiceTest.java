package com.pharma.reversechain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.entity.KeyValueHashEntry;
import com.pharma.reversechain.repository.KeyValueHashRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KeyValueHashBlockchainServiceTest {

    @Mock
    private KeyValueHashRepository repository;

    private ObjectMapper objectMapper;
    private KeyValueHashBlockchainService service;

    private final List<KeyValueHashEntry> mockStorage = new ArrayList<>();

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new KeyValueHashBlockchainService(repository, objectMapper);
        mockStorage.clear();
    }

    @Test
    void testRegisterBatch_CreatesGenesisHashEntry() {
        when(repository.findTopByRecordKeyOrderBySequenceNumberDesc("BATCH-100"))
                .thenReturn(Optional.empty());
        when(repository.save(any(KeyValueHashEntry.class))).thenAnswer(invocation -> {
            KeyValueHashEntry entry = invocation.getArgument(0);
            mockStorage.add(entry);
            return entry;
        });

        var result = service.registerBatch(
                "BATCH-100", "ABC12345", "MFR-01", 100, "2024-01-01", "2026-01-01"
        );

        assertTrue(result.success());
        assertNotNull(result.transactionId());
        assertNotNull(result.eventHash());

        ArgumentCaptor<KeyValueHashEntry> captor = ArgumentCaptor.forClass(KeyValueHashEntry.class);
        verify(repository).save(captor.capture());

        KeyValueHashEntry saved = captor.getValue();
        assertEquals("BATCH-100", saved.getRecordKey());
        assertEquals(1L, saved.getSequenceNumber());
        assertEquals("0000000000000000000000000000000000000000000000000000000000000000", saved.getPreviousHash());
        assertNotNull(saved.getCurrentHash());
        assertEquals("BATCH_CREATED", saved.getEventType());
    }

    @Test
    void testHashChaining_LinksSequentialEvents() {
        String batchId = "BATCH-200";

        // 1. Genesis Entry
        KeyValueHashEntry entry1 = KeyValueHashEntry.builder()
                .recordKey(batchId)
                .valueJson("{\"batchNumber\":\"XYZ\",\"status\":\"ACTIVE\"}")
                .eventType("BATCH_CREATED")
                .sequenceNumber(1L)
                .previousHash("0000000000000000000000000000000000000000000000000000000000000000")
                .currentHash(service.computeSha256("0000000000000000000000000000000000000000000000000000000000000000:{\"batchNumber\":\"XYZ\",\"status\":\"ACTIVE\"}"))
                .createdAt(LocalDateTime.now())
                .transactionId("tx-1")
                .build();

        when(repository.findTopByRecordKeyOrderBySequenceNumberDesc(batchId))
                .thenReturn(Optional.of(entry1));
        when(repository.save(any(KeyValueHashEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 2. Record Return
        var result = service.recordReturn(batchId, "RET-01", 50, "Expired", "Intact");

        assertTrue(result.success());
        ArgumentCaptor<KeyValueHashEntry> captor = ArgumentCaptor.forClass(KeyValueHashEntry.class);
        verify(repository).save(captor.capture());

        KeyValueHashEntry entry2 = captor.getValue();
        assertEquals(2L, entry2.getSequenceNumber());
        // Crucial: previousHash must match entry1's currentHash!
        assertEquals(entry1.getCurrentHash(), entry2.getPreviousHash());
        assertNotEquals(entry1.getCurrentHash(), entry2.getCurrentHash());
    }

    @Test
    void testVerifyChainIntegrity_DetectsTampering() {
        String batchId = "BATCH-300";

        KeyValueHashEntry entry1 = KeyValueHashEntry.builder()
                .recordKey(batchId)
                .valueJson("{\"status\":\"ACTIVE\"}")
                .sequenceNumber(1L)
                .previousHash("0000000000000000000000000000000000000000000000000000000000000000")
                .currentHash(service.computeSha256("0000000000000000000000000000000000000000000000000000000000000000:{\"status\":\"ACTIVE\"}"))
                .createdAt(LocalDateTime.now())
                .transactionId("tx-1")
                .build();

        KeyValueHashEntry entry2 = KeyValueHashEntry.builder()
                .recordKey(batchId)
                .valueJson("{\"status\":\"RETURN_INITIATED\"}")
                .sequenceNumber(2L)
                .previousHash(entry1.getCurrentHash())
                .currentHash(service.computeSha256(entry1.getCurrentHash() + ":{\"status\":\"RETURN_INITIATED\"}"))
                .createdAt(LocalDateTime.now())
                .transactionId("tx-2")
                .build();

        // Valid chain
        when(repository.findByRecordKeyOrderBySequenceNumberAsc(batchId))
                .thenReturn(List.of(entry1, entry2));

        assertTrue(service.verifyChainIntegrity(batchId), "Clean chain should pass integrity check");

        // Tampered entry2 valueJson
        KeyValueHashEntry tamperedEntry = KeyValueHashEntry.builder()
                .recordKey(batchId)
                .valueJson("{\"status\":\"TAMPERED_FRAUDULENT_STATUS\"}")
                .sequenceNumber(2L)
                .previousHash(entry1.getCurrentHash())
                .currentHash(entry2.getCurrentHash()) // hash doesn't match modified payload
                .createdAt(LocalDateTime.now())
                .transactionId("tx-2")
                .build();

        when(repository.findByRecordKeyOrderBySequenceNumberAsc(batchId))
                .thenReturn(List.of(entry1, tamperedEntry));

        assertFalse(service.verifyChainIntegrity(batchId), "Tampered payload must fail integrity check");
    }
}
