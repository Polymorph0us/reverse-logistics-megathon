# ReversePass 🚀

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

**ReversePass** is a high-performance, cryptographic full-stack platform for pharmaceutical reverse logistics. It tracks the return lifecycle of expired or recalled medicines from retailers back to manufacturers, preventing counterfeit re-entry, resolving quantity disputes, and automatically generating verifiable Proof-of-Destruction certificates.

## 🌟 Why ReversePass?
Pharmaceutical reverse supply chains are incredibly opaque, making them prime targets for fraud, skimming, and unauthorized reselling. Existing solutions rely on expensive hardware or heavy blockchains. 

**ReversePass solves this by combining a modern React frontend with a secure Spring Boot backend using:**
- **Digital Medicine Passports** for tracking individual batches via QR codes.
- **Deterministic SHA-256 Hashing** for Master Consignment Manifests (MCM) to cryptographically guarantee structural integrity during transit without blockchain bloat.
- **Automated Fraud Detection** for quantity mismatches and suspicious return patterns.
- **Strict Idempotency & Optimistic Locking** to ensure data consistency and prevent race conditions across thousands of simultaneous supply chain scans.

## 🏗️ System Architecture

ReversePass is a monorepo containing a modern SPA frontend and a robust Java microservice backend.

- **Frontend (`/`)**: A reactive, single-page application built with **React 19**, **Vite**, **Tailwind CSS**, and **shadcn/ui**. Features role-specific dashboards (Retailer, Distributor, Manufacturer, Regulator), interactive charts using **Recharts**, and state management via **Zustand**.
- **Backend (`/backend`)**: A secure **Spring Boot 3** REST API powered by **PostgreSQL 15**. It handles JWT role-based access control, idempotent dispatch state machines, high-performance indexed queries (N+1 eliminated), and on-the-fly PDF generation via **OpenPDF** and **ZXing**.

## 🛠 Prerequisites

- **Node.js 20+**
- **Java 17+**
- **Maven 3.8+**
- **PostgreSQL 15+** (or Docker)

## 💻 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Polymorph0us/reverse-logistics-megathon.git
   cd reverse-logistics-megathon
   ```

### Backend Setup
1. **Start the Database:**
   Run a quick Postgres Docker container matching the default credentials:
   ```bash
   docker run --name reversechain-db -e POSTGRES_DB=reversechaindb -e POSTGRES_USER=rc_user -e POSTGRES_PASSWORD=rc_password -p 5433:5432 -d postgres:15
   ```
2. **Start the API:**
   ```bash
   cd backend
   mvn clean install -DskipTests
   mvn spring-boot:run
   ```
   *Flyway migrations will automatically run and seed the database with demo organizations and users.*

### Frontend Setup
1. **Install dependencies:**
   Open a new terminal at the project root (`reverse-logistics-megathon`):
   ```bash
   npm install
   ```
2. **Start the dev server:**
   ```bash
   npm run dev
   ```
   *Access the web app at **http://localhost:5173***.

## 🚀 Usage / Workflow

### Frontend Dashboards
Navigate to `http://localhost:5173` and log in using one of the pre-seeded demo accounts (Password for all: `password123`):
- **Retailer:** `charlie@citypharmacy.com` (Initiates Returns)
- **Distributor:** `bob@natdist.com` (Consolidates TER-Bags into MCMs)
- **Manufacturer:** `alice@pharmacorp.com` (Verifies Seals & Receives)
- **Regulator:** `david@fda.gov` (Views compliance metrics and fraud alerts)

### Backend API Documentation
Once the backend is running, explore the interactive API documentation at:
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
   # Example API interaction for sealing an MCM
   curl -X POST http://localhost:8081/api/consignments/{mcmId}/seal \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"sealId": "SEAL-1234"}'
   ```
5. **Manufacturer Receipt & Verification:**
   Manufacturer receives the shipment and inputs the physical seal ID. The system recalculates the hash and compares it against the locked state. If there's a mismatch, a `COMPROMISED` alert is fired.
6. **Destruction & PDF Certification:**
   The verified batch is destroyed. The system generates a QR-encoded, dynamically generated PDF Certificate of Destruction.

## 📜 License

This project is licensed under the [MIT License](LICENSE).
