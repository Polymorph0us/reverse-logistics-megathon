package com.pharma.reversechain.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-End ReversePass Integration Test
 * 
 * Tests the complete reverse pharmaceutical logistics flow:
 * Passport Scan → Return → TER-Bag → MCM → Seal → Dispatch → Receive → Verify
 * 
 * Also tests failure paths:
 * - Duplicate bag consolidation (409)
 * - Seal mismatch (409)
 * - Authorization failure (403)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class EndToEndReversePassTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReturnBagRepository returnBagRepository;

    @Autowired
    private MasterConsignmentRepository consignmentRepository;

    @Autowired
    private ConsignmentItemRepository consignmentItemRepository;

    @Autowired
    private DisputeRepository disputeRepository;

    private User user(String email) {
        User u = userRepository.findByEmail(email).orElseThrow(
                () -> new IllegalStateException("Test user not found: " + email));
        if (u.getOrganization() != null) {
            u.getOrganization().getName(); // init lazy proxy
        }
        return u;
    }

    private RequestPostProcessor as(User user, String role) {
        return SecurityMockMvcRequestPostProcessors.authentication(
                new UsernamePasswordAuthenticationToken(user, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    private String responseAsString(String url, RequestPostProcessor auth) throws Exception {
        return mockMvc.perform(get(url).with(auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private String post(String url, String body, RequestPostProcessor auth) throws Exception {
        return mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url)
                        .with(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    // ─────────────────────────────────────────────
    // HAPPY PATH: Full reverse logistics flow
    // ─────────────────────────────────────────────

    @Test
    public void testFullReverseLogisticsFlow() throws Exception {
        User retailer  = user("charlie@citypharmacy.com");
        User distrib   = user("bob@natdist.com");
        User mfr       = user("alice@pharmacorp.com");

        // ── Step 1: Retailer scans Medicine Passport ──
        String passportJson = responseAsString("/api/passport/RP-IND-P12345", as(retailer, "RETAILER"));
        JsonNode passport = objectMapper.readTree(passportJson);
        assertThat(passport.get("trackingId").asText()).isEqualTo("RP-IND-P12345");
        assertThat(passport.get("status").asText()).isIn("EXPIRING_SOON", "ACTIVE", "EXPIRED");
        String trackingId = passport.get("trackingId").asText();

        // ── Step 2: Distributor creates TER-Bag (representing received return) ──
        String bagJson = post("/api/consignments/return-bags",
                "{\"trackingId\":\"" + trackingId + "\",\"quantity\":100}",
                as(distrib, "DISTRIBUTOR"));
        JsonNode bag = objectMapper.readTree(bagJson);
        String bagId = bag.get("bagId").asText();

        assertThat(bagId).startsWith("TER-");
        assertThat(bag.get("status").asText()).isEqualTo("CREATED");

        // Verify TER-Bag was persisted to DB
        ReturnBag bagEntity = returnBagRepository.findByBagId(bagId).orElseThrow();
        assertThat(bagEntity.getQuantity()).isEqualTo(100);
        assertThat(bagEntity.getTrackingId()).isEqualTo(trackingId);

        // ── Step 3: Create MCM targeting manufacturer ──
        String mcmJson = post("/api/consignments",
                "{\"targetManufacturerId\":\"" + mfr.getOrganizationId() + "\"}",
                as(distrib, "DISTRIBUTOR"));
        JsonNode mcm = objectMapper.readTree(mcmJson);
        String mcmId = mcm.get("id").asText();
        String mcmCode = mcm.get("mcmId").asText();

        assertThat(mcmCode).startsWith("MCM-");
        assertThat(mcm.get("status").asText()).isEqualTo("OPEN");
        assertThat(mcm.get("totalBags").asInt()).isEqualTo(0);

        // ── Step 4: Add TER-Bag to MCM ──
        String afterAdd = post("/api/consignments/" + mcmId + "/bags",
                "{\"bagIds\":[\"" + bagId + "\"]}",
                as(distrib, "DISTRIBUTOR"));
        JsonNode mcmAfterAdd = objectMapper.readTree(afterAdd);
        assertThat(mcmAfterAdd.get("totalBags").asInt()).isEqualTo(1);
        assertThat(mcmAfterAdd.get("totalQuantity").asInt()).isEqualTo(100);

        // Verify bag status updated
        bagEntity = returnBagRepository.findByBagId(bagId).orElseThrow();
        assertThat(bagEntity.getStatus()).isEqualTo(ReturnBagStatus.CONSOLIDATED);

        // Verify ConsignmentItem was created
        List<ConsignmentItem> items = consignmentItemRepository.findByMcmId(UUID.fromString(mcmId));
        assertThat(items).hasSize(1);

        // ── Step 5: Seal MCM (generates deterministic SHA-256 hash) ──
        String sealId = "SEAL-E2E-TEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String afterSeal = post("/api/consignments/" + mcmId + "/seal",
                "{\"sealId\":\"" + sealId + "\"}",
                as(distrib, "DISTRIBUTOR"));
        JsonNode mcmSealed = objectMapper.readTree(afterSeal);
        assertThat(mcmSealed.get("status").asText()).isEqualTo("SEALED");
        String mcmHash = mcmSealed.get("mcmHash").asText();
        assertThat(mcmHash).isNotBlank();

        // ── Step 6: Verify MCM hash (integrity check) ──
        String verifyJson = responseAsString("/api/consignments/" + mcmId + "/verify", as(distrib, "DISTRIBUTOR"));
        JsonNode verify = objectMapper.readTree(verifyJson);
        assertThat(verify.get("hashMatch").asBoolean()).isTrue();
        assertThat(verify.get("storedHash").asText()).isEqualTo(mcmHash);

        // ── Step 7: Dispatch ──
        String afterDispatch = post("/api/consignments/" + mcmId + "/dispatch",
                "",
                as(distrib, "DISTRIBUTOR"));
        JsonNode mcmDispatched = objectMapper.readTree(afterDispatch);
        assertThat(mcmDispatched.get("status").asText()).isEqualTo("DISPATCHED");

        // Verify bags are IN_TRANSIT
        bagEntity = returnBagRepository.findByBagId(bagId).orElseThrow();
        assertThat(bagEntity.getStatus()).isEqualTo(ReturnBagStatus.IN_TRANSIT);

        // ── Step 8: Manufacturer receives with correct seal ──
        String afterReceive = post("/api/consignments/" + mcmId + "/receive",
                "{\"sealId\":\"" + sealId + "\"}",
                as(mfr, "MANUFACTURER"));
        JsonNode mcmReceived = objectMapper.readTree(afterReceive);
        assertThat(mcmReceived.get("status").asText()).isEqualTo("RECEIVED");

        // Verify bags are now with manufacturer
        bagEntity = returnBagRepository.findByBagId(bagId).orElseThrow();
        assertThat(bagEntity.getStatus()).isEqualTo(ReturnBagStatus.RECEIVED);
        assertThat(bagEntity.getCurrentOrganizationId()).isEqualTo(mfr.getOrganizationId());

        // Verify final MCM DB state
        MasterConsignment mcmEntity = consignmentRepository.findById(UUID.fromString(mcmId)).orElseThrow();
        assertThat(mcmEntity.getStatus()).isEqualTo(ConsignmentStatus.RECEIVED);
        assertThat(mcmEntity.getReceivedAt()).isNotNull();
        assertThat(mcmEntity.getMcmHash()).isEqualTo(mcmHash);
    }

    // ─────────────────────────────────────────────
    // FAILURE PATH: Seal mismatch → COMPROMISED
    // ─────────────────────────────────────────────

    @Test
    public void testSealMismatchLeadsToCompromised() throws Exception {
        User distrib = user("bob@natdist.com");
        User mfr     = user("alice@pharmacorp.com");

        // Create bag, MCM, add bag, seal, dispatch
        String bagJson = post("/api/consignments/return-bags",
                "{\"trackingId\":\"RP-IND-P12345\",\"quantity\":50}",
                as(distrib, "DISTRIBUTOR"));
        String bagId = objectMapper.readTree(bagJson).get("bagId").asText();

        String mcmJson = post("/api/consignments",
                "{\"targetManufacturerId\":\"" + mfr.getOrganizationId() + "\"}",
                as(distrib, "DISTRIBUTOR"));
        String mcmId = objectMapper.readTree(mcmJson).get("id").asText();

        post("/api/consignments/" + mcmId + "/bags",
                "{\"bagIds\":[\"" + bagId + "\"]}",
                as(distrib, "DISTRIBUTOR"));

        post("/api/consignments/" + mcmId + "/seal",
                "{\"sealId\":\"SEAL-CORRECT\"}",
                as(distrib, "DISTRIBUTOR"));

        post("/api/consignments/" + mcmId + "/dispatch", "", as(distrib, "DISTRIBUTOR"));

        // Attempt to receive with WRONG seal
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/consignments/" + mcmId + "/receive")
                        .with(as(mfr, "MANUFACTURER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sealId\":\"SEAL-WRONG\"}"))
                .andExpect(status().isConflict())  // 409 - IllegalStateException
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Seal Verification")));

        // Verify MCM is now COMPROMISED
        MasterConsignment entity = consignmentRepository.findById(UUID.fromString(mcmId)).orElseThrow();
        assertThat(entity.getStatus()).isEqualTo(ConsignmentStatus.COMPROMISED);
    }

    // ─────────────────────────────────────────────
    // FAILURE PATH: Duplicate bag consolidation
    // ─────────────────────────────────────────────

    @Test
    public void testDuplicateBagConsolidationRejected() throws Exception {
        User distrib = user("bob@natdist.com");
        User mfr     = user("alice@pharmacorp.com");

        // Create bag
        String bagJson = post("/api/consignments/return-bags",
                "{\"trackingId\":\"RP-IND-P12345\",\"quantity\":30}",
                as(distrib, "DISTRIBUTOR"));
        String bagId = objectMapper.readTree(bagJson).get("bagId").asText();

        // MCM #1
        String mcm1Json = post("/api/consignments",
                "{\"targetManufacturerId\":\"" + mfr.getOrganizationId() + "\"}",
                as(distrib, "DISTRIBUTOR"));
        String mcm1Id = objectMapper.readTree(mcm1Json).get("id").asText();

        // MCM #2
        String mcm2Json = post("/api/consignments",
                "{\"targetManufacturerId\":\"" + mfr.getOrganizationId() + "\"}",
                as(distrib, "DISTRIBUTOR"));
        String mcm2Id = objectMapper.readTree(mcm2Json).get("id").asText();

        // Add bag to MCM #1 (succeeds)
        post("/api/consignments/" + mcm1Id + "/bags",
                "{\"bagIds\":[\"" + bagId + "\"]}",
                as(distrib, "DISTRIBUTOR"));

        // Try to add same bag to MCM #2 (should fail with 409)
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/consignments/" + mcm2Id + "/bags")
                        .with(as(distrib, "DISTRIBUTOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bagIds\":[\"" + bagId + "\"]}"))
                .andExpect(status().isConflict()); // 409 - already consolidated
    }

    // ─────────────────────────────────────────────
    // FAILURE PATH: Unauthorized organization access
    // ─────────────────────────────────────────────

    @Test
    public void testUnauthorizedOrganizationCannotReceiveMCM() throws Exception {
        User distrib    = user("bob@natdist.com");
        User mfr        = user("alice@pharmacorp.com");
        User wrongMfr   = user("mike@pharmacorp.com"); // MedRep, same org but different role

        // Setup and dispatch MCM
        String bagJson = post("/api/consignments/return-bags",
                "{\"trackingId\":\"RP-IND-P12345\",\"quantity\":20}",
                as(distrib, "DISTRIBUTOR"));
        String bagId = objectMapper.readTree(bagJson).get("bagId").asText();

        String mcmJson = post("/api/consignments",
                "{\"targetManufacturerId\":\"" + mfr.getOrganizationId() + "\"}",
                as(distrib, "DISTRIBUTOR"));
        String mcmId = objectMapper.readTree(mcmJson).get("id").asText();

        post("/api/consignments/" + mcmId + "/bags",
                "{\"bagIds\":[\"" + bagId + "\"]}",
                as(distrib, "DISTRIBUTOR"));

        post("/api/consignments/" + mcmId + "/seal",
                "{\"sealId\":\"SEAL-AUTH-TEST\"}",
                as(distrib, "DISTRIBUTOR"));

        post("/api/consignments/" + mcmId + "/dispatch", "", as(distrib, "DISTRIBUTOR"));

        // Distributor tries to receive (not authorized to receive — only MANUFACTURER role allowed)
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/consignments/" + mcmId + "/receive")
                        .with(as(distrib, "DISTRIBUTOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sealId\":\"SEAL-AUTH-TEST\"}"))
                .andExpect(status().isForbidden()); // 403
    }

    // ─────────────────────────────────────────────
    // FAILURE PATH: Invalid state transition
    // ─────────────────────────────────────────────

    @Test
    public void testCannotDispatchUnsealedMCM() throws Exception {
        User distrib = user("bob@natdist.com");
        User mfr     = user("alice@pharmacorp.com");

        // Create MCM but don't seal it
        String mcmJson = post("/api/consignments",
                "{\"targetManufacturerId\":\"" + mfr.getOrganizationId() + "\"}",
                as(distrib, "DISTRIBUTOR"));
        String mcmId = objectMapper.readTree(mcmJson).get("id").asText();

        // Try to dispatch unsealed MCM
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/consignments/" + mcmId + "/dispatch")
                        .with(as(distrib, "DISTRIBUTOR")))
                .andExpect(status().isConflict()); // 409 - cannot dispatch unsealed
    }
}
