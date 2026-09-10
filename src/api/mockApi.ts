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
  MasterConsignment,
  DenaturedBatchTag,
  DenaturationAgent,
  BlindScanResult,
  ElectronicWasteTransferNote,
  IncinerationLog,
  FinalIncinerationRecord,
  KilnTelemetryReading,
  KilnWeightVerification,
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
  _reason: string,
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

// ===========================================================================
// Layer 3: Merkle Tree Master Crate Consolidation (Distributor → OEM)
// ===========================================================================

/** Pure SHA-256 via browser WebCrypto — no external dependencies */
async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Build a Merkle tree from leaf hashes.
 * levels[0] = leaves, levels[last] = [merkle_root]
 */
async function buildMerkleTree(leaves: string[]): Promise<string[][]> {
  const levels: string[][] = [leaves.slice()];
  while (levels[levels.length - 1].length > 1) {
    const current = levels[levels.length - 1];
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = i + 1 < current.length ? current[i + 1] : left;
      next.push(await sha256Hex(left + right));
    }
    levels.push(next);
  }
  return levels;
}

/**
 * Layer 3 — Generate Master Consignment Manifest (MCM) with Merkle sealing.
 * Eligible returns must be RECEIVED_BY_DISTRIBUTOR and not in DISPUTE state.
 */
export const generateMCM = async (
  returnIds: string[],
  manufacturerTarget: string = "Sun Pharmaceutical Industries"
): Promise<MasterConsignment> => {
  await delay(800);
  ensureSeeded();
  const state = useSharedStore.getState();

  const selectedReturns = state.returns.filter(
    r =>
      returnIds.includes(r.returnId) &&
      r.transitStatus !== "DISPUTE_WEIGHT_MISMATCH"
  );

  if (selectedReturns.length === 0) {
    throw new Error("No eligible returns selected for consolidation.");
  }

  // Leaf hash = SHA-256(returnId | batchNumber | grossWeight | sealToken)
  const leafHashes = await Promise.all(
    selectedReturns.map(r =>
      sha256Hex(`${r.returnId}|${r.batchNumber}|${r.grossWeightGrams ?? 0}|${r.sealToken ?? ""}`)
    )
  );

  const merkleTree = await buildMerkleTree(leafHashes);
  const merkleRoot = merkleTree[merkleTree.length - 1][0];
  const mcmId = `MCM-${new Date().getFullYear()}-IND-${Math.floor(1000 + Math.random() * 9000)}`;
  const transitHashTxId = await sha256Hex(`${mcmId}|${merkleRoot}|${Date.now()}`);

  const totalQuantity = selectedReturns.reduce((s, r) => s + r.requestedQuantity, 0);
  const totalWeightGrams = selectedReturns.reduce((s, r) => s + (r.grossWeightGrams ?? 0), 0);

  const mcm: MasterConsignment = {
    mcmId,
    distributorId: "ORG-002",
    manufacturerTarget,
    containedReturnIds: selectedReturns.map(r => r.returnId),
    merkleRoot,
    merkleTree,
    totalQuantity,
    totalWeightGrams,
    createdAt: new Date().toISOString(),
    status: "SEALED",
    transitHashTxId,
  };

  // Stamp each return with its leaf hash and mark as consolidated
  selectedReturns.forEach((r, i) => {
    state.updateReturn(r.returnId, {
      masterConsignmentId: mcmId,
      merkleLeafHash: leafHashes[i],
      transitStatus: "CONSOLIDATED",
      consolidatedAt: new Date().toISOString(),
    });
    state.updateBatch(r.batchId, { currentStatus: "WITH_MANUFACTURER" });
    state.addTimelineEvent(r.batchId, {
      eventId: "E-" + Date.now() + i,
      eventType: "MCM_SEALED",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      actor: "National Distributors Pvt Ltd",
      quantity: r.requestedQuantity,
    });
  });

  state.addMasterConsignment(mcm);
  state.addNotification({
    id: "N-" + Date.now(),
    type: "RETURN_CREATED",
    title: "Master Crate Sealed (MCM)",
    message: `${mcmId} sealed — Merkle root: ${merkleRoot.substring(0, 16)}… — ${selectedReturns.length} consignments locked & in transit to OEM.`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString(),
  });

  return mcm;
};

