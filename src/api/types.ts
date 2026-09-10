export interface User {
  id: string;
  name: string;
  email: string;
  role: "RETAILER" | "DISTRIBUTOR" | "MANUFACTURER" | "WASTE_FACILITY" | "REGULATOR" | "ADMIN";
  organizationId: string;
  organizationName: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardKPIs {
  totalBatches: number;
  activeBatches: number;
  expiringSoon: number;
  expired: number;
  returnsPending: number;
  inTransit: number;
  awaitingDestruction: number;
  destroyed: number;
  fraudAlerts: number;
  criticalAlerts: number;
}

export interface TimelineEvent {
  eventId: string;
  eventType: string; // "BATCH_CREATED" | "EXPIRY_ALERT" | "RETURN_INITIATED" | "DISTRIBUTOR_RECEIVED" | etc.
  status: string;
  timestamp: string;
  actor: string;
  location?: string;
  quantity?: number;
}

export interface BatchPassport {
  batchId: string;
  product: { productId: string; name: string; genericName: string; manufacturer: string };
  batchNumber: string;
  manufacturingDate: string; // ISO date
  expiryDate: string;
  currentStatus: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "RETURN_INITIATED" | "WITH_DISTRIBUTOR" | "WITH_MANUFACTURER" | "CONDITION_DENATURED_CONDEMNED" | "SCHEDULED_FOR_DESTRUCTION" | "DESTROYED" | "CLOSED" | "DISPUTED";
  currentQuantity: number;
  originalQuantity: number;
  unit: string;
  currentOwner: { organizationId: string; organizationName: string; role: string };
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  timeline: TimelineEvent[];
}

export interface ReturnRequest {
  returnId: string;
  batchId: string;
  batchNumber: string;
  productName: string;
  requestedQuantity: number;
  status: string;
  initiatedBy: string;
  createdAt: string;
  pickupStatus: "PENDING" | "SCHEDULED" | "COMPLETED";
  condition?: string;
  consignmentCode?: string;
  sealToken?: string;
  grossWeightGrams?: number;
  photoUrl?: string;
  handshakeOtp?: string;
  otpExpiresAt?: number;
  geoVerified?: boolean;
  geoCoordinates?: { lat: number; lng: number };
  transitStatus?: "PACKED" | "HANDOFF_PENDING" | "IN_TRANSIT" | "RECEIVED" | "DISPUTE_WEIGHT_MISMATCH" | "CONSOLIDATED";
  distributorWeightGrams?: number;
  weightDeltaPercent?: number;
  hashTxId?: string;
  // Layer 3: Master Crate Consolidation
  masterConsignmentId?: string;  // e.g. MCM-2025-IND-8910
  merkleLeafHash?: string;       // SHA-256 leaf hash for this return in the Merkle tree
  consolidatedAt?: string;       // ISO timestamp when included in MCM
}

export interface ReceiveReturnResponse {
  returnId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  difference: number;
  reconciliationStatus: "MATCHED" | "DISCREPANCY";
  riskLevel: string;
  status: string;
}

export interface DestructionCertificate {
  certificateId: string;
  batchId: string;
  quantityDestroyed: number;
  destructionDate: string;
  facility: { id: string; name: string };
  certificateHash: string;
  status: "DESTROYED";
  blockchainTxId: string;
  // Layer 4 extension
  linkedBatchNumbers?: string[];   // Batch numbers this certificate covers
  denaturedTagIds?: string[];      // References to pre-destruction denaturing events
  blindScanVerified?: boolean;     // Whether blind-scan reconciliation was passed
  blindScanDiscrepancies?: number; // Count of bags with hash mismatches at blind scan
}

export interface FraudAlert {
  alertId: string;
  type: "DESTROYED_BATCH_REENTRY" | "EXPIRED_BATCH_SALE" | "QUANTITY_MISMATCH" | "UNKNOWN_BATCH" | "IDENTITY_MISMATCH" | "IMPOSSIBLE_MOVEMENT" | "DUPLICATE_BATCH" | "SUSPICIOUS_REENTRY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  batchId: string;
  batchNumber: string;
  detectedAt: string;
  location: string;
  organization: string;
  message: string;
}

export interface BatchVerifyResponse {
  allowSale: boolean;
  status: BatchPassport["currentStatus"] | "UNKNOWN";
  riskLevel: BatchPassport["riskLevel"];
  message: string;
}

export interface RegulatorDashboard {
  totalManufacturers: number;
  totalDistributors: number;
  totalRetailers: number;
  totalTrackedBatches: number;
  expiredBatches: number;
  returnsInProgress: number;
  destroyedBatches: number;
  fraudAlerts: number;
  criticalAlerts: number;
  openInvestigations: number;
}

export interface Notification {
  id: string;
  type: "EXPIRY_ALERT" | "RETURN_CREATED" | "RETURN_RECEIVED" | "QUANTITY_DISCREPANCY" | "DESTRUCTION_SCHEDULED" | "DESTRUCTION_COMPLETED" | "FRAUD_ALERT" | "BATCH_REENTRY";
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  read: boolean;
  createdAt: string;
}

export interface BlockchainProof {
  blockchainStatus: "VERIFIED" | "PENDING";
  transactionId: string;
  blockNumber: number;
  network: string;
  recordHash: string;
  verifiedAt: string;
}

// Layer 3: Master Consignment Manifest (MCM) — Merkle-sealed crate record
export interface MasterConsignment {
  mcmId: string;                    // e.g. MCM-2025-IND-8910
  distributorId: string;
  manufacturerTarget: string;       // OEM receiving the crate
  containedReturnIds: string[];     // All ReturnRequest IDs in this crate
  merkleRoot: string;               // SHA-256 Merkle root of all leaf hashes
  merkleTree: string[][];           // Full tree levels for audit (level 0 = leaves)
  totalQuantity: number;
  totalWeightGrams: number;
  createdAt: string;
  status: "SEALED" | "IN_TRANSIT_TO_OEM" | "RECEIVED_BY_OEM" | "BLIND_SCAN_PASS" | "BLIND_SCAN_DISPUTE";
  transitHashTxId?: string;         // Hash chain ID logged at seal time
  receivedAt?: string;
  oemReceiverNote?: string;
}

// Layer 4: Pre-destruction Denaturing Tag (CDSCO-witnessed chemical rendering)
export type DenaturationAgent =
  | "METHYLENE_BLUE_DYE"      // Methylene Blue Indelible Dye
  | "ACTIVATED_CHARCOAL"      // Activated Charcoal Slurry
  | "SODIUM_HYDROXIDE"        // Sodium Hydroxide Crushed Deactivator
  | "CRUSH_PUNCH"             // Physical crush / punch
  | "SOLVENT_SOAK";           // Solvent dissolution

export interface DenaturedBatchTag {
  tagId: string;                   // e.g. DNT-20250910-8K2M
  batchId: string;
  batchNumber: string;
  denaturedAt: string;
  agent: DenaturationAgent;        // Chemical / physical method used
  agentLotNumber?: string;         // Lot number of the denaturing chemical
  witnessOfficerId: string;        // CDSCO witness officer ID (mandatory)
  witnessOfficerName: string;      // Full name of CDSCO officer
  photoEvidenceHash: string;       // SHA-256 of denaturing photo evidence
  photoUrl?: string;               // Base64 or URL of the photo
  quantityDenatured: number;       // Units physically denatured
  weightKg: number;                // Net mass of denatured stock in kg
  status: "PENDING" | "CONFIRMED";
}

// Layer 4: Electronic Waste Transfer Note (E-WTN)
// Official document connecting Manufacturer ↔ CBWTF incinerator
export interface ElectronicWasteTransferNote {
  ewtnId: string;                  // e.g. EWTN-2025-RAJ-5892
  denaturedTagId: string;          // Reference to confirmed DenaturedBatchTag
  batchId: string;
  batchNumber: string;

  // CBWTF Facility Details
  cbwtfName: string;               // e.g. EcoWaste Solutions CBWTF
  cbwtfRegNumber: string;          // CPCB Reg #CBWTF-RAJ-2019
  cbwtfAddress: string;

  // Hazmat Vehicle & Driver
  vehicleNumber: string;           // e.g. RJ-14-GA-9021
  driverName: string;
  hazmatLicenseNumber: string;

  // Logistics
  scheduledPickupStart: string;    // ISO datetime (pickup window start)
  scheduledPickupEnd: string;      // ISO datetime (pickup window end)
  totalNetMassKg: number;          // Total net waste mass in kg
  wasteCategory: string;           // e.g. "Category 4 — Expired Pharmaceuticals"

  createdAt: string;
  status: "SCHEDULED" | "IN_TRANSIT_TO_CBWTF" | "RECEIVED_AT_CBWTF" | "INCINERATED";
  pickupConfirmedAt?: string;
}

// Layer 4: Incineration Temperature Log (mandatory for certificate issuance)
export interface IncinerationLog {
  logId: string;
  ewtnId: string;
  batchId: string;
  primaryChamberTempC: number;     // Must be ≥ 850°C
  secondaryChamberTempC: number;   // Must be ≥ 1050°C (dual-chamber standard)
  incinerationStartTime: string;
  incinerationEndTime: string;
  ashDisposalWaybill: string;      // e.g. ASH-WB-2025-0042
  operatorId: string;
  passed: boolean;                 // true if both chambers meet threshold
  recordedAt: string;
}

// Layer 4: Gated Destruction Certificate — CDSCO Form-XIX Green Disposal Certificate
export interface DestructionCertificate {
  certificateId: string;           // e.g. CERT-XIX-2025-00142
  batchId: string;
  batchNumber: string;
  quantityDestroyed: number;       // Volume-locked: CANNOT exceed physically verified quantity
  verifiedReceivedQuantity: number; // Gate: physically verified quantity from blind scan
  destructionDate: string;
  facility: { id: string; name: string; regNumber: string };
  status: "DESTROYED";

  // Gate references (all must be present to issue certificate)
  blindScanVerified: boolean;      // Gate 1: Blind inward receipt confirmed
  denaturedTagId: string;          // Gate 2: Denaturing proof photo confirmed
  ewtnId: string;                  // Gate 3: E-WTN pickup scheduled
  incinerationLogId: string;       // Gate 4: Temperature log ≥ 1050°C verified

  // Incineration details
  primaryChamberTempC: number;
  secondaryChamberTempC: number;
  ashDisposalWaybill: string;

  // Cryptographic proof
  certificateHash: string;         // SHA-256 of all fields
  blockchainTxId: string;          // Key-value hash chain Tx ID
  issuedByOfficerId: string;       // CBWTF authorizing officer ID

  // Optional extras
  linkedBatchNumbers?: string[];
  denaturedTagIds?: string[];
  blindScanDiscrepancies?: number;
}

// Layer 4: Blind Scan Result from OEM intake
export interface BlindScanResult {
  mcmId: string;
  scannedBagIds: string[];         // All bag/consignment codes scanned at OEM
  expectedBagIds: string[];        // IDs from the MCM manifest
  missingBags: string[];           // In manifest but not scanned
  extraBags: string[];             // Scanned but not in manifest
  hashMismatches: string[];        // Bags whose leaf hash doesn't match logged hash
  passed: boolean;
  scannedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Layer 5: Final Incineration at Authorized CBWTF (Loop Closure)
// ═══════════════════════════════════════════════════════════════════════════

/** Single reading from the kiln's continuous load-cell + temperature sensor */
export interface KilnTelemetryReading {
  readingId: string;
  timestamp: string;
  hopperWeightKg: number;         // Live load-cell reading (kg)
  primaryChamberTempC: number;    // Real-time primary chamber temperature
  secondaryChamberTempC: number;  // Real-time secondary chamber temperature
  burnPhase: "LOADING" | "IGNITION" | "FULL_BURN" | "BURNOUT" | "COMPLETE";
}

/** Weight-to-energy tolerance check (hopper vs Layer 3/4 recorded weight) */
export interface KilnWeightVerification {
  mcmId: string;
  ewtnId: string;
  loggedWeightKg: number;          // Weight recorded at Layer 3 consolidation
  hopperWeightKg: number;          // Actual load-cell weight at feeder hopper
  deltaKg: number;                 // Absolute difference
  deltaPercent: number;            // Percentage deviation
  tolerancePercent: number;        // Allowed tolerance (default 5% for thermal loss)
  passed: boolean;                 // true if |delta| ≤ tolerance
  checkedAt: string;
}

/** Terminal loop-closure record — commits ALL batches to DESTROYED permanently */
export interface FinalIncinerationRecord {
  recordId: string;               // e.g. FIR-2025-CBWTF-00421
  ewtnId: string;
  mcmId: string;

  // Geotagged location of feeder conveyor scan
  facilityName: string;
  facilityRegNumber: string;
  geoLat: number;
  geoLng: number;
  geoAddress: string;

  // Master Crate QR scan at feeder conveyor
  masterCrateQrScannedAt: string;
  masterCrateQrScannedBy: string; // Supervisor ID

  // Weight telemetry
  weightVerification: KilnWeightVerification;
  telemetryReadings: KilnTelemetryReading[];

  // Incineration outcome
  kilnStartTime: string;
  kilnEndTime: string;
  peakPrimaryChamberTempC: number;
  peakSecondaryChamberTempC: number;
  totalAshMassKg: number;         // Residual ash weight
  ashDisposalWaybill: string;

  // All destroyed batches — TERMINAL STATUS COMMITMENT
  destroyedBatchIds: string[];
  destroyedBatchNumbers: string[];
  sourcePharmacyIds: string[];    // Original retailer org IDs
  totalUnitsDestroyed: number;

  // Plant manager SHA-256 digital signature
  plantManagerId: string;
  plantManagerName: string;
  plantManagerSignatureHash: string; // SHA-256(recordId|plantManagerId|timestamp|merkleRoot)

  // Auto-compiled certificate
  certificateId: string;          // e.g. FIR-CERT-2025-CBWTF-00421
  certificateHash: string;        // SHA-256 of entire record payload
  blockchainTxId: string;

  completedAt: string;
  status: "IN_PROGRESS" | "COMPLETED" | "WEIGHT_DISPUTE";
}
