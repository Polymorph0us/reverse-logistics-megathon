import type { BatchPassport, FraudAlert, ReturnRequest, DestructionCertificate } from "@/api/types";

export const SEED_BATCHES: BatchPassport[] = [
  {
    batchId: "BATCH-2026-00123",
    product: { productId: "PROD-01", name: "Augmentin 625 Duo", genericName: "Amoxicillin and Potassium Clavulanate", manufacturer: "GSK" },
    batchNumber: "ABC12345",
    manufacturingDate: "2024-01-10T00:00:00Z",
    expiryDate: "2026-09-30T00:00:00Z",
    currentStatus: "EXPIRING_SOON",
    currentQuantity: 100,
    originalQuantity: 1000,
    unit: "STRIPS",
    currentOwner: { organizationId: "ORG-001", organizationName: "Raj Pharmacy (Jaipur)", role: "RETAILER" },
    riskLevel: "LOW",
    riskScore: 10,
    timeline: [
      { eventId: "E1", eventType: "BATCH_CREATED", status: "COMPLETED", timestamp: "2024-01-10T10:00:00Z", actor: "Manufacturer" }
    ]
  },
  {
    batchId: "BATCH-2026-00124",
    product: { productId: "PROD-02", name: "Dolo 650", genericName: "Paracetamol", manufacturer: "Micro Labs" },
    batchNumber: "DEF98765",
    manufacturingDate: "2023-05-15T00:00:00Z",
    expiryDate: "2025-05-15T00:00:00Z",
    currentStatus: "DESTROYED",
    currentQuantity: 0,
    originalQuantity: 500,
    unit: "STRIPS",
    currentOwner: { organizationId: "ORG-004", organizationName: "EcoWaste Management", role: "WASTE_FACILITY" },
    riskLevel: "LOW",
    riskScore: 0,
    timeline: [
      { eventId: "E2", eventType: "DESTRUCTION_COMPLETED", status: "COMPLETED", timestamp: "2025-06-01T14:30:00Z", actor: "Waste Facility", quantity: 50 }
    ]
  },
  {
    batchId: "BATCH-2026-00125",
    product: { productId: "PROD-03", name: "Azithral 500", genericName: "Azithromycin", manufacturer: "Alembic" },
    batchNumber: "XYZ3344",
    manufacturingDate: "2022-11-20T00:00:00Z",
    expiryDate: "2024-11-20T00:00:00Z",
    currentStatus: "EXPIRED",
    currentQuantity: 50,
    originalQuantity: 200,
    unit: "STRIPS",
    currentOwner: { organizationId: "ORG-001", organizationName: "Raj Pharmacy (Jaipur)", role: "RETAILER" },
    riskLevel: "MEDIUM",
    riskScore: 40,
    timeline: [
      { eventId: "E3", eventType: "EXPIRY_ALERT", status: "COMPLETED", timestamp: "2024-09-20T10:00:00Z", actor: "System" }
    ]
  },
  {
    batchId: "BATCH-2026-00126",
    product: { productId: "PROD-04", name: "Allegra 120", genericName: "Fexofenadine", manufacturer: "Sanofi" },
    batchNumber: "ALLG456",
    manufacturingDate: "2024-02-12T00:00:00Z",
    expiryDate: "2026-02-12T00:00:00Z",
    currentStatus: "RETURN_INITIATED",
    currentQuantity: 30,
    originalQuantity: 300,
    unit: "STRIPS",
    currentOwner: { organizationId: "ORG-001", organizationName: "Raj Pharmacy (Jaipur)", role: "RETAILER" },
    riskLevel: "LOW",
    riskScore: 5,
    timeline: [
      { eventId: "E4", eventType: "RETURN_INITIATED", status: "COMPLETED", timestamp: "2024-10-01T08:30:00Z", actor: "Raj Pharmacy", quantity: 30 }
    ]
  },
  {
    batchId: "BATCH-2026-00127",
    product: { productId: "PROD-05", name: "Pan 40", genericName: "Pantoprazole", manufacturer: "Alkem" },
    batchNumber: "PAN8899",
    manufacturingDate: "2024-06-01T00:00:00Z",
    expiryDate: "2026-06-01T00:00:00Z",
    currentStatus: "ACTIVE",
    currentQuantity: 500,
    originalQuantity: 500,
    unit: "STRIPS",
    currentOwner: { organizationId: "ORG-002", organizationName: "ABC Distributors Ltd", role: "DISTRIBUTOR" },
    riskLevel: "LOW",
    riskScore: 0,
    timeline: [
      { eventId: "E5", eventType: "BATCH_CREATED", status: "COMPLETED", timestamp: "2024-06-01T08:00:00Z", actor: "Alkem" }
    ]
  },
  {
    batchId: "BATCH-2026-00128",
    product: { productId: "PROD-06", name: "Calpol 500", genericName: "Paracetamol", manufacturer: "GSK" },
    batchNumber: "CAL2211",
    manufacturingDate: "2022-01-10T00:00:00Z",
    expiryDate: "2024-01-10T00:00:00Z",
    currentStatus: "SCHEDULED_FOR_DESTRUCTION",
    currentQuantity: 120,
    originalQuantity: 1000,
    unit: "BOTTLES",
    currentOwner: { organizationId: "ORG-003", organizationName: "Sun Pharmaceutical Industries", role: "MANUFACTURER" },
    riskLevel: "LOW",
    riskScore: 0,
    timeline: [
      { eventId: "E6", eventType: "DESTRUCTION_SCHEDULED", status: "COMPLETED", timestamp: "2024-02-15T09:00:00Z", actor: "Manufacturer" }
    ]
  },
  {
    batchId: "BATCH-2026-00129",
    product: { productId: "PROD-07", name: "Thyronorm 50", genericName: "Thyroxine", manufacturer: "Abbott" },
    batchNumber: "THY7766",
    manufacturingDate: "2023-08-20T00:00:00Z",
    expiryDate: "2025-08-20T00:00:00Z",
    currentStatus: "ACTIVE",
    currentQuantity: 50,
    originalQuantity: 50,
    unit: "STRIPS",
    currentOwner: { organizationId: "ORG-001", organizationName: "Raj Pharmacy (Jaipur)", role: "RETAILER" },
    riskLevel: "LOW",
    riskScore: 0,
    timeline: [
      { eventId: "E7", eventType: "BATCH_CREATED", status: "COMPLETED", timestamp: "2023-08-20T08:00:00Z", actor: "Abbott" }
    ]
  },
];