/** Get all master consignments from store */
export const getMasterConsignments = async (): Promise<MasterConsignment[]> => {
  await delay(300);
  ensureSeeded();
  return useSharedStore.getState().masterConsignments;
};

// ===========================================================================
// Layer 4: OEM Blind Inward Scan (Reconciliation Without Seeing Manifest)
// ===========================================================================

/**
 * OEM warehouse team scans arriving bag codes without viewing the manifest.
 * Backend cross-checks against MCM. Any missing bag, extra bag, or hash mismatch
 * halts processing and fires a CDSCO auditor alert.
 */
export const runBlindScan = async (
  mcmId: string,
  scannedCodes: string[]
): Promise<BlindScanResult> => {
  await delay(700);
  ensureSeeded();
  const state = useSharedStore.getState();
  const mcm = state.masterConsignments.find(m => m.mcmId === mcmId);
  if (!mcm) throw new Error(`MCM ${mcmId} not found.`);

  const expectedReturns = state.returns.filter(r =>
    mcm.containedReturnIds.includes(r.returnId)
  );
  const expectedCodes = expectedReturns.map(r => r.consignmentCode ?? r.returnId);

  const missingBags = expectedCodes.filter(c => !scannedCodes.includes(c));
  const extraBags = scannedCodes.filter(c => !expectedCodes.includes(c));

  // Recompute leaf hashes on scanned bags and compare to logged value
  const hashMismatches: string[] = [];
  for (const r of expectedReturns) {
    const code = r.consignmentCode ?? r.returnId;
    if (!scannedCodes.includes(code)) continue;
    const recomputed = await sha256Hex(
      `${r.returnId}|${r.batchNumber}|${r.grossWeightGrams ?? 0}|${r.sealToken ?? ""}`
    );
    if (r.merkleLeafHash && recomputed !== r.merkleLeafHash) {
      hashMismatches.push(code);
    }
  }

  const passed =
    missingBags.length === 0 &&
    extraBags.length === 0 &&
    hashMismatches.length === 0;

  const result: BlindScanResult = {
    mcmId,
    scannedBagIds: scannedCodes,
    expectedBagIds: expectedCodes,
    missingBags,
    extraBags,
    hashMismatches,
    passed,
    scannedAt: new Date().toISOString(),
  };

  const newStatus = passed ? "BLIND_SCAN_PASS" : "BLIND_SCAN_DISPUTE";
  state.updateMasterConsignment(mcmId, {
    status: newStatus,
    receivedAt: new Date().toISOString(),
  });

  if (!passed) {
    state.addFraudAlert({
      alertId: "ALT-" + Date.now(),
      type: "QUANTITY_MISMATCH",
      severity: "CRITICAL",
      batchId: mcm.containedReturnIds[0] ?? "UNKNOWN",
      batchNumber: "MCM-MULTI",
      detectedAt: new Date().toISOString(),
      location: "OEM Intake Warehouse — Blind Scan Station",
      organization: mcm.manufacturerTarget,
      message: `🚨 BLIND SCAN ANOMALY on ${mcmId}: Missing=${missingBags.length}, Extra=${extraBags.length}, HashMismatches=${hashMismatches.length}. CDSCO Regional Auditor alerted immediately.`,
    });
  } else {
    state.addNotification({
      id: "N-" + Date.now(),
      type: "RETURN_RECEIVED",
      title: "Blind Scan Passed ✓",
      message: `${mcmId} — All ${scannedCodes.length} bags hash-verified against Merkle root. Cleared for denaturing & destruction.`,
      severity: "INFO",
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return result;
};

/**
 * Issues a pre-destruction chemical denaturing tag.
 * Requires a CDSCO witness officer ID and name — cannot be self-certified.
 * Status flips batch to CONDITION_DENATURED_CONDEMNED.
 */
export const tagDenatured = async (
  batchId: string,
  agent: DenaturationAgent,
  witnessOfficerId: string,
  witnessOfficerName: string,
  quantityDenatured: number,
  weightKg: number,
  agentLotNumber?: string,
  photoDataUrl?: string
): Promise<DenaturedBatchTag> => {
  await delay(600);
  ensureSeeded();
  const state = useSharedStore.getState();
  const batch = state.batches.find(b => b.batchId === batchId);
  if (!batch) throw new Error("Batch not found.");

  const photoEvidenceHash = await sha256Hex(photoDataUrl ?? batchId + Date.now() + agent);
  const tagId = `DNT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
    .toString(36).substring(2, 6).toUpperCase()}`;

  let tag: DenaturedBatchTag = {
    tagId,
    batchId,
    batchNumber: batch.batchNumber,
    denaturedAt: new Date().toISOString(),
    agent,
    agentLotNumber,
    witnessOfficerId,
    witnessOfficerName,
    photoEvidenceHash,
    photoUrl: photoDataUrl,
    quantityDenatured,
    weightKg,
    status: "CONFIRMED",
  };

  try {
    const res = await fetch("http://localhost:8081/api/denatured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tag)
    });
    if (res.ok) {
      tag = await res.json();
    }
  } catch (e) {
    console.warn("Backend /api/denatured unreachable, proceeding with mock data");
  }

  state.addDenaturedTag(tag);
  // Flip to CONDITION_DENATURED_CONDEMNED — stronger than SCHEDULED_FOR_DESTRUCTION
  state.updateBatch(batchId, { currentStatus: "CONDITION_DENATURED_CONDEMNED" });
  state.addTimelineEvent(batchId, {
    eventId: "E-" + Date.now(),
    eventType: "PRE_DESTRUCTION_DENATURING",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    actor: `CDSCO Witness Officer ${witnessOfficerName} (${witnessOfficerId})`,
    quantity: quantityDenatured,
  });
  state.addNotification({
    id: "N-" + Date.now(),
    type: "DESTRUCTION_SCHEDULED",
    title: "🧪 Denaturing Tag Issued — CONDITION_DENATURED_CONDEMNED",
    message: `${tagId} — ${batch.batchNumber} denatured via ${agent}. Witness: ${witnessOfficerName} (${witnessOfficerId}). Schedule E-WTN pickup.`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString(),
  });

  return tag;
};

/** Get all denaturing tags from store */
export const getDenaturedTags = async (): Promise<DenaturedBatchTag[]> => {
  await delay(200);
  ensureSeeded();
  return useSharedStore.getState().denaturedTags;
};

// ===========================================================================
// Layer 4: Electronic Waste Transfer Note (E-WTN) — CBWTF Pickup Scheduler
// ===========================================================================

/**
 * Generates an official E-WTN connecting the manufacturer to an authorized
 * CBWTF bio-medical incinerator facility.
 * Gate: requires a confirmed DenaturedBatchTag.
 */
export const generateEWTN = async (
  denaturedTagId: string,
  vehicleNumber: string,
  driverName: string,
  hazmatLicenseNumber: string,
  scheduledPickupStart: string,
  scheduledPickupEnd: string,
  cbwtfFacilityKey: "ECOWASTE" | "GREENSHIELD"
): Promise<ElectronicWasteTransferNote> => {
  await delay(600);
  ensureSeeded();
  const state = useSharedStore.getState();
  const tag = state.denaturedTags.find(t => t.tagId === denaturedTagId);
  if (!tag) throw new Error(`Denaturing tag ${denaturedTagId} not found.`);
  if (tag.status !== "CONFIRMED") throw new Error("Denaturing tag must be CONFIRMED before scheduling pickup.");

  const facilities: Record<"ECOWASTE" | "GREENSHIELD", { name: string; regNumber: string; address: string }> = {
    ECOWASTE: {
      name: "EcoWaste Solutions CBWTF",
      regNumber: "CBWTF-RAJ-2019-0042",
      address: "Plot 14, RIICO Industrial Area Phase II, Jaipur, Rajasthan 302022",
    },
    GREENSHIELD: {
      name: "GreenShield Incinerators Ltd",
      regNumber: "CBWTF-MH-2017-0018",
      address: "Survey No. 82/3, Ambernath MIDC, Thane, Maharashtra 421506",
    },
  };

  const facility = facilities[cbwtfFacilityKey];
  const ewtnId = `EWTN-${new Date().getFullYear()}-RAJ-${Math.floor(1000 + Math.random() * 9000)}`;

  let ewtn: ElectronicWasteTransferNote = {
    ewtnId,
    denaturedTagId,
    batchId: tag.batchId,
    batchNumber: tag.batchNumber,
    cbwtfName: facility.name,
    cbwtfRegNumber: facility.regNumber,
    cbwtfAddress: facility.address,
    vehicleNumber: vehicleNumber.toUpperCase(),
    driverName,
    hazmatLicenseNumber: hazmatLicenseNumber.toUpperCase(),
    scheduledPickupStart,
    scheduledPickupEnd,
    totalNetMassKg: tag.weightKg,
    wasteCategory: "Category 4 — Expired / Condemned Pharmaceuticals (Schedule H / X)",
    createdAt: new Date().toISOString(),
    status: "SCHEDULED",
  };

  try {
    const res = await fetch("http://localhost:8081/api/ewtn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ewtn)
    });
    if (res.ok) {
      ewtn = await res.json();
    }
  } catch (e) {
    console.warn("Backend /api/ewtn unreachable, proceeding with mock data");
  }

  state.addEWTN(ewtn);
  state.updateBatch(tag.batchId, { currentStatus: "SCHEDULED_FOR_DESTRUCTION" });
  state.addTimelineEvent(tag.batchId, {
    eventId: "E-" + Date.now(),
    eventType: "EWTN_GENERATED",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    actor: facility.name,
    quantity: tag.quantityDenatured,
  });
  state.addNotification({
    id: "N-" + Date.now(),
    type: "DESTRUCTION_SCHEDULED",
    title: "📋 E-WTN Generated",
    message: `${ewtnId} — Vehicle ${vehicleNumber} scheduled for pickup. CBWTF: ${facility.name} (${facility.regNumber}).`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString(),
  });

  return ewtn;
};

/** Get all E-WTNs from store */
export const getEWTNs = async (): Promise<ElectronicWasteTransferNote[]> => {
  await delay(200);
  ensureSeeded();
  return useSharedStore.getState().ewtns;
};

// ===========================================================================
// Layer 4: Incineration Temperature Log Entry
// ===========================================================================

/**
 * Records the dual-chamber incineration temperature log.
 * Gate: Primary ≥ 850°C, Secondary ≥ 1050°C (CPCB dual-chamber standard).
 */
export const logIncineration = async (
  ewtnId: string,
  primaryChamberTempC: number,
  secondaryChamberTempC: number,
  operatorId: string,
  ashDisposalWaybill: string
): Promise<IncinerationLog> => {
  await delay(500);
  ensureSeeded();
  const state = useSharedStore.getState();
  const ewtn = state.ewtns.find(e => e.ewtnId === ewtnId);
  if (!ewtn) throw new Error(`E-WTN ${ewtnId} not found.`);

  const passed = primaryChamberTempC >= 850 && secondaryChamberTempC >= 1050;
  const now = new Date();
  const logId = `INCIN-LOG-${now.getTime()}`;
  const startTime = new Date(now.getTime() - 2 * 3600000).toISOString(); // 2h incin window

  let log: IncinerationLog = {
    logId,
    ewtnId,
    batchId: ewtn.batchId,
    primaryChamberTempC,
    secondaryChamberTempC,
    incinerationStartTime: startTime,
    incinerationEndTime: now.toISOString(),
    ashDisposalWaybill,
    operatorId,
    passed,
    recordedAt: now.toISOString(),
  };

  try {
    const res = await fetch("http://localhost:8081/api/kiln/incineration-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log)
    });
    if (res.ok) {
      log = await res.json();
    }
  } catch (e) {
    console.warn("Backend /api/kiln/incineration-logs unreachable, proceeding with mock data");
  }

  state.addIncinerationLog(log);
  state.updateEWTN(ewtnId, { status: "INCINERATED", pickupConfirmedAt: now.toISOString() });

  if (!passed) {
    state.addFraudAlert({
      alertId: "ALT-" + Date.now(),
      type: "QUANTITY_MISMATCH",
      severity: "HIGH",
      batchId: ewtn.batchId,
      batchNumber: ewtn.batchNumber,
      detectedAt: now.toISOString(),
      location: ewtn.cbwtfName,
      organization: ewtn.cbwtfName,
      message: `⚠ TEMPERATURE BELOW STANDARD: Primary=${primaryChamberTempC}°C (min 850), Secondary=${secondaryChamberTempC}°C (min 1050). Incineration may be incomplete!`,
    });
  }

  return log;
};

