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
} from "./types";
import { useSharedStore } from "@/store/useSharedStore";
import { MOCK_USERS } from "@/store/seedData";

// Helper for simulated network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Make sure the store is seeded on first use
const ensureSeeded = () => {
  useSharedStore.getState().seedIfEmpty();
}

// TODO: replace with real API call to POST /api/auth/login
export const login = async (role: keyof typeof MOCK_USERS): Promise<LoginResponse> => {
  await delay(500);
  ensureSeeded();
  return {
    token: "mock-jwt-token-123",
    user: MOCK_USERS[role] as any,
  };
};

// TODO: replace with real API call to GET /api/dashboard/kpis
export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
  await delay(600);
  ensureSeeded();
  const state = useSharedStore.getState();
  
  return {
    totalBatches: state.batches.length,
    activeBatches: state.batches.filter(b => b.currentStatus === 'ACTIVE').length,
    expiringSoon: state.batches.filter(b => b.currentStatus === 'EXPIRING_SOON').length,
    expired: state.batches.filter(b => b.currentStatus === 'EXPIRED').length,
    returnsPending: state.returns.length,
    inTransit: state.batches.filter(b => b.currentStatus === 'WITH_DISTRIBUTOR').length,
    awaitingDestruction: state.batches.filter(b => b.currentStatus === 'SCHEDULED_FOR_DESTRUCTION').length,
    destroyed: state.batches.filter(b => b.currentStatus === 'DESTROYED').length,
    fraudAlerts: state.fraudAlerts.length,
    criticalAlerts: state.fraudAlerts.filter(a => a.severity === 'CRITICAL').length,
  };
};

// TODO: replace with real API call to GET /api/regulator/dashboard
export const getRegulatorDashboard = async (): Promise<RegulatorDashboard> => {
  await delay(400);
  ensureSeeded();
  const state = useSharedStore.getState();
  
  return {
    totalManufacturers: 2,
    totalDistributors: 5,
    totalRetailers: 12,
    totalTrackedBatches: state.batches.length,
    expiredBatches: state.batches.filter(b => b.currentStatus === 'EXPIRED').length,
    returnsInProgress: state.returns.filter(r => r.status !== 'COMPLETED').length,
    destroyedBatches: state.batches.filter(b => b.currentStatus === 'DESTROYED').length,
    fraudAlerts: state.fraudAlerts.length,
    criticalAlerts: state.fraudAlerts.filter(a => a.severity === 'CRITICAL').length,
    openInvestigations: 2,
  };
};

// TODO: replace with real API call to GET /api/batches
export const getBatches = async (): Promise<BatchPassport[]> => {
  await delay(700);
  ensureSeeded();
  return useSharedStore.getState().batches;
};

// TODO: replace with real API call to GET /api/batches/:batchId
export const getBatchPassport = async (batchId: string): Promise<BatchPassport> => {
  await delay(500);
  ensureSeeded();
  const batch = useSharedStore.getState().batches.find(b => b.batchId === batchId);
  if (!batch) throw new Error("Batch not found");
  return batch;
};

// TODO: replace with real API call to POST /api/returns
export const createReturn = async (batchId: string, quantity: number, _reason: string): Promise<ReturnRequest> => {
  await delay(800);
  ensureSeeded();
  const state = useSharedStore.getState();
  const batch = state.batches.find(b => b.batchId === batchId);
  
  const returnId = "RET-" + Math.floor(Math.random() * 10000);
  
  const req: ReturnRequest = {
    returnId,
    batchId,
    batchNumber: batch?.batchNumber || "UNKNOWN",
    productName: batch?.product.name || "Unknown Product",
    requestedQuantity: quantity,
    status: "AWAITING_DISTRIBUTOR",
    initiatedBy: "Raj Pharmacy (Jaipur)",
    createdAt: new Date().toISOString(),
    pickupStatus: "PENDING",
  };
  
  state.addReturn(req);
  state.updateBatch(batchId, { currentStatus: "RETURN_INITIATED" });
  state.addTimelineEvent(batchId, {
    eventId: "E-" + Date.now(),
    eventType: "RETURN_INITIATED",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    actor: "Raj Pharmacy",
    quantity
  });
  
  state.addNotification({
    id: "N-" + Date.now(),
    type: "RETURN_CREATED",
    title: "Return Initiated",
    message: `Return ${returnId} initiated for ${batch?.batchNumber}`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString()
  });

  return req;
};

