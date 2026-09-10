package com.pharma.reversechain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "generic_name")
    private String genericName;

    @Column(name = "brand_name")
    private String brandName;

    @Column(name = "manufacturer_id", nullable = false)
    private UUID manufacturerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_id", insertable = false, updatable = false)
    private Organization manufacturer;

    @Column(name = "dosage_form")
    private String dosageForm;

    private String strength;

    @Column(name = "unit_type")
    private String unitType;
}