// ===========================================================================
// Layer 4: Gated Destruction Certificate — CDSCO Form-XIX
// ===========================================================================

/**
 * Issues the final CDSCO Form-XIX Green Disposal Certificate.
 *
 * STRICT GATE — ALL 4 conditions must be met or an error is thrown:
 *   1. Blind inward scan confirmed (MCM status = BLIND_SCAN_PASS)
 *   2. Denaturing tag confirmed (status = CONFIRMED)
 *   3. E-WTN generated and pickup scheduled
 *   4. Incineration temperature log recorded and passed (≥ 1050°C secondary)
 *
 * VOLUME LOCK — certificated quantity can NEVER exceed physically verified quantity.
 */
export const issueFinalCertificate = async (
  batchId: string,
  quantityToDestroy: number,
  issuedByOfficerId: string
): Promise<DestructionCertificate> => {
  await delay(1000);
  ensureSeeded();
  const state = useSharedStore.getState();
  const batch = state.batches.find(b => b.batchId === batchId);
  if (!batch) throw new Error("Batch not found.");

  // ── Gate 1: Blind Scan ───────────────────────────────────────────────────
  const mcm = state.masterConsignments.find(m =>
    state.returns.some(r => r.batchId === batchId && m.containedReturnIds.includes(r.returnId))
  );
  const blindScanVerified = mcm?.status === "BLIND_SCAN_PASS";
  if (!blindScanVerified) {
    throw new Error("Gate 1 FAILED: No confirmed Blind Inward Scan found for this batch. Cannot issue certificate.");
  }

  // ── Gate 2: Denaturing Tag ───────────────────────────────────────────────
  const denatTag = state.denaturedTags.find(t => t.batchId === batchId && t.status === "CONFIRMED");
  if (!denatTag) {
    throw new Error("Gate 2 FAILED: No confirmed Denaturing Tag found. CDSCO-witnessed denaturing must occur before certificate issuance.");
  }

  // ── Gate 3: E-WTN ───────────────────────────────────────────────────────
  const ewtn = state.ewtns.find(e => e.batchId === batchId);
  if (!ewtn) {
    throw new Error("Gate 3 FAILED: No Electronic Waste Transfer Note (E-WTN) found. Schedule CBWTF pickup first.");
  }

  // ── Gate 4: Incineration Log ─────────────────────────────────────────────
  const incLog = state.incinerationLogs.find(l => l.ewtnId === ewtn.ewtnId && l.passed);
  if (!incLog) {
    throw new Error(`Gate 4 FAILED: No passing Incineration Temperature Log found. Secondary chamber must be ≥ 1050°C.`);
  }

  // ── Volume Lock ──────────────────────────────────────────────────────────
  const verifiedQty = denatTag.quantityDenatured;
  if (quantityToDestroy > verifiedQty) {
    throw new Error(`VOLUME LOCK: Cannot certify ${quantityToDestroy} units — only ${verifiedQty} physically denatured. Phantom write-off blocked.`);
  }

  // ── Build Certificate ────────────────────────────────────────────────────
  const certId = `CERT-XIX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
  const certPayload = `${certId}|${batchId}|${batch.batchNumber}|${quantityToDestroy}|${denatTag.tagId}|${ewtn.ewtnId}|${incLog.logId}|${Date.now()}`;
  const certificateHash = await sha256Hex(certPayload);
  const blockchainTxId = "0x" + (await sha256Hex(certificateHash + issuedByOfficerId)).substring(0, 60);

  const cert: DestructionCertificate = {
    certificateId: certId,
    batchId,
    batchNumber: batch.batchNumber,
    quantityDestroyed: quantityToDestroy,
    verifiedReceivedQuantity: verifiedQty,
    destructionDate: new Date().toISOString(),
    facility: {
      id: ewtn.cbwtfRegNumber,
      name: ewtn.cbwtfName,
      regNumber: ewtn.cbwtfRegNumber,
    },
    status: "DESTROYED",
    blindScanVerified: true,
    denaturedTagId: denatTag.tagId,
    ewtnId: ewtn.ewtnId,
    incinerationLogId: incLog.logId,
    primaryChamberTempC: incLog.primaryChamberTempC,
    secondaryChamberTempC: incLog.secondaryChamberTempC,
    ashDisposalWaybill: incLog.ashDisposalWaybill,
    certificateHash,
    blockchainTxId,
    issuedByOfficerId,
    linkedBatchNumbers: [batch.batchNumber],
    denaturedTagIds: [denatTag.tagId],
  };

  state.addDestruction(cert);
  state.updateBatch(batchId, { currentStatus: "DESTROYED", currentQuantity: 0 });
  state.addTimelineEvent(batchId, {
    eventId: "E-" + Date.now(),
    eventType: "DESTRUCTION_COMPLETED",
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    actor: ewtn.cbwtfName,
    quantity: quantityToDestroy,
  });
  state.addNotification({
    id: "N-" + Date.now(),
    type: "DESTRUCTION_COMPLETED",
    title: "✅ CDSCO Form-XIX Certificate Issued",
    message: `${certId} — ${batch.batchNumber} · ${quantityToDestroy} units · SHA-256: ${certificateHash.substring(0, 16)}…`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString(),
  });

  return cert;
};

/** Get all destruction certificates */
export const getDestructionCertificates = async (): Promise<DestructionCertificate[]> => {
  await delay(200);
  ensureSeeded();
  return useSharedStore.getState().destructions;
};

// ===========================================================================
// Layer 5: Final Incineration at Authorized CBWTF — Loop Closure
// ===========================================================================

/**
 * Simulates kiln telemetry readings across a burn cycle.
 * Returns 6 readings spanning the LOADING → COMPLETE burn phases.
 */
function generateTelemetry(
  baseWeightKg: number,
  startTime: Date
): KilnTelemetryReading[] {
  const phases: KilnTelemetryReading["burnPhase"][] = [
    "LOADING", "IGNITION", "FULL_BURN", "FULL_BURN", "BURNOUT", "COMPLETE",
  ];
  const primaryTemps  = [220, 650, 920, 940, 890, 820];
  const secondaryTemps = [180, 720, 1080, 1100, 1060, 980];
  const weightFractions = [1.0, 0.92, 0.70, 0.45, 0.18, 0.04]; // mass loss as it burns

  return phases.map((phase, i) => ({
    readingId: `TLM-${Date.now()}-${i}`,
    timestamp: new Date(startTime.getTime() + i * 20 * 60000).toISOString(), // +20 min each
    hopperWeightKg: parseFloat((baseWeightKg * weightFractions[i]).toFixed(2)),
    primaryChamberTempC: primaryTemps[i],
    secondaryChamberTempC: secondaryTemps[i],
    burnPhase: phase,
  }));
}

/**
 * Runs the final kiln incineration at the CBWTF facility.
 *
 * Steps:
 * 1. Resolve MCM + E-WTN from store
 * 2. Weight-to-energy tolerance check (±5% of L3/L4 logged weight)
 * 3. Simulate continuous load-cell telemetry readings across burn phases
 * 4. Geo-tag the feeder conveyor scan (facility GPS)
 * 5. Compute plant manager SHA-256 digital signature
 * 6. TERMINAL STATUS COMMITMENT: all contained batch IDs → DESTROYED
 * 7. Create FinalIncinerationRecord with auto-compiled certificate hash
 */
export const runKilnIncineration = async (
  ewtnId: string,
  mcmId: string,
  hopperWeightKg: number,
  supervisorId: string,
  plantManagerId: string,
  plantManagerName: string,
  ashDisposalWaybill: string
): Promise<FinalIncinerationRecord> => {
  await delay(1200);
  ensureSeeded();
  const state = useSharedStore.getState();

  // ── Resolve E-WTN + MCM ─────────────────────────────────────────────────
  const ewtn = state.ewtns.find(e => e.ewtnId === ewtnId);
  if (!ewtn) throw new Error(`E-WTN ${ewtnId} not found.`);
  if (ewtn.status === "INCINERATED") throw new Error(`E-WTN ${ewtnId} has already been incinerated.`);

  const mcm = state.masterConsignments.find(m => m.mcmId === mcmId);
  if (!mcm) throw new Error(`MCM ${mcmId} not found.`);

  // ── Weight-to-Energy Tolerance Check (±5%) ──────────────────────────────
  const loggedWeight  = ewtn.totalNetMassKg;
  const delta         = Math.abs(hopperWeightKg - loggedWeight);
  const deltaPercent  = parseFloat(((delta / loggedWeight) * 100).toFixed(2));
  const TOLERANCE_PCT = 5; // 5% for thermal denaturing mass loss
  const weightPassed  = deltaPercent <= TOLERANCE_PCT;

  const weightVerification: KilnWeightVerification = {
    mcmId,
    ewtnId,
    loggedWeightKg: loggedWeight,
    hopperWeightKg,
    deltaKg: parseFloat(delta.toFixed(3)),
    deltaPercent,
    tolerancePercent: TOLERANCE_PCT,
    passed: weightPassed,
    checkedAt: new Date().toISOString(),
  };

  if (!weightPassed) {
    state.addFraudAlert({
      alertId: "ALT-" + Date.now(),
      type: "QUANTITY_MISMATCH",
      severity: "CRITICAL",
      batchId: ewtn.batchId,
      batchNumber: ewtn.batchNumber,
      detectedAt: new Date().toISOString(),
      location: ewtn.cbwtfName,
      organization: ewtn.cbwtfName,
      message: `🚨 KILN WEIGHT MISMATCH: Logged ${loggedWeight} kg, Hopper ${hopperWeightKg} kg (Δ ${deltaPercent}% > ${TOLERANCE_PCT}% tolerance). Possible waste diversion. CDSCO + State Drug Controller alerted.`,
    });
  }

  // ── Telemetry & Kiln Timing ──────────────────────────────────────────────
  const kilnStart = new Date();
  const telemetryReadings = generateTelemetry(hopperWeightKg, kilnStart);
  const kilnEnd   = new Date(kilnStart.getTime() + 120 * 60000); // 2h burn
  const peakPrimary   = Math.max(...telemetryReadings.map(r => r.primaryChamberTempC));
  const peakSecondary = Math.max(...telemetryReadings.map(r => r.secondaryChamberTempC));
  const ashMassKg     = parseFloat((hopperWeightKg * 0.04).toFixed(2)); // ~4% residue

  // ── Resolve all contained batches ───────────────────────────────────────
  const containedReturns = state.returns.filter(r =>
    mcm.containedReturnIds.includes(r.returnId)
  );
  const destroyedBatchIds     = [...new Set(containedReturns.map(r => r.batchId))];
  const destroyedBatchNumbers = [...new Set(containedReturns.map(r => r.batchNumber))];
  const sourcePharmacyIds     = [...new Set(containedReturns.map(r => r.initiatedBy))];
  const totalUnitsDestroyed   = containedReturns.reduce((sum, r) => sum + r.requestedQuantity, 0);

  // ── Geo-tag (facility coordinates) ─────────────────────────────────────
  const GEO: Record<string, { lat: number; lng: number; address: string }> = {
    "CBWTF-RAJ-2019-0042": { lat: 26.9124, lng: 75.7873, address: "Plot 14, RIICO Industrial Area Phase II, Jaipur, Rajasthan 302022" },
    "CBWTF-MH-2017-0018":  { lat: 19.1525, lng: 73.1892, address: "Survey No. 82/3, Ambernath MIDC, Thane, Maharashtra 421506" },
  };
  const geo = GEO[ewtn.cbwtfRegNumber] ?? { lat: 20.5937, lng: 78.9629, address: ewtn.cbwtfAddress };

  // ── Build Record ID ──────────────────────────────────────────────────────
  const recordId   = `FIR-${new Date().getFullYear()}-CBWTF-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
  const certId     = `FIR-CERT-${recordId}`;

  // ── Plant Manager SHA-256 Signature ────────────────────────────────────
  const sigPayload        = `${recordId}|${plantManagerId}|${kilnStart.toISOString()}|${mcm.merkleRoot}`;
  const sigHash           = await sha256Hex(sigPayload);
  const certPayload       = `${certId}|${recordId}|${destroyedBatchNumbers.join(",")}|${totalUnitsDestroyed}|${peakSecondary}|${sigHash}`;
  const certificateHash   = await sha256Hex(certPayload);
  const blockchainTxId    = "0x" + (await sha256Hex(certificateHash + supervisorId)).substring(0, 60);

  // ── Build FinalIncinerationRecord ───────────────────────────────────────
  const record: FinalIncinerationRecord = {
    recordId,
    ewtnId,
    mcmId,
    facilityName:          ewtn.cbwtfName,
    facilityRegNumber:     ewtn.cbwtfRegNumber,
    geoLat:                geo.lat,
    geoLng:                geo.lng,
    geoAddress:            geo.address,
    masterCrateQrScannedAt: kilnStart.toISOString(),
    masterCrateQrScannedBy: supervisorId,
    weightVerification,
    telemetryReadings,
    kilnStartTime:          kilnStart.toISOString(),
    kilnEndTime:            kilnEnd.toISOString(),
    peakPrimaryChamberTempC:   peakPrimary,
    peakSecondaryChamberTempC: peakSecondary,
    totalAshMassKg:         ashMassKg,
    ashDisposalWaybill,
    destroyedBatchIds,
    destroyedBatchNumbers,
    sourcePharmacyIds,
    totalUnitsDestroyed,
    plantManagerId,
    plantManagerName,
    plantManagerSignatureHash: sigHash,
    certificateId:          certId,
    certificateHash,
    blockchainTxId,
    completedAt:            kilnEnd.toISOString(),
    status:                 weightPassed ? "COMPLETED" : "WEIGHT_DISPUTE",
  };

  try {
    const payload = { ...record };
    payload.weightVerification = JSON.stringify(payload.weightVerification) as any;
    payload.telemetryReadings = JSON.stringify(payload.telemetryReadings) as any;
    payload.destroyedBatchIds = JSON.stringify(payload.destroyedBatchIds) as any;
    payload.destroyedBatchNumbers = JSON.stringify(payload.destroyedBatchNumbers) as any;
    payload.sourcePharmacyIds = JSON.stringify(payload.sourcePharmacyIds) as any;

    await fetch("http://localhost:8081/api/kiln/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("Backend /api/kiln/run unreachable");
  }

  // ── TERMINAL STATUS COMMITMENT — permanent, irreversible ────────────────
  for (const bId of destroyedBatchIds) {
    state.updateBatch(bId, { currentStatus: "DESTROYED", currentQuantity: 0 });
    state.addTimelineEvent(bId, {
      eventId: "E-" + Date.now() + bId,
      eventType: "DESTRUCTION_COMPLETED",
      status: "COMPLETED",
      timestamp: kilnEnd.toISOString(),
      actor: `${ewtn.cbwtfName} — Kiln Operator ${supervisorId}`,
      quantity: 0,
    });
  }

  state.addFinalIncinerationRecord(record);
  state.updateEWTN(ewtnId, { status: "INCINERATED", pickupConfirmedAt: kilnStart.toISOString() });

  state.addNotification({
    id: "N-" + Date.now(),
    type: "DESTRUCTION_COMPLETED",
    title: "🔥 Final Incineration Complete — Loop Closed",
    message: `${recordId} · ${destroyedBatchNumbers.length} batch(es) · ${totalUnitsDestroyed} units → STATUS_DESTROYED · Cert: ${certId}`,
    severity: "INFO",
    read: false,
    createdAt: new Date().toISOString(),
  });

  return record;
};

/** Get all final incineration records */
export const getFinalIncinerationRecords = async (): Promise<FinalIncinerationRecord[]> => {
  await delay(200);
  ensureSeeded();
  return useSharedStore.getState().finalIncinerationRecords;
};
