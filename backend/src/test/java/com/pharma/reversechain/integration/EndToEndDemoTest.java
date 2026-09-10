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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

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

    @Test
    public void testPharmacyScansPassport() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(getRetailerUser(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_RETAILER"))));

        mockMvc.perform(get("/api/passport/RP-IND-P12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingId").value("RP-IND-P12345"))
                .andExpect(jsonPath("$.currentHolderName").value("City Pharmacy"))
                .andExpect(jsonPath("$.status").value("EXPIRING_SOON"));
    }

    @Test
    public void testRecordMovement() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(getRetailerUser(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_RETAILER"))));

        String jsonPayload = """
            {
                "trackingId": "RP-IND-P12345",
                "quantityReceived": 420,
                "location": "Mumbai",
                "notes": "Moving to somewhere"
            }
        """;

        mockMvc.perform(post("/api/movement")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingId").value("RP-IND-P12345"))
                .andExpect(jsonPath("$.difference").value(0));
    }

    @Test
    public void testMedicalRepDashboard() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(getMedicalRepUser(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MEDICAL_REP"))));

        mockMvc.perform(get("/api/medical-rep/dashboard"))
                .andExpect(status().isOk());
    }
}
