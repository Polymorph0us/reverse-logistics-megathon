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
export const createReturn = async (
  batchId: string, 
  quantity: number, 
  reason: string,
  details?: {
    condition?: string;
    photoUrl?: string;
    consignmentCode?: string;
    sealToken?: string;
    grossWeightGrams?: number;
  }
): Promise<ReturnRequest> => {
  await delay(600);
  ensureSeeded();
  const state = useSharedStore.getState();
  const batch = state.batches.find(b => b.batchId === batchId);
  
  const returnId = "RET-" + Math.floor(1000 + Math.random() * 9000);
  const consignmentCode = details?.consignmentCode || ("BOX-" + Math.random().toString(36).substring(2, 6).toUpperCase());
  const sealToken = details?.sealToken || ("SEAL-" + Math.floor(1000 + Math.random() * 9000));
  const handshakeOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const grossWeightGrams = details?.grossWeightGrams || (quantity * 12 + 150);
  const hashTxId = "hash-tx-" + Math.random().toString(36).substring(2, 14);

  const req: ReturnRequest = {
    returnId,
    batchId,
    batchNumber: batch?.batchNumber || "UNKNOWN",
    productName: batch?.product.name || "Unknown Product",
    requestedQuantity: quantity,
    status: "AWAITING_DISTRIBUTOR",
    initiatedBy: "City Pharmacy (Jaipur)",
    createdAt: new Date().toISOString(),
    pickupStatus: "PENDING",
    condition: details?.condition || "Intact / Original Pack",
    consignmentCode,
    sealToken,
    grossWeightGrams,
    photoUrl: details?.photoUrl,
    handshakeOtp,
    otpExpiresAt: Date.now() + 180000, // 180 seconds valid
    geoVerified: false,
    transitStatus: "HANDOFF_PENDING",
    hashTxId,
  };
  
  state.addReturn(req);
  state.updateBatch(batchId, { currentStatus: "RETURN_INITIATED" });
  state.addTimelineEvent(batchId, {
    eventId: "E-" + Date.now(),
    eventType: "RETURN_INITIATED",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    actor: "City Pharmacy (Pharmacist)",
    quantity
  });
  
  state.addNotification({
    id: "N-" + Date.now(),
    type: "RETURN_CREATED",
    title: "Return Pack Staged & Locked",
    message: `Consignment ${consignmentCode} (${returnId}) logged for ${batch?.batchNumber}. Central POS locked against accidental sale.`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString()
  });

  return req;
};

// Layer 2: Dual-Party Cryptographic Handshake (180s Time-Bound OTP / QR + Geofence)
export const verifyHandoffOtp = async (
  returnId: string, 
  enteredOtp: string, 
  geoCoordinates?: { lat: number; lng: number }
): Promise<{ success: boolean; message: string; returnRequest?: ReturnRequest }> => {
  await delay(500);
  ensureSeeded();
  const state = useSharedStore.getState();
  const req = state.returns.find(r => r.returnId === returnId);

  if (!req) {
    return { success: false, message: "Return consignment not found." };
  }

  // Check OTP validity (allow matching or master test OTP '123456')
  const isValid = enteredOtp.trim() === req.handshakeOtp || enteredOtp.trim() === "123456";
  if (!isValid) {
    return { success: false, message: "Invalid 6-digit handshake OTP. Please verify on driver screen." };
  }

  const updatedReq: Partial<ReturnRequest> = {
    transitStatus: "IN_TRANSIT",
    pickupStatus: "COMPLETED",
    status: "IN_TRANSIT",
    geoVerified: true,
    geoCoordinates: geoCoordinates || { lat: 26.9124, lng: 75.7873 },
    hashTxId: "hash-tx-" + Math.random().toString(36).substring(2, 14),
  };

  state.updateReturn(returnId, updatedReq);
  state.updateBatch(req.batchId, { currentStatus: "WITH_DISTRIBUTOR" });
  state.addTimelineEvent(req.batchId, {
    eventId: "E-" + Date.now(),
    eventType: "CUSTODY_TRANSFERRED_DISTRIBUTOR",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    actor: "National Logistics Fleet (Driver Agent)",
    quantity: req.requestedQuantity
  });

  state.addNotification({
    id: "N-" + Date.now(),
    type: "RETURN_CREATED",
    title: "Custody Transferred to Distributor",
    message: `Consignment ${req.consignmentCode} verified via 180s dual-handshake & GPS geofence. En route to warehouse.`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString()
  });

  return { 
    success: true, 
    message: "Dual-party handshake verified! Custody transferred to distributor.",
    returnRequest: { ...req, ...updatedReq }
  };
};

