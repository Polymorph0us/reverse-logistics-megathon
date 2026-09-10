import type { BatchPassport, FraudAlert, ReturnRequest, DestructionCertificate } from "@/api/types";

export const SEED_BATCHES: BatchPassport[] = [];

export const SEED_ALERTS: FraudAlert[] = [];

export const SEED_RETURNS: ReturnRequest[] = [];

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
