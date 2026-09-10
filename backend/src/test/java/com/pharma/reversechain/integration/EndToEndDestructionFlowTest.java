package com.pharma.reversechain.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.dto.ConfirmDestructionRequest;
import com.pharma.reversechain.dto.VerifyBatchRequest;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EndToEndDestructionFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private DestructionRecordRepository destructionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ProductRepository productRepository;

    private UUID facilityUserId;
    private UUID batchId;
    private String batchNumber = "E2E-BATCH-001";
    private UUID destructionId;

    @BeforeEach
    public void setup() {
        Organization manufacturer = organizationRepository.findAll().stream().filter(o -> o.getType() == OrganizationType.MANUFACTURER).findFirst().orElseThrow();
        Organization wasteFacility = organizationRepository.findAll().stream().filter(o -> o.getType() == OrganizationType.WASTE_FACILITY).findFirst().orElseThrow();
        Product product = productRepository.findAll().stream().findFirst().orElseThrow();

        // Setup Waste Facility User
        User facilityUser = userRepository.findByEmail("waste@pharma.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("waste@pharma.com");
            u.setName("Waste Facility User");
            u.setOrganizationId(wasteFacility.getId());
            u.setRole(Role.WASTE_FACILITY);
            u.setPasswordHash("pass");
            return userRepository.save(u);
        });
        facilityUserId = facilityUser.getId();

        // Setup Batch in SCHEDULED_FOR_DESTRUCTION state
        Batch batch = new Batch();
        batch.setBatchNumber(batchNumber);
        batch.setCurrentStatus(BatchStatus.SCHEDULED_FOR_DESTRUCTION);
        batch.setOriginalQuantity(100);
        batch.setCurrentQuantity(100);
        batch.setManufacturingDate(LocalDate.now().minusMonths(6));
        batch.setExpiryDate(LocalDate.now().plusMonths(6));
        batch.setManufacturerId(manufacturer.getId());
        batch.setProductId(product.getProductId());
        batch.setUnit("BOX");
        batch = batchRepository.save(batch);
        batchId = batch.getBatchId();

        // Setup Destruction Record
        DestructionRecord record = new DestructionRecord();
        record.setBatchId(batchId);
        record.setQuantity(100);
        record.setStatus(DestructionStatus.SCHEDULED);
        record.setWasteFacilityId(facilityUser.getOrganizationId());
        record.setScheduledDate(LocalDate.now());
        record = destructionRepository.save(record);
        destructionId = record.getDestructionId();
    }

    @Test
    @org.springframework.security.test.context.support.WithUserDetails(
        value = "waste@pharma.com", 
        userDetailsServiceBeanName = "userDetailsServiceImpl",
        setupBefore = org.springframework.security.test.context.support.TestExecutionEvent.TEST_EXECUTION
    )
    public void testFullDestructionAndReEntryFlow() throws Exception {
        // Step 1: Confirm Destruction
        ConfirmDestructionRequest confirmReq = new ConfirmDestructionRequest();
        confirmReq.setQuantityDestroyed(100);
        confirmReq.setDestructionDate(LocalDateTime.now());
        confirmReq.setDestructionMethod("Incineration");
        confirmReq.setFacilityLicense("FAC-12345");

        mockMvc.perform(post("/api/destruction/" + destructionId + "/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.certificateId").exists())
                .andExpect(jsonPath("$.status").value("VERIFIED"));

        // Step 2: Re-entry attempt (Verify Batch)
        VerifyBatchRequest verifyReq = new VerifyBatchRequest();
        verifyReq.setBatchNumber(batchNumber);
        verifyReq.setLocation("Retail Pharmacy A");

        mockMvc.perform(post("/api/batches/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowSale").value(false))
                .andExpect(jsonPath("$.status").value("DESTROYED"))
                .andExpect(jsonPath("$.message").value("SALE BLOCKED: BATCH PREVIOUSLY DESTROYED. CDSCO and Manufacturer have been alerted."));
    }
}