export const SEED_ALERTS: FraudAlert[] = [
  {
    alertId: "ALT-001",
    type: "DESTROYED_BATCH_REENTRY",
    severity: "CRITICAL",
    batchId: "BATCH-2026-00124",
    batchNumber: "DEF98765",
    detectedAt: new Date(Date.now() - 86400000).toISOString(),
    location: "Mumbai POS Terminal 3",
    organization: "Unknown Retailer",
    message: "Attempted sale of a destroyed batch (DEF98765) detected at POS.",
  },
  {
    alertId: "ALT-002",
    type: "QUANTITY_MISMATCH",
    severity: "HIGH",
    batchId: "BATCH-2026-00123",
    batchNumber: "ABC12345",
    detectedAt: new Date(Date.now() - 172800000).toISOString(),
    location: "ABC Distributors Warehouse",
    organization: "ABC Distributors Ltd",
    message: "Discrepancy of 6 units reported during return receipt.",
  }
];

export const SEED_RETURNS: ReturnRequest[] = [
  {
    returnId: "RET-7281",
    batchId: "BATCH-2026-00123",
    batchNumber: "ABC12345",
    productName: "Augmentin 625 Duo",
    requestedQuantity: 100,
    status: "AWAITING_DISTRIBUTOR",
    initiatedBy: "Raj Pharmacy (Jaipur)",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    pickupStatus: "PENDING"
  }
];

export const SEED_DESTRUCTIONS: DestructionCertificate[] = [];

export const MOCK_USERS = {
  RETAILER: {
    id: "USR-001",
    name: "Raj Pharmacy",
    email: "raj@pharmacy.in",
    role: "RETAILER",
    organizationId: "ORG-001",
    organizationName: "Raj Pharmacy (Jaipur)",
  },
  DISTRIBUTOR: {
    id: "USR-002",
    name: "ABC Distributors",
    email: "admin@abcdistributors.in",
    role: "DISTRIBUTOR",
    organizationId: "ORG-002",
    organizationName: "ABC Distributors Ltd",
  },
  MANUFACTURER: {
    id: "USR-003",
    name: "Sun Pharma",
    email: "admin@sunpharma.in",
    role: "MANUFACTURER",
    organizationId: "ORG-003",
    organizationName: "Sun Pharmaceutical Industries",
  },
  WASTE_FACILITY: {
    id: "USR-004",
    name: "EcoWaste Management",
    email: "admin@ecowaste.in",
    role: "WASTE_FACILITY",
    organizationId: "ORG-004",
    organizationName: "EcoWaste Management",
  },
  REGULATOR: {
    id: "USR-005",
    name: "CDSCO Inspector",
    email: "inspector@cdsco.gov.in",
    role: "REGULATOR",
    organizationId: "ORG-005",
    organizationName: "CDSCO (Central)",
  },
  ADMIN: {
    id: "USR-006",
    name: "System Admin",
    email: "admin@platform.in",
    role: "ADMIN",
    organizationId: "ORG-006",
    organizationName: "Platform Administration",
  },
};
