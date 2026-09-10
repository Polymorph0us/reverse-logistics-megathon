# Hyperledger Fabric Audit Ledger - Pharma Reverse Chain Compliance Platform

## 1. Overview & Architecture

The **Pharma Reverse Chain Compliance Platform** implements a **hybrid architecture**:
- **PostgreSQL** is the primary operational database storing users, organizations, medicines, batches, inventory, dispute files, and operational returns.
- **Hyperledger Fabric** is a permissioned, tamper-evident audit ledger recording critical batch lifecycle state transitions, SHA-256 event hash chains, and off-chain destruction certificate SHA-256 fingerprints.

```
+-------------------------------------------------------------+
|                  React Frontend (UI)                        |
+-------------------------------------------------------------+
                               |
                               | (HTTP / REST)
                               v
+-------------------------------------------------------------+
|                  Spring Boot Backend                        |
|                                                             |
|   +---------------------+        +----------------------+   |
|   |   PostgreSQL DB     |        | Fabric Gateway Java  |   |
|   | (Operational Store, |        | (gRPC Client, Hash   |   |
|   |  Invalid Registry)  |        |  Chaining & Events)  |   |
|   +---------------------+        +----------------------+   |
+---------------------------------------------|---------------+
                                              | (gRPC via TLS)
                                              v
+-------------------------------------------------------------+
|           Hyperledger Fabric Local Network                  |
|                                                             |
|   Channel: pharma-channel                                   |
|   Chaincode: pharma-contract                                |
|                                                             |
|   +------------------+  +------------------+  +-----------+ |
|   | ManufacturerMSP  |  |  DistributorMSP  |  |RetailerMSP| |
|   | (Peer 7051)      |  |  (Peer 8051)     |  |(Peer 9051)| |
|   +------------------+  +------------------+  +-----------+ |
|   +------------------+  +------------------+  +-----------+ |
|   | WasteFacilityMSP |  |  ControllerMSP   |  | Orderer   | |
|   | (Peer 10051)     |  |  (Peer 11051)    |  |(Port 7050)| |
|   +------------------+  +------------------+  +-----------+ |
+-------------------------------------------------------------+
```

---

## 2. Participating Organizations & Access Control (MSP)

Each organization has its own Membership Service Provider (MSP) and CA identities:

| Organization | MSP ID | Peer Port | Permitted Lifecycle Actions |
| :--- | :--- | :--- | :--- |
| **ManufacturerOrg** | `ManufacturerMSP` | `7051` | `createBatch`, `manufacturerReceive`, `sendForDisposal` |
| **DistributorOrg** | `DistributorMSP` | `8051` | `receiveReturn` (with quantity/diff verification) |
| **RetailerOrg** | `RetailerMSP` | `9051` | `initiateReturn` |
| **WasteFacilityOrg**| `WasteFacilityMSP` | `10051` | `confirmDestruction` (with PDF SHA-256 hash) |
| **ControllerOrg** | `ControllerMSP` | `11051` | `closeBatch`, audit queries, fraud investigation |

Access control is strictly enforced at the chaincode layer via `ctx.clientIdentity.getMSPID()`. Cross-organization execution is blocked.

---

## 3. Cryptographic Hash Chaining & Off-Chain Storage

- **Deterministic SHA-256 Hash Chain**:
  Each lifecycle event computes a canonical SHA-256 hash chaining back to the previous event:
  $$\text{eventHash} = \text{SHA-256}(\text{previousHash} + ":" + \text{canonicalEventPayload})$$
  Genesis events use a zeroed root hash (`0000000000000000000000000000000000000000000000000000000000000000`).

- **Off-Chain Destruction Certificate Hash**:
  Large PDFs/images are **never** stored on the blockchain. Instead:
  1. The PDF is stored in application storage/PostgreSQL.
  2. Spring Boot calculates `SHA-256(certificate.pdf)`.
  3. Only the 64-character hex hash, certificate ID, and destruction metadata are recorded on Fabric.
  4. Any subsequent verification recalculates the hash and verifies it against the immutable ledger.

---

## 4. Re-Entry & Counterfeit Detection Flow

1. When a batch completes its return and destruction cycle, its status is updated to `DESTROYED`/`CLOSED` on Fabric, and recorded in PostgreSQL's `InvalidRegistry`.
2. When any participating pharmacy attempts to bill or verify a batch:
   - Spring Boot queries PostgreSQL `InvalidRegistry`.
   - If present, the billing transaction is immediately **BLOCKED**.
   - `RiskLevel.CRITICAL` / `RiskLevel.HIGH` is triggered and a fraud alert is issued.
   - Fabric's immutable history can be queried via `GET /api/blockchain/batches/{batchId}/history` as legal evidence of prior destruction.

---

## 5. Directory Structure

```
fabric-network/
├── configtx/
│   └── configtx.yaml              # Channel configuration & profiles
├── connection-profiles/           # Gateway connection profiles
│   ├── connection-manufacturer.json
│   ├── connection-distributor.json
│   ├── connection-retailer.json
│   ├── connection-wastefacility.json
│   └── connection-controller.json
├── docker/
│   └── docker-compose-fabric.yml  # Docker definition for 5 peers, orderer, CA, CLI
├── organizations/
│   └── cryptogen/
│       └── crypto-config.yaml     # Organization topology & crypto specs
└── scripts/
    ├── network.ps1                # Windows PowerShell orchestration script
    └── network.sh                 # Linux/macOS Bash orchestration script
```

---

## 6. How to Run the Network

### Prerequisites
- **Docker Desktop** installed and running.
- **Node.js 18+** & **npm**.
- **Java 17** & **Maven**.

### Step 1: Start the Hyperledger Fabric Network
Open PowerShell and navigate to the `fabric-network/scripts/` directory:

```powershell
cd d:\Projects\reverse-logistics-megathon\fabric-network\scripts
.\network.ps1 up
```

This script will:
1. Verify Docker environment.
2. Generate cryptographic material using `cryptogen`.
3. Generate the genesis block and channel transaction using `configtxgen`.
4. Spin up the containers (`reversechain-orderer`, `peer0.manufacturer`, `peer0.distributor`, `peer0.retailer`, `peer0.wastefacility`, `peer0.controller`, `fabric-ca`, and `fabric-cli`).
5. Create and join `pharma-channel`.

### Step 2: Deploy the Chaincode
Once the network is running:

```powershell
.\network.ps1 deployChaincode
```

### Step 3: Run the Spring Boot Backend
In another terminal:

```powershell
cd d:\Projects\reverse-logistics-megathon\backend
mvn spring-boot:run
```

> **Note**: Spring Boot includes an automated fallback simulation cache. If Docker Fabric is offline, the backend remains 100% testable and operational while logging gateway connection status. To connect to real Docker Fabric, set `fabric.enabled: true` in `application.yml`.

### Step 4: Stop the Network
To stop all containers:

```powershell
.\network.ps1 down
```

---

## 7. Blockchain API Endpoints

Spring Boot exposes dedicated blockchain verification endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/blockchain/status` | Current Fabric Gateway connection & channel status |
| `GET` | `/api/blockchain/batches/{batchId}` | Query batch audit record from Fabric ledger |
| `GET` | `/api/blockchain/batches/{batchId}/history` | Retrieve complete chronological audit trail & hash chain |
| `POST` | `/api/blockchain/certificates/verify` | Verify off-chain certificate PDF hash against ledger |
| `POST` | `/api/batches/verify` | Re-entry & counterfeit detection check during pharmacy billing |
