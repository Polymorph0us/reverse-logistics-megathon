# Reverse Logistics Megathon - Architectural Context

## Overview
The Pharma Reverse Chain Compliance & Anti-Counterfeit Platform is a specialized system built for pharmaceutical reverse logistics, adhering strictly to the CDSCO 2025 drug disposal mandates. The backend is implemented as a Spring Boot microservice, integrating with a PostgreSQL relational database for local state management and a Hyperledger Fabric blockchain for immutable, verifiable transaction ledgers.

## System Architecture
The application adheres to a clean, multi-tier architectural pattern.

1.  **Controllers (API Layer)**: Exposes RESTful API endpoints secured by JWT-based RBAC authentication (`SecurityConfig`). All public-facing data is exposed exclusively via Data Transfer Objects (DTOs), mapping from internal JPA Entities, protecting internal domain shapes.
2.  **Services (Business Logic Layer)**: Coordinates domain interactions. Crucial flows like state transitions and validation constraints are strictly localized here.
3.  **Repositories (Persistence Layer)**: Spring Data JPA abstractions interfacing with PostgreSQL.
4.  **Blockchain Layer**: An abstraction interface (`BlockchainService`) enabling the platform to seamlessly transition between a local mock implementation (`LocalBlockchainService`) for rapid development/testing, and an actual Hyperledger Fabric network (`FabricBlockchainService`) for production environments.

## Core Features & Workflows
*   **Batch State Machine**: Strict, monotonic progression of drug batches (e.g., `MANUFACTURED` -> `IN_TRANSIT` -> `RECEIVED` -> `RETURN_REQUESTED` -> ... -> `SCHEDULED_FOR_DESTRUCTION` -> `DESTROYED`).
*   **Destruction Verification**: Generation of cryptographic Destruction Certificates utilizing OpenPDF and ZXing for QR codes. These certificates are immutably registered on the blockchain.
*   **Anti-Fraud and Compliance**: Active monitoring and alerting for re-entry attempts of destroyed goods. Integrates automated compliance scoring and risk level assessments.

## Key Technical Decisions
*   **DTO First**: Controllers operate using request and response DTOs, isolating internal domain changes from external API consumers.
*   **Fail-Fast Blockchain Operations**: All interactions with the ledger are guaranteed. There are no silent fallbacks; if Fabric is required but unavailable, the transaction rolls back synchronously.
*   **Reconciliation System**: A daemon process (`FabricEventListener`) actively listens for ledger events to asynchronously synchronize state anomalies.

## Data Schema Synopsis
*   `Batch`: Central entity tracking pharmaceutical batches.
*   `ReturnRecord`: Audit trail of logistical returns from distributors or pharmacies.
*   `DestructionRecord`: Records detailing the planned or executed physical destruction of batches.
*   `Certificate`: Cryptographic proof of destruction, containing verifiable hashes and blockchain TxIDs.
*   `FraudAlert`: Logged instances of suspicious activity, such as attempting to verify a destroyed batch.
