import type {
  LoginResponse,
  DashboardKPIs,
  BatchPassport,
  ReturnRequest,
  ReceiveReturnResponse,
  DestructionCertificate,
  FraudAlert,
  BatchVerifyResponse,
  RegulatorDashboard,
  Notification,
} from "./types";

// Helper for simulated network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// =======================
// DUMMY DATA
// =======================
const mockUsers = {
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

const DUMMY_BATCHES: BatchPassport[] = [
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
];

// =======================
// MOCK API LAYER
// =======================

// TODO: replace with real API call to POST /api/auth/login
export const login = async (role: keyof typeof mockUsers): Promise<LoginResponse> => {
  await delay(500);
  return {
    token: "mock-jwt-token-123",
    user: mockUsers[role] as any,
  };
};

// TODO: replace with real API call to GET /api/dashboard/kpis
export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
  await delay(600);
  return {
    totalBatches: 15420,
    activeBatches: 14000,
    expiringSoon: 420,
    expired: 100,
    returnsPending: 45,
    inTransit: 25,
    awaitingDestruction: 12,
    destroyed: 818,
    fraudAlerts: 3,
    criticalAlerts: 1,
  };
};

// TODO: replace with real API call to GET /api/regulator/dashboard
export const getRegulatorDashboard = async (): Promise<RegulatorDashboard> => {
  await delay(400);
  return {
    totalManufacturers: 120,
    totalDistributors: 450,
    totalRetailers: 5200,
    totalTrackedBatches: 1542000,
    expiredBatches: 4200,
    returnsInProgress: 120,
    destroyedBatches: 5400,
    fraudAlerts: 14,
    criticalAlerts: 3,
    openInvestigations: 2,
  };
};

// TODO: replace with real API call to GET /api/batches
export const getBatches = async (): Promise<BatchPassport[]> => {
  await delay(700);
  return DUMMY_BATCHES;
};

// TODO: replace with real API call to GET /api/batches/:batchId
export const getBatchPassport = async (batchId: string): Promise<BatchPassport> => {
  await delay(500);
  return DUMMY_BATCHES.find(b => b.batchId === batchId) || DUMMY_BATCHES[0];
};

// TODO: replace with real API call to POST /api/returns
export const createReturn = async (batchId: string, quantity: number, reason: string): Promise<ReturnRequest> => {
  await delay(800);
  const batch = DUMMY_BATCHES.find(b => b.batchId === batchId);
  return {
    returnId: "RET-" + Math.floor(Math.random() * 10000),
    batchId,
    batchNumber: batch?.batchNumber || "ABC12345",
    productName: batch?.product.name || "Unknown Product",
    requestedQuantity: quantity,
    status: "AWAITING_DISTRIBUTOR",
    initiatedBy: "Raj Pharmacy (Jaipur)",
    createdAt: new Date().toISOString(),
    pickupStatus: "PENDING",
  };
};

// TODO: replace with real API call to POST /api/returns/:returnId/receive
export const receiveReturn = async (returnId: string, receivedQuantity: number, expectedQuantity: number = 100): Promise<ReceiveReturnResponse> => {
  await delay(600);
  const difference = expectedQuantity - receivedQuantity;
  return {
    returnId,
    expectedQuantity,
    receivedQuantity,
    difference,
    reconciliationStatus: difference === 0 ? "MATCHED" : "DISCREPANCY",
    riskLevel: difference > 0 ? "HIGH" : "LOW",
    status: "RECEIVED",
  };
};

// TODO: replace with real API call to GET /api/alerts
export const getFraudAlerts = async (): Promise<FraudAlert[]> => {
  await delay(400);
  return [
    {
      alertId: "ALT-001",
      type: "DESTROYED_BATCH_REENTRY",
      severity: "CRITICAL",
      batchId: "BATCH-2026-00124",
      batchNumber: "DEF98765",
      detectedAt: new Date().toISOString(),
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
      detectedAt: new Date().toISOString(),
      location: "ABC Distributors Warehouse",
      organization: "ABC Distributors Ltd",
      message: "Discrepancy of 6 units reported during return receipt.",
    }
  ];
};

// TODO: replace with real API call to POST /api/verify
export const verifyBatchForSale = async (batchNumber: string): Promise<BatchVerifyResponse> => {
  await delay(800);
  
  if (batchNumber.toUpperCase() === "DEF98765") {
    return {
      allowSale: false,
      status: "DESTROYED",
      riskLevel: "CRITICAL",
      message: "SALE BLOCKED: BATCH PREVIOUSLY DESTROYED. Manufacturer and Regulator have been notified.",
    };
  }

  return {
    allowSale: true,
    status: "ACTIVE",
    riskLevel: "LOW",
    message: "Batch verified. OK to sell.",
  };
};

// TODO: replace with real API call to POST /api/destruction
export const uploadDestructionCertificate = async (batchId: string, quantity: number): Promise<DestructionCertificate> => {
  await delay(1200);
  return {
    certificateId: "CERT-" + Math.floor(Math.random() * 100000),
    batchId,
    quantityDestroyed: quantity,
    destructionDate: new Date().toISOString(),
    facility: { id: "ORG-004", name: "EcoWaste Management" },
    certificateHash: "sha256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    status: "DESTROYED",
    blockchainTxId: "0xABC1234567890def1234567890abcdef1234567890abcdef1234567890abcdef",
  };
};
