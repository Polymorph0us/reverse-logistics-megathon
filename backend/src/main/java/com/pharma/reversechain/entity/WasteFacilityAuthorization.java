package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "waste_facility_authorizations")
@Data
@NoArgsConstructor
public class WasteFacilityAuthorization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "facility_id", nullable = false)
    private UUID facilityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", insertable = false, updatable = false)
    private Organization facility;

    @Column(name = "spcb_authorization_id", nullable = false)
    private String spcbAuthorizationId;

    @Column(name = "cbwtf_license_number", nullable = false)
    private String cbwtfLicenseNumber;

    @Column(name = "authorizing_authority", nullable = false)
    private String authorizingAuthority;

    @Column(name = "authorization_valid_from", nullable = false)
    private LocalDate authorizationValidFrom;

    @Column(name = "authorization_valid_to", nullable = false)
    private LocalDate authorizationValidTo;
    
    public boolean isValid() {
        LocalDate now = LocalDate.now();
        return !now.isBefore(authorizationValidFrom) && !now.isAfter(authorizationValidTo);
    }
}