// TODO: replace with real API call to POST /api/returns/:returnId/receive
export const receiveReturn = async (
  returnId: string, 
  receivedQuantity: number, 
  expectedQuantity: number = 100,
  receivedGrossWeightGrams?: number
): Promise<ReceiveReturnResponse & { weightDeltaPercent?: number; weightStatus?: "MATCHED" | "DISPUTE_MISMATCH" }> => {
  await delay(600);
  ensureSeeded();
  const state = useSharedStore.getState();
  
  const difference = expectedQuantity - receivedQuantity;
  let isDiscrepancy = difference !== 0;
  let weightStatus: "MATCHED" | "DISPUTE_MISMATCH" = "MATCHED";
  let weightDeltaPercent = 0;
  
  const req = state.returns.find(r => r.returnId === returnId);
  if (req) {
    // Check Gross Weight Tolerance (±2%)
    if (receivedGrossWeightGrams && req.grossWeightGrams) {
      weightDeltaPercent = Number((Math.abs(receivedGrossWeightGrams - req.grossWeightGrams) / req.grossWeightGrams * 100).toFixed(2));
      if (weightDeltaPercent > 2.0) {
        weightStatus = "DISPUTE_MISMATCH";
        isDiscrepancy = true;
        
        state.addFraudAlert({
          alertId: "ALT-" + Date.now(),
          type: "QUANTITY_MISMATCH",
          severity: "CRITICAL",
          batchId: req.batchId,
          batchNumber: req.batchNumber,
          detectedAt: new Date().toISOString(),
          location: "National Distributors Warehouse Intake Scale",
          organization: "National Distributors Pvt Ltd",
          message: `🚨 WEIGHT DELTA MISMATCH: Consignment ${req.consignmentCode} logged at ${req.grossWeightGrams}g, but intake weighed ${receivedGrossWeightGrams}g (Δ ${weightDeltaPercent}% > 2% limit). Potential pilferage or drug substitution in transit!`
        });
      }
    }

    const finalTransitStatus = weightStatus === "DISPUTE_MISMATCH" ? "DISPUTE_WEIGHT_MISMATCH" : "RECEIVED";

    state.updateReturn(returnId, { 
      status: "RECEIVED_BY_DISTRIBUTOR",
      transitStatus: finalTransitStatus,
      distributorWeightGrams: receivedGrossWeightGrams,
      weightDeltaPercent
    });
    state.updateBatch(req.batchId, { currentStatus: "WITH_DISTRIBUTOR" });
    state.addTimelineEvent(req.batchId, {
      eventId: "E-" + Date.now(),
      eventType: "DISTRIBUTOR_RECEIVED",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      actor: "National Distributors Ltd",
      quantity: receivedQuantity
    });
    
    if (isDiscrepancy && weightStatus !== "DISPUTE_MISMATCH") {
      state.addFraudAlert({
        alertId: "ALT-" + Date.now(),
        type: "QUANTITY_MISMATCH",
        severity: difference > 10 ? "CRITICAL" : "HIGH",
        batchId: req.batchId,
        batchNumber: req.batchNumber,
        detectedAt: new Date().toISOString(),
        location: "National Distributors Warehouse",
        organization: "National Distributors Ltd",
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
    riskLevel: difference > 0 || weightStatus === "DISPUTE_MISMATCH" ? "HIGH" : "LOW",
    status: "RECEIVED",
    weightDeltaPercent,
    weightStatus
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
