package com.pharma.reversechain.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID productId;
    private String productName;
    private String genericName;
    private String brandName;
    private UUID manufacturerId;
    private String dosageForm;
    private String strength;
    private String unitType;
}
