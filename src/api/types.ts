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
  currentStatus: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "RETURN_INITIATED" | "WITH_DISTRIBUTOR" | "WITH_MANUFACTURER" | "SCHEDULED_FOR_DESTRUCTION" | "DESTROYED" | "CLOSED" | "DISPUTED";
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
  status: "ACTIVE" | "EXPIRED" | "DESTROYED" | "UNKNOWN";
  riskLevel: "LOW" | "HIGH" | "CRITICAL";
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
