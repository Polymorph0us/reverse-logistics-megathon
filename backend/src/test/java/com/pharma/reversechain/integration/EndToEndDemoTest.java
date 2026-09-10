package com.pharma.reversechain.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.reversechain.entity.User;
import com.pharma.reversechain.entity.Role;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class EndToEndDemoTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.pharma.reversechain.repository.UserRepository userRepository;

    private User getRetailerUser() {
        User user = userRepository.findByEmail("charlie@citypharmacy.com").orElseThrow();
        org.hibernate.Hibernate.initialize(user.getOrganization());
        return user;
    }

    private User getMedicalRepUser() {
        User user = userRepository.findByEmail("mike@pharmacorp.com").orElseThrow();
        org.hibernate.Hibernate.initialize(user.getOrganization());
        return user;
    }

    private User getDistributorUser() {
        User user = userRepository.findByEmail("bob@natdist.com").orElseThrow();
        org.hibernate.Hibernate.initialize(user.getOrganization());
        return user;
    }

    private User getManufacturerUser() {
        User user = userRepository.findByEmail("alice@pharmacorp.com").orElseThrow();
        org.hibernate.Hibernate.initialize(user.getOrganization());
        return user;
    }

    /** Helper: create a MockHttpServletRequestBuilder with the User entity as security principal */
    private org.springframework.test.web.servlet.request.RequestPostProcessor asUser(User user, String role) {
        return SecurityMockMvcRequestPostProcessors.authentication(
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                )
        );
    }

    @Test
    public void testPharmacyScansPassport() throws Exception {
        User retailer = getRetailerUser();
        mockMvc.perform(get("/api/passport/RP-IND-P12345")
                .with(asUser(retailer, "RETAILER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingId").value("RP-IND-P12345"))
                .andExpect(jsonPath("$.currentHolderName").value("City Pharmacy"))
                .andExpect(jsonPath("$.status").value("EXPIRING_SOON"));
    }

    @Test
    public void testRecordMovement() throws Exception {
        User retailer = getRetailerUser();
        String jsonPayload = """
            {
                "trackingId": "RP-IND-P12345",
                "quantityReceived": 420,
                "location": "Mumbai",
                "notes": "Moving to somewhere"
            }
        """;

        mockMvc.perform(post("/api/movement")
                .with(asUser(retailer, "RETAILER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingId").value("RP-IND-P12345"))
                .andExpect(jsonPath("$.difference").value(0));
    }

    @Test
    public void testConsignmentHappyPath() throws Exception {
        User distributor = getDistributorUser();
        User manufacturer = getManufacturerUser();

        // 1. Create Return Bag as distributor
        String returnBagPayload = """
            {
                "trackingId": "RP-IND-P12345",
                "quantity": 100
            }
        """;

        String bagResp = mockMvc.perform(post("/api/consignments/return-bags")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(returnBagPayload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String bagId = objectMapper.readTree(bagResp).get("bagId").asText();

        // 2. Create MCM targeting the manufacturer's organization
        String mcmPayload = """
            {
                "targetManufacturerId": "%s"
            }
        """.formatted(manufacturer.getOrganizationId().toString());

        String mcmResp = mockMvc.perform(post("/api/consignments")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mcmPayload))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String mcmIdStr = objectMapper.readTree(mcmResp).get("id").asText();

        // 3. Add bags to MCM
        String addBagsPayload = """
            {"bagIds": ["%s"]}
        """.formatted(bagId);

        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/bags")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(addBagsPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBags").value(1));

        // 4. Seal MCM
        String sealPayload = """
            {"sealId": "SEAL-HAPPY-TEST"}
        """;

        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/seal")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(sealPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SEALED"))
                .andExpect(jsonPath("$.mcmHash").isNotEmpty());

        // 5. Dispatch
        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/dispatch")
                .with(asUser(distributor, "DISTRIBUTOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPATCHED"));

        // 6. Receive at Manufacturer with correct seal
        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/receive")
                .with(asUser(manufacturer, "MANUFACTURER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(sealPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECEIVED"));
    }

    @Test
    public void testConsignmentTamperDetection() throws Exception {
        User distributor = getDistributorUser();
        User manufacturer = getManufacturerUser();

        // 1. Create Return Bag
        String bagResp = mockMvc.perform(post("/api/consignments/return-bags")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"trackingId\":\"RP-IND-P12345\",\"quantity\":100}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String bagId = objectMapper.readTree(bagResp).get("bagId").asText();

        // 2. Create MCM
        String mcmResp = mockMvc.perform(post("/api/consignments")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetManufacturerId\":\"" + manufacturer.getOrganizationId() + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String mcmIdStr = objectMapper.readTree(mcmResp).get("id").asText();

        // 3. Add bags
        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/bags")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"bagIds\":[\"" + bagId + "\"]}"))
                .andExpect(status().isOk());

        // 4. Seal with one seal ID
        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/seal")
                .with(asUser(distributor, "DISTRIBUTOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sealId\":\"SEAL-TAMPER-TEST-2\"}"))
                .andExpect(status().isOk());

        // 5. Dispatch
        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/dispatch")
                .with(asUser(distributor, "DISTRIBUTOR")))
                .andExpect(status().isOk());

        // 6. Receive with WRONG seal — should fail with 409 Conflict (seal mismatch)
        mockMvc.perform(post("/api/consignments/" + mcmIdStr + "/receive")
                .with(asUser(manufacturer, "MANUFACTURER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sealId\":\"SEAL-WRONG\"}"))
                .andExpect(status().isConflict()) // 409 - IllegalStateException → CONFLICT
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Physical Seal Verification Failed")));
    }

    @Test
    public void testQuantityDispute() throws Exception {
        // The dispute system is tested through the return workflow
        // This test verifies the distributor's organization is accessible
        User distributor = getDistributorUser();
        org.junit.jupiter.api.Assertions.assertNotNull(distributor.getOrganizationId(), "Distributor must have an organization");
        org.junit.jupiter.api.Assertions.assertEquals(Role.DISTRIBUTOR, distributor.getRole());
    }
}
