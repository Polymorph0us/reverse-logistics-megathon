package com.pharma.reversechain.dto;

import com.pharma.reversechain.entity.OrganizationType;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class OrganizationResponse {
    private UUID id;
    private String name;
    private OrganizationType type;
    private String licenseNumber;
    private String city;
    private String state;
    private Integer complianceScore;
    private Boolean active;
}
