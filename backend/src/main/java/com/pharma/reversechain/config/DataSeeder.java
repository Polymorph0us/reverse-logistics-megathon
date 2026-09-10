package com.pharma.reversechain.config;

import com.pharma.reversechain.entity.*;
import com.pharma.reversechain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final BatchRepository batchRepository;
    private final InvalidRegistryRepository invalidRegistryRepository;
    private final BatchEventRepository batchEventRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping DataSeeder.");
            return;
        }

        log.info("Seeding initial demo data...");

        // 1. Organizations
        Organization mfr1 = createOrg("PharmaCorp Inc", OrganizationType.MANUFACTURER, "MFG-1001", "Mumbai", "MH");
        Organization mfr2 = createOrg("MediLife Makers", OrganizationType.MANUFACTURER, "MFG-1002", "Pune", "MH");
        Organization dist1 = createOrg("National Distributors", OrganizationType.DISTRIBUTOR, "DIST-2001", "Delhi", "DL");
        Organization dist2 = createOrg("Regional Med Supply", OrganizationType.DISTRIBUTOR, "DIST-2002", "Bangalore", "KA");
        Organization dist3 = createOrg("West Coast Logistics", OrganizationType.DISTRIBUTOR, "DIST-2003", "Ahmedabad", "GJ");
        Organization ret1 = createOrg("City Pharmacy", OrganizationType.RETAILER, "RET-3001", "Mumbai", "MH");
        Organization ret2 = createOrg("HealthPlus Store", OrganizationType.RETAILER, "RET-3002", "Pune", "MH");
        Organization ret3 = createOrg("Corner Drugstore", OrganizationType.RETAILER, "RET-3003", "Delhi", "DL");
        Organization ret4 = createOrg("Wellness Meds", OrganizationType.RETAILER, "RET-3004", "Bangalore", "KA");
        Organization wst = createOrg("EcoWaste Disposal", OrganizationType.WASTE_FACILITY, "WST-4001", "Nagpur", "MH");
        Organization reg = createOrg("CDSCO Regulator", OrganizationType.REGULATOR, "REG-5001", "Delhi", "DL");

        mfr1 = organizationRepository.save(mfr1);
        mfr2 = organizationRepository.save(mfr2);
        dist1 = organizationRepository.save(dist1);
        dist2 = organizationRepository.save(dist2);
        dist3 = organizationRepository.save(dist3);
        ret1 = organizationRepository.save(ret1);
        ret2 = organizationRepository.save(ret2);
        ret3 = organizationRepository.save(ret3);
        ret4 = organizationRepository.save(ret4);
        wst = organizationRepository.save(wst);
        reg = organizationRepository.save(reg);
        organizationRepository.flush();

        // 2. Users
        String encodedPassword = passwordEncoder.encode("password");
        User u1 = createUser("Alice Manufacturer", "alice@pharmacorp.com", encodedPassword, Role.MANUFACTURER, mfr1.getId());
        User u2 = createUser("Bob Distributor", "bob@natdist.com", encodedPassword, Role.DISTRIBUTOR, dist1.getId());
        User u3 = createUser("Charlie Retailer", "charlie@citypharmacy.com", encodedPassword, Role.RETAILER, ret1.getId());
        User u4 = createUser("Dave Waste", "dave@ecowaste.com", encodedPassword, Role.WASTE_FACILITY, wst.getId());
        User u5 = createUser("Eve Regulator", "eve@cdsco.gov.in", encodedPassword, Role.REGULATOR, reg.getId());
        userRepository.saveAllAndFlush(List.of(u1, u2, u3, u4, u5));

        // 3. Products
        Product p1 = createProduct("Paracetamol 500mg", "Paracetamol", "Crocin", mfr1.getId(), "Tablet", "500mg", "STRIP");
        Product p2 = createProduct("Amoxicillin 250mg", "Amoxicillin", "Amoxil", mfr1.getId(), "Capsule", "250mg", "BOTTLE");
        Product p3 = createProduct("Ibuprofen 400mg", "Ibuprofen", "Brufen", mfr2.getId(), "Tablet", "400mg", "STRIP");
        Product p4 = createProduct("Cough Syrup 100ml", "Dextromethorphan", "Corex", mfr2.getId(), "Syrup", "10mg/5ml", "BOTTLE");
        Product p5 = createProduct("Vitamin C 1000mg", "Ascorbic Acid", "Limcee", mfr1.getId(), "Tablet", "1000mg", "STRIP");
        p1 = productRepository.save(p1);
        p2 = productRepository.save(p2);
        p3 = productRepository.save(p3);
        p4 = productRepository.save(p4);
        p5 = productRepository.save(p5);
        productRepository.flush();

        // 4. Batches
        Batch b1 = createBatch("BATCH-001", p1.getProductId(), mfr1.getId(), LocalDate.of(2023, 1, 1), LocalDate.of(2026, 1, 1), 1000, 500, "STRIP", BatchStatus.ACTIVE, ret1.getId(), 0, RiskLevel.LOW);
        Batch b2 = createBatch("ABC123", p2.getProductId(), mfr1.getId(), LocalDate.of(2023, 6, 1), LocalDate.now().plusDays(20), 500, 100, "BOTTLE", BatchStatus.EXPIRING_SOON, ret1.getId(), 10, RiskLevel.LOW);
        Batch b3 = createBatch("BATCH-003", p3.getProductId(), mfr2.getId(), LocalDate.of(2022, 1, 1), LocalDate.of(2024, 1, 1), 200, 200, "STRIP", BatchStatus.EXPIRED, dist1.getId(), 40, RiskLevel.MEDIUM);
        Batch b4 = createBatch("BATCH-004", p4.getProductId(), mfr2.getId(), LocalDate.of(2021, 1, 1), LocalDate.of(2023, 1, 1), 100, 100, "BOTTLE", BatchStatus.DESTROYED, mfr2.getId(), 0, RiskLevel.LOW);
        Batch b5 = createBatch("BATCH-005", p5.getProductId(), mfr1.getId(), LocalDate.of(2022, 5, 1), LocalDate.of(2024, 5, 1), 300, 300, "STRIP", BatchStatus.SCHEDULED_FOR_DESTRUCTION, mfr1.getId(), 20, RiskLevel.LOW);
        Batch b6 = createBatch("DEF98765", p2.getProductId(), mfr1.getId(), LocalDate.of(2021, 5, 1), LocalDate.of(2023, 5, 1), 200, 200, "BOTTLE", BatchStatus.DESTROYED, wst.getId(), 90, RiskLevel.CRITICAL);

        b1 = batchRepository.save(b1);
        b2 = batchRepository.save(b2);
        b3 = batchRepository.save(b3);
        b4 = batchRepository.save(b4);
        b5 = batchRepository.save(b5);
        b6 = batchRepository.save(b6);
        batchRepository.flush();

        // 5. Invalid Registry
        InvalidRegistry inv1 = new InvalidRegistry();
        inv1.setBatchNumber("BATCH-004");
        inv1.setManufacturerId(mfr2.getId());
        inv1.setManufacturingDate(LocalDate.of(2021, 1, 1));
        inv1.setExpiryDate(LocalDate.of(2023, 1, 1));
        inv1.setInvalidatedQuantity(100);
        inv1.setReason("DESTROYED_BY_FACILITY");

        InvalidRegistry inv2 = new InvalidRegistry();
        inv2.setBatchNumber("DEF98765");
        inv2.setManufacturerId(mfr1.getId());
        inv2.setManufacturingDate(LocalDate.of(2021, 5, 1));
        inv2.setExpiryDate(LocalDate.of(2023, 5, 1));
        inv2.setInvalidatedQuantity(200);
        inv2.setReason("DESTROYED_BY_FACILITY");

        invalidRegistryRepository.saveAllAndFlush(List.of(inv1, inv2));

        // 6. Initial Batch Event
        BatchEvent ev1 = new BatchEvent();
        ev1.setBatchId(b4.getBatchId());
        ev1.setEventType("DESTRUCTION_CONFIRMED");
        ev1.setNewStatus(BatchStatus.DESTROYED);
        ev1.setActor("Dave Waste");
        ev1.setOrganizationId(wst.getId());
        ev1.setRole(Role.WASTE_FACILITY);
        ev1.setHash("dummyhash12345");
        ev1.setTimestamp(LocalDateTime.now().minusDays(30));

        batchEventRepository.saveAndFlush(ev1);

        log.info("Initial demo data successfully seeded.");
    }

    private Organization createOrg(String name, OrganizationType type, String license, String city, String state) {
        Organization org = new Organization();
        org.setName(name);
        org.setType(type);
        org.setLicenseNumber(license);
        org.setCity(city);
        org.setState(state);
        org.setComplianceScore(100);
        org.setActive(true);
        return org;
    }

    private User createUser(String name, String email, String passwordHash, Role role, UUID orgId) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setRole(role);
        user.setOrganizationId(orgId);
        return user;
    }

    private Product createProduct(String name, String generic, String brand, UUID mfrId, String form, String strength, String unit) {
        Product p = new Product();
        p.setProductName(name);
        p.setGenericName(generic);
        p.setBrandName(brand);
        p.setManufacturerId(mfrId);
        p.setDosageForm(form);
        p.setStrength(strength);
        p.setUnitType(unit);
        return p;
    }

    private Batch createBatch(String num, UUID prodId, UUID mfrId, LocalDate mfgDate, LocalDate expDate, int origQty, int currQty, String unit, BatchStatus status, UUID ownerId, int risk, RiskLevel riskLevel) {
        Batch b = new Batch();
        b.setBatchNumber(num);
        b.setProductId(prodId);
        b.setManufacturerId(mfrId);
        b.setManufacturingDate(mfgDate);
        b.setExpiryDate(expDate);
        b.setOriginalQuantity(origQty);
        b.setCurrentQuantity(currQty);
        b.setUnit(unit);
        b.setCurrentStatus(status);
        b.setCurrentOwnerId(ownerId);
        b.setRiskScore(risk);
        b.setRiskLevel(riskLevel);
        b.setCreatedAt(LocalDateTime.now().minusDays(10));
        b.setVersion(0L);
        return b;
    }
}
