package com.pharma.reversechain;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.dto.*;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AllEndpointsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String retailerToken;
    private static String distributorToken;
    private static String manufacturerToken;
    private static String wasteFacilityToken;
    private static String regulatorToken;

    private static UUID sampleOrgId;
    private static UUID wasteFacilityOrgId;
    private static UUID abc123BatchId;
    private static UUID createdReturnId;
    private static UUID createdDestructionId;
    private static UUID createdCertificateId;

    @Test
    @Order(1)
    void testAuthLoginForAllRoles() throws Exception {
        // 1. Retailer
        AuthRequest req = new AuthRequest();
        req.setEmail("charlie@citypharmacy.com");
        req.setPassword("password");
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("RETAILER"))
                .andReturn();
        retailerToken = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        // 2. Distributor
        req.setEmail("bob@natdist.com");
        res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("DISTRIBUTOR"))
                .andReturn();
        distributorToken = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        // 3. Manufacturer
        req.setEmail("alice@pharmacorp.com");
        res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANUFACTURER"))
                .andReturn();
        manufacturerToken = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        // 4. Waste Facility
        req.setEmail("dave@ecowaste.com");
        res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("WASTE_FACILITY"))
                .andReturn();
        wasteFacilityToken = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        // 5. Regulator
        req.setEmail("eve@cdsco.gov.in");
        res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("REGULATOR"))
                .andReturn();
        regulatorToken = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @Order(2)
    void testDashboardAndKPIEndpoints() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBatches").exists())
                .andExpect(jsonPath("$.activeBatches").exists());

        mockMvc.perform(get("/api/dashboard/kpis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBatches").exists());
    }

    @Test
    @Order(3)
    void testOrganizationsAndProductsEndpoints() throws Exception {
        MvcResult orgsRes = mockMvc.perform(get("/api/organizations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(5))))
                .andReturn();

        JsonNode orgsJson = objectMapper.readTree(orgsRes.getResponse().getContentAsString());
        sampleOrgId = UUID.fromString(orgsJson.get(0).get("id").asText());

        for (JsonNode o : orgsJson) {
            if ("WASTE_FACILITY".equals(o.get("type").asText())) {
                wasteFacilityOrgId = UUID.fromString(o.get("id").asText());
                break;
            }
        }

        mockMvc.perform(get("/api/organizations/" + sampleOrgId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").isNotEmpty());

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))));
    }

    @Test
    @Order(4)
    void testBatchesEndpoints() throws Exception {
        // List batches
        mockMvc.perform(get("/api/batches")
                        .header("Authorization", "Bearer " + retailerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(4))));

        // Get batch by batchNumber
        MvcResult batchRes = mockMvc.perform(get("/api/batches/ABC123")
                        .header("Authorization", "Bearer " + retailerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchNumber").value("ABC123"))
                .andReturn();

        abc123BatchId = UUID.fromString(objectMapper.readTree(batchRes.getResponse().getContentAsString()).get("batchId").asText());

        // Get batch by ID
        mockMvc.perform(get("/api/batches/" + abc123BatchId)
                        .header("Authorization", "Bearer " + retailerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchNumber").value("ABC123"));

        // Get batch timeline / events for BATCH-004
        mockMvc.perform(get("/api/batches/BATCH-004/timeline")
                        .header("Authorization", "Bearer " + retailerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        // Expiring batches
        mockMvc.perform(get("/api/batches/expiring")
                        .header("Authorization", "Bearer " + retailerToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(5)
    void testVerifyBatchForSaleAndFraudDetection() throws Exception {
        // Active batch verification -> OK to sell
        VerifyBatchRequest verifyOk = new VerifyBatchRequest();
        verifyOk.setBatchNumber("BATCH-001");
        verifyOk.setLocation("Mumbai Retailer Terminal 1");

        mockMvc.perform(post("/api/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyOk)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowSale").value(true))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Destroyed batch verification -> Sale BLOCKED
        VerifyBatchRequest verifyBlocked = new VerifyBatchRequest();
        verifyBlocked.setBatchNumber("BATCH-004");
        verifyBlocked.setLocation("Delhi Pharmacy POS");

        mockMvc.perform(post("/api/batches/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyBlocked)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowSale").value(false))
                .andExpect(jsonPath("$.status").value("DESTROYED"))
                .andExpect(jsonPath("$.riskLevel").value("CRITICAL"));
    }

    @Test
    @Order(6)
    void testFullReturnLifecycle() throws Exception {
        // Step 1: Retailer initiates return of expiring batch ABC123
        ReturnInitiateRequest initReq = new ReturnInitiateRequest();
        initReq.setBatchId(abc123BatchId);
        initReq.setRequestedQuantity(50);
        initReq.setReason("EXPIRING_SOON");
        initReq.setCondition("SEALED_INTACT");
        initReq.setEvidence("ipfs://evidence-init-001");

        MvcResult initRes = mockMvc.perform(post("/api/returns")
                        .header("Authorization", "Bearer " + retailerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INITIATED"))
                .andExpect(jsonPath("$.requestedQuantity").value(50))
                .andReturn();

        createdReturnId = UUID.fromString(objectMapper.readTree(initRes.getResponse().getContentAsString()).get("returnId").asText());

        // Step 2: Distributor receives with discrepancy (45 received vs 50 expected)
        ReturnReceiveRequest distReceive = new ReturnReceiveRequest();
        distReceive.setReceivedQuantity(45);
        distReceive.setCondition("5_MISSING");
        distReceive.setEvidence("ipfs://evidence-dist-receipt");

        mockMvc.perform(post("/api/returns/" + createdReturnId + "/receive")
                        .header("Authorization", "Bearer " + distributorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(distReceive)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISCREPANCY"))
                .andExpect(jsonPath("$.difference").value(-5));

        // Step 3: Manufacturer receives returned goods
        ReturnReceiveRequest mfrReceive = new ReturnReceiveRequest();
        mfrReceive.setReceivedQuantity(45);
        mfrReceive.setCondition("DAMAGED_SEAL");
        mfrReceive.setEvidence("ipfs://evidence-mfr-receipt");

        mockMvc.perform(post("/api/returns/" + createdReturnId + "/manufacturer-receive")
                        .header("Authorization", "Bearer " + manufacturerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mfrReceive)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECEIVED_MANUFACTURER"));
    }

    @Test
    @Order(7)
    void testDestructionAndCertificateLifecycle() throws Exception {
        // Step 1: Manufacturer schedules destruction
        ScheduleDestructionRequest sched = new ScheduleDestructionRequest();
        sched.setBatchId(abc123BatchId); // Now WITH_MANUFACTURER
        sched.setQuantity(45);
        sched.setWasteFacilityId(wasteFacilityOrgId);
        sched.setScheduledDate(LocalDate.now().plusDays(2));

        MvcResult schedRes = mockMvc.perform(post("/api/destruction/schedule")
                        .header("Authorization", "Bearer " + manufacturerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sched)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.quantity").value(45))
                .andReturn();

        createdDestructionId = UUID.fromString(objectMapper.readTree(schedRes.getResponse().getContentAsString()).get("destructionId").asText());

        // Step 2: Waste Facility checks pending destructions
        mockMvc.perform(get("/api/destruction/pending")
                        .header("Authorization", "Bearer " + wasteFacilityToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        // Step 3: Waste Facility confirms destruction and uploads certificate
        ConfirmDestructionRequest confirmReq = new ConfirmDestructionRequest();
        confirmReq.setQuantityDestroyed(45);
        confirmReq.setDestructionDate(LocalDateTime.now());
        confirmReq.setCertificateHash("sha256:abc123mockcertificatedigest456");
        confirmReq.setMethod("INCINERATION_HIGH_TEMP");

        MvcResult certRes = mockMvc.perform(post("/api/destruction/" + createdDestructionId + "/certificate")
                        .header("Authorization", "Bearer " + wasteFacilityToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.blockchainTxId").isNotEmpty())
                .andExpect(jsonPath("$.certificateHash").value("sha256:abc123mockcertificatedigest456"))
                .andReturn();

        createdCertificateId = UUID.fromString(objectMapper.readTree(certRes.getResponse().getContentAsString()).get("certificateId").asText());

        // Step 4: Public certificate verification
        mockMvc.perform(get("/api/certificates/" + createdCertificateId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.certificateHash").value("sha256:abc123mockcertificatedigest456"));
    }

    @Test
    @Order(8)
    void testFraudAlertsAndRegulatorDashboard() throws Exception {
        // View fraud alerts
        mockMvc.perform(get("/api/alerts")
                        .header("Authorization", "Bearer " + regulatorToken))
                .andExpect(status().isOk());

        // Regulator dashboard
        mockMvc.perform(get("/api/regulator/dashboard")
                        .header("Authorization", "Bearer " + regulatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalManufacturers").exists())
                .andExpect(jsonPath("$.totalTrackedBatches").exists());

        // Search endpoint
        mockMvc.perform(get("/api/search?query=ABC123"))
                .andExpect(status().isOk());

        // Notifications
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + retailerToken))
                .andExpect(status().isOk());
    }
}