// TODO: replace with real API call to POST /api/returns/:returnId/receive
export const receiveReturn = async (returnId: string, receivedQuantity: number, expectedQuantity: number = 100): Promise<ReceiveReturnResponse> => {
  await delay(600);
  ensureSeeded();
  const state = useSharedStore.getState();
  
  const difference = expectedQuantity - receivedQuantity;
  const isDiscrepancy = difference !== 0;
  
  const req = state.returns.find(r => r.returnId === returnId);
  if (req) {
    state.updateReturn(returnId, { status: "RECEIVED_BY_DISTRIBUTOR" });
    state.updateBatch(req.batchId, { currentStatus: "WITH_DISTRIBUTOR" });
    state.addTimelineEvent(req.batchId, {
      eventId: "E-" + Date.now(),
      eventType: "DISTRIBUTOR_RECEIVED",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      actor: "ABC Distributors Ltd",
      quantity: receivedQuantity
    });
    
    if (isDiscrepancy) {
      state.addFraudAlert({
        alertId: "ALT-" + Date.now(),
        type: "QUANTITY_MISMATCH",
        severity: difference > 10 ? "CRITICAL" : "HIGH",
        batchId: req.batchId,
        batchNumber: req.batchNumber,
        detectedAt: new Date().toISOString(),
        location: "ABC Distributors Warehouse",
        organization: "ABC Distributors Ltd",
        message: `Discrepancy of ${difference} units reported during return receipt. Expected: ${expectedQuantity}, Received: ${receivedQuantity}.`
      });
    }
  }

  return {
    returnId,
    expectedQuantity,
    receivedQuantity,
    difference,
    reconciliationStatus: isDiscrepancy ? "DISCREPANCY" : "MATCHED",
    riskLevel: difference > 0 ? "HIGH" : "LOW",
    status: "RECEIVED",
  };
};

// TODO: replace with real API call to GET /api/alerts
export const getFraudAlerts = async (): Promise<FraudAlert[]> => {
  await delay(400);
  ensureSeeded();
  return useSharedStore.getState().fraudAlerts;
};

// TODO: replace with real API call to POST /api/verify
export const verifyBatchForSale = async (batchNumber: string): Promise<BatchVerifyResponse> => {
  await delay(800);
  ensureSeeded();
  const state = useSharedStore.getState();
  
  const batch = state.batches.find(b => b.batchNumber.toUpperCase() === batchNumber.toUpperCase());
  
  if (!batch) {
    return {
      allowSale: false,
      status: "UNKNOWN",
      riskLevel: "HIGH",
      message: "Batch not found in registry.",
    };
  }

  if (batch.currentStatus === "DESTROYED") {
    // Generate a fraud alert since someone tried to sell a destroyed batch
    state.addFraudAlert({
      alertId: "ALT-" + Date.now(),
      type: "DESTROYED_BATCH_REENTRY",
      severity: "CRITICAL",
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      detectedAt: new Date().toISOString(),
      location: "POS Terminal (Mumbai)",
      organization: "Unknown Retailer",
      message: `Attempted sale of a destroyed batch (${batch.batchNumber}) detected at POS.`
    });
    
    return {
      allowSale: false,
      status: "DESTROYED",
      riskLevel: "CRITICAL",
      message: "SALE BLOCKED: BATCH PREVIOUSLY DESTROYED. Manufacturer and Regulator have been notified.",
    };
  }
  
  if (batch.currentStatus === "EXPIRED" || new Date(batch.expiryDate) < new Date()) {
    state.addFraudAlert({
      alertId: "ALT-" + Date.now(),
      type: "EXPIRED_BATCH_SALE",
      severity: "HIGH",
      batchId: batch.batchId,
      batchNumber: batch.batchNumber,
      detectedAt: new Date().toISOString(),
      location: "POS Terminal (Mumbai)",
      organization: "Unknown Retailer",
      message: `Attempted sale of an expired batch (${batch.batchNumber}) detected at POS.`
    });
    return {
      allowSale: false,
      status: "EXPIRED",
      riskLevel: "HIGH",
      message: "SALE BLOCKED: BATCH IS EXPIRED.",
    };
  }

  return {
    allowSale: true,
    status: batch.currentStatus,
    riskLevel: batch.riskLevel,
    message: "Batch verified. OK to sell.",
  };
};

// TODO: replace with real API call to POST /api/destruction
export const uploadDestructionCertificate = async (batchId: string, quantity: number): Promise<DestructionCertificate> => {
  await delay(1200);
  ensureSeeded();
  const state = useSharedStore.getState();
  
  const timestamp = Date.now();
  
  // Deterministic fake hash
  const fakeHash = "sha256:" + Array.from(batchId + timestamp).reduce((acc, char) => {
    return acc + char.charCodeAt(0).toString(16);
  }, "").padEnd(64, '0').substring(0, 64);
  
  const cert: DestructionCertificate = {
    certificateId: "CERT-" + Math.floor(Math.random() * 100000),
    batchId,
    quantityDestroyed: quantity,
    destructionDate: new Date().toISOString(),
    facility: { id: "ORG-004", name: "EcoWaste Management" },
    certificateHash: fakeHash,
    status: "DESTROYED",
    blockchainTxId: "0x" + fakeHash.substring(0, 60),
  };
  
  state.addDestruction(cert);
  state.updateBatch(batchId, { currentStatus: "DESTROYED", currentQuantity: 0 });
  state.addTimelineEvent(batchId, {
    eventId: "E-" + Date.now(),
    eventType: "DESTRUCTION_COMPLETED",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    actor: "EcoWaste Management",
    quantity
  });
  
  state.addNotification({
    id: "N-" + Date.now(),
    type: "DESTRUCTION_COMPLETED",
    title: "Destruction Certified",
    message: `Batch ${batchId} was verified as destroyed on the blockchain.`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString()
  });

  return cert;
};
