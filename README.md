# ReversePass 🚀

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

**ReversePass** is a high-performance, cryptographic reverse pharmaceutical logistics platform. It tracks the return lifecycle of expired or recalled medicines from retailers back to manufacturers, ensuring traceability, preventing counterfeit re-entry, and automatically generating verifiable Proof-of-Destruction certificates.

## 🌟 Why ReversePass?
Pharmaceutical reverse supply chains are notoriously opaque, making them prime targets for fraud, skimming, and unauthorized reselling. Existing solutions rely on heavy, slow blockchains or unverified paper trails. 

**ReversePass solves this by using:**
- **Digital Medicine Passports** for tracking individual batches.
- **Deterministic SHA-256 Hashing** for Master Consignment Manifests (MCM) to guarantee structural integrity during transit without the overhead of Hyperledger Fabric.
- **Automated Fraud Detection** for quantity mismatches and suspicious return patterns.
- **Strict Idempotency & Optimistic Locking** to ensure data consistency and prevent race conditions across thousands of simultaneous supply chain scans.

## 🛠 Prerequisites

- **Java 17+**
- **Maven 3.8+**
- **PostgreSQL 15+**

## 💻 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Polymorph0us/reverse-logistics-megathon.git
   cd reverse-logistics-megathon/backend
   ```

2. **Configure PostgreSQL:**
   Create a local database or run a quick Postgres Docker container:
   ```bash
   docker run --name reversechain-db -e POSTGRES_DB=reversechaindb -e POSTGRES_USER=rc_user -e POSTGRES_PASSWORD=rc_password -p 5433:5432 -d postgres:15
   ```
   *(Note: The application uses port 5433 for Postgres by default to avoid conflicts).*

3. **Build and start the application:**
   ```bash
   mvn clean install -DskipTests
   mvn spring-boot:run
   ```
   *Flyway migrations will automatically run and seed the database with demo organizations and users.*

## 🚀 Usage / Workflow

Once running, access the Swagger UI to view and interact with all APIs:
**[http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)**

### Core Supply Chain Flow

1. **Retailer Scans Medicine Passport:**
   Retrieves dynamic batch data (Expiry, Risk Level, Manufacturer).
2. **Distributor Creates TER-Bag:**
   Aggregates returned medicines into Tracked Entity Return (TER) Bags.
3. **Consolidation into MCM:**
   Distributor groups multiple TER-Bags into a Master Consignment Manifest (MCM) for bulk shipping.
4. **Cryptographic Sealing:**
   The MCM is "sealed". The system generates a deterministic `SHA-256` hash of all contents and locks it.
   ```bash
   curl -X POST http://localhost:8081/api/consignments/{mcmId}/seal \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"sealId": "SEAL-1234"}'
   ```
5. **Manufacturer Receipt & Verification:**
   Manufacturer receives the shipment and inputs the physical seal ID. The system recalculates the hash and compares it against the locked state. If there's a mismatch, a `COMPROMISED` alert is fired.
6. **Destruction & PDF Certification:**
   The verified batch is destroyed. The system generates a QR-encoded, dynamically generated PDF Certificate of Destruction.

## 🛡 System Architecture & Hardening

We engineered ReversePass to be robust against concurrent network failures and high-throughput attacks:

- **Strict Organization Isolation (IDOR Prevention):** Endpoints enforce strict checks to ensure distributors/retailers cannot access consignments or TER-bags belonging to competitors.
- **Idempotent Transitions:** Dispatch, Seal, and Receive network requests are strictly idempotent—network retries will cleanly return existing state without duplicate side-effects.
- **Concurrency Safety:** Core entities (`ReturnBag`, `MasterConsignment`, `Dispute`) employ Spring Data JPA `@Version` optimistic locking to prevent parallel processing anomalies (`409 Conflict`).
- **N+1 Query Elimination:** Dashboards and regulator views rely on optimized, index-backed `COUNT` and aggregate lookups, enabling `O(1)` analytical dashboard loading regardless of dataset size.

## 📜 License

This project is licensed under the [MIT License](LICENSE).
