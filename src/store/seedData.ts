import type { BatchPassport, FraudAlert, ReturnRequest, DestructionCertificate, OrganizationNode } from "@/api/types";

export const SEED_BATCHES: BatchPassport[] = [];

export const SEED_ALERTS: FraudAlert[] = [];

export const SEED_RETURNS: ReturnRequest[] = [];

export const SEED_DESTRUCTIONS: DestructionCertificate[] = [];

export const INITIAL_ORGANIZATIONS: OrganizationNode[] = [
  // 1. Manufacturers (OEMs)
  {
    id: "mfr-001",
    name: "Sun Pharmaceutical Industries Ltd",
    type: "MANUFACTURER",
    licenseNumber: "MFG-GJ-2018-09112",
    city: "Ahmedabad",
    state: "Gujarat",
    complianceScore: 99,
    active: true,
    contactEmail: "regulatory@sunpharma.in",
    contactPhone: "+91 79 6600 4400",
    registeredDate: "2021-03-15",
    address: "Plot 12-14, GIDC Industrial Estate, Halol, Gujarat"
  },
  {
    id: "mfr-002",
    name: "PharmaCorp India Innovations",
    type: "MANUFACTURER",
    licenseNumber: "MFG-MH-1001-4491",
    city: "Mumbai",
    state: "Maharashtra",
    complianceScore: 98,
    active: true,
    contactEmail: "compliance@pharmacorp.com",
    contactPhone: "+91 22 4190 2000",
    registeredDate: "2020-08-10",
    address: "Bandra Kurla Complex, CTS 420, Mumbai, MH"
  },
  {
    id: "mfr-003",
    name: "MediLife Makers Private Limited",
    type: "MANUFACTURER",
    licenseNumber: "MFG-MH-1002-8812",
    city: "Pune",
    state: "Maharashtra",
    complianceScore: 95,
    active: true,
    contactEmail: "quality@medilife.com",
    contactPhone: "+91 20 2740 5000",
    registeredDate: "2022-01-20",
    address: "MIDC Hinjewadi Phase-2, Pune, Maharashtra"
  },
  {
    id: "mfr-004",
    name: "Cipla Therapeutics Labs",
    type: "MANUFACTURER",
    licenseNumber: "MFG-KA-3310-1092",
    city: "Bangalore",
    state: "Karnataka",
    complianceScore: 97,
    active: true,
    contactEmail: "nodal@cipla.com",
    contactPhone: "+91 80 4010 3300",
    registeredDate: "2021-11-05",
    address: "Bommasandra Industrial Area, Hosur Road, Bangalore, KA"
  },

  // 2. Distributors (Logistics Hubs)
  {
    id: "dist-001",
    name: "ABC Distributors Central Logistics",
    type: "DISTRIBUTOR",
    licenseNumber: "DIST-DL-2001-7782",
    city: "New Delhi",
    state: "Delhi",
    complianceScore: 96,
    active: true,
    contactEmail: "admin@abcdistributors.in",
    contactPhone: "+91 11 2390 1122",
    registeredDate: "2021-06-12",
    address: "Okhla Phase-III Industrial Area, New Delhi, DL"
  },
  {
    id: "dist-002",
    name: "Regional Med Supply Logistics",
    type: "DISTRIBUTOR",
    licenseNumber: "DIST-KA-2002-9913",
    city: "Bangalore",
    state: "Karnataka",
    complianceScore: 94,
    active: true,
    contactEmail: "supply@regionalmed.in",
    contactPhone: "+91 80 2210 9988",
    registeredDate: "2022-04-18",
    address: "Yeshwanthpur Industrial Suburb, Bangalore, KA"
  },
  {
    id: "dist-003",
    name: "West Coast Pharma Hub",
    type: "DISTRIBUTOR",
    licenseNumber: "DIST-GJ-2003-4510",
    city: "Ahmedabad",
    state: "Gujarat",
    complianceScore: 93,
    active: true,
    contactEmail: "dispatch@westcoastlog.com",
    contactPhone: "+91 79 2658 9012",
    registeredDate: "2021-09-25",
    address: "Changodar Industrial Estate, Sanand Highway, Ahmedabad, GJ"
  },
  {
    id: "dist-004",
    name: "Apex Cold-Chain Logistics Hub",
    type: "DISTRIBUTOR",
    licenseNumber: "DIST-MH-4102-3312",
    city: "Bhiwandi",
    state: "Maharashtra",
    complianceScore: 98,
    active: true,
    contactEmail: "compliance@apexcoldchain.com",
    contactPhone: "+91 2522 667788",
    registeredDate: "2023-02-14",
    address: "Mankoli Logistics Park, Bhiwandi, Thane, MH"
  },

  // 3. Retailers (Pharmacies & Dispensing Nodes)
  {
    id: "ret-001",
    name: "Raj Pharmacy Jaipur Central",
    type: "RETAILER",
    licenseNumber: "RET-RJ-2022-5501",
    city: "Jaipur",
    state: "Rajasthan",
    complianceScore: 96,
    active: true,
    contactEmail: "raj@pharmacy.in",
    contactPhone: "+91 141 237 8899",
    registeredDate: "2022-05-10",
    address: "Shop 14, MI Road, Near Raj Mandir, Jaipur, RJ"
  },
  {
    id: "ret-002",
    name: "City Pharmacy Chemist & Druggist",
    type: "RETAILER",
    licenseNumber: "RET-MH-3001-4421",
    city: "Mumbai",
    state: "Maharashtra",
    complianceScore: 92,
    active: true,
    contactEmail: "charlie@citypharmacy.com",
    contactPhone: "+91 22 2411 9922",
    registeredDate: "2021-07-29",
    address: "Shop 4, Dr. Ambedkar Road, Dadar East, Mumbai, MH"
  },
  {
    id: "ret-003",
    name: "HealthPlus Medicare Corner",
    type: "RETAILER",
    licenseNumber: "RET-MH-3002-1189",
    city: "Pune",
    state: "Maharashtra",
    complianceScore: 91,
    active: true,
    contactEmail: "support@healthplus.com",
    contactPhone: "+91 20 2567 4321",
    registeredDate: "2022-10-04",
    address: "FC Road, Shivajinagar, Pune, MH"
  },
  {
    id: "ret-004",
    name: "Corner Drugstore & Dispensary",
    type: "RETAILER",
    licenseNumber: "RET-DL-3003-8820",
    city: "New Delhi",
    state: "Delhi",
    complianceScore: 94,
    active: true,
    contactEmail: "orders@cornerdrug.in",
    contactPhone: "+91 11 4155 6789",
    registeredDate: "2021-01-15",
    address: "Connaught Place Block M, New Delhi, DL"
  },
  {
    id: "ret-005",
    name: "Apollo Pharmacy Super Centre",
    type: "RETAILER",
    licenseNumber: "RET-TN-5521-9031",
    city: "Chennai",
    state: "Tamil Nadu",
    complianceScore: 99,
    active: true,
    contactEmail: "nodal@apollopharm.com",
    contactPhone: "+91 44 2829 0200",
    registeredDate: "2020-12-19",
    address: "Greams Road, Thousand Lights, Chennai, TN"
  },

  // 4. Bio-Medical Waste Facilities (CBWTF Incinerator Plants)
  {
    id: "wst-001",
    name: "EcoWaste Management CBWTF",
    type: "WASTE_FACILITY",
    licenseNumber: "CBWTF-WST-4001-MH",
    city: "Nagpur",
    state: "Maharashtra",
    complianceScore: 100,
    active: true,
    contactEmail: "admin@ecowaste.in",
    contactPhone: "+91 712 289 9000",
    registeredDate: "2020-03-01",
    address: "Butibori Industrial Area, Nagpur, Maharashtra (Kiln #1 & #2 Dual-Chamber)"
  },
  {
    id: "wst-002",
    name: "GreenEarth Bio-Incinerators Ltd",
    type: "WASTE_FACILITY",
    licenseNumber: "CBWTF-WST-8821-DL",
    city: "Okhla",
    state: "Delhi",
    complianceScore: 97,
    active: true,
    contactEmail: "operations@greenearth-cbwtf.org",
    contactPhone: "+91 11 2681 4455",
    registeredDate: "2021-08-16",
    address: "DDA Bio-Medical Waste Zone, Okhla Phase I, New Delhi, DL"
  },
  {
    id: "wst-003",
    name: "CleanCare Enviro Systems CBWTF",
    type: "WASTE_FACILITY",
    licenseNumber: "CBWTF-WST-9204-KA",
    city: "Peenya",
    state: "Karnataka",
    complianceScore: 98,
    active: true,
    contactEmail: "incinerator@cleancareenviro.com",
    contactPhone: "+91 80 2839 1234",
    registeredDate: "2022-02-28",
    address: "Peenya 2nd Stage, Bangalore, Karnataka (CPCB Auth #KA-BMW-2022-09)"
  }
];

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
