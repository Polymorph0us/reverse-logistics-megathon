# Reverse Logistics Megathon Backend Progress

## Phase 1: Unified Blockchain Architecture
- [x] Extracted `BlockchainService` interface and implemented `FabricBlockchainService` and `LocalBlockchainService` (Mock).
- [x] Configured `application.yml` and `application-local.yml`/`application-test.yml` to switch between `blockchain.mode=fabric` and `blockchain.mode=local`.
- [x] Updated `DestructionService` and `ReturnService` to use the injected `BlockchainService` bean.
- [x] Replaced `FabricGatewayServiceTest` with `LocalBlockchainServiceTest`.
- [x] Fixed all failing tests related to `FabricGatewayService` removal.
- [x] Ran `mvn clean test` successfully.

## Phase 2: Alert/Fraud System
- [x] Added `AlertStatus` enum, updated `AlertSeverity` with `HIGH` severity.
- [x] Updated `FraudAlert` entity to use `AlertStatus` instead of a boolean `resolved` field.
- [x] Expanded `FraudAlertRepository` with new query methods (`findByBatchId`, `findByStatus`, `findBySeverity`).
- [x] Created `AlertService` to manage centralized creation and deduplication of alerts.
- [x] Created `NotificationService` and `Notification` entity for persisted notifications.
- [x] Created `NotificationRepository` and `NotificationController` with endpoints to retrieve notifications by user/organization and mark as read.
- [x] Refactored `FraudDetectionService` to route through `AlertService` with a generic `generateAlert` method.
- [x] Updated return flows in `ReturnService` to trigger `HIGH` severity alerts for quantity discrepancies.
- [x] Created `FraudDetectionController` to expose `/api/fraud/alerts` endpoints.
- [x] Rewrote `RegulatorController.getInvestigationDetails` to fetch actual `FraudAlert` from repository and pull historical blockchain proof via `BlockchainService`.
- [x] Created DTOs: `FraudAlertResponse`, `NotificationResponse`, `InvestigationResponse`.
- [x] Created Flyway migration `V3__fraud_alerts_notifications.sql` to apply the database schema changes for `AlertStatus` (migrated boolean `resolved` to `status` varchar).
- [x] Resolved compilation errors in `NotificationController` and `FraudDetectionServiceTest`.
- [x] Ran `mvn clean test` successfully.

## Phase 3: Destruction Certificate System
- [x] Added `openpdf` (1.3.30) and `zxing` (3.5.1) dependencies to `pom.xml` for PDF generation and QR code creation.
- [ ] Expand `Certificate` entity
- [ ] Create `FileStorageService` interface + `LocalFileStorageService`
- [ ] Create `CertificatePdfService` (PDF generation + QR code)
- [ ] Rewrite `DestructionService.confirmDestruction` with full pipeline
- [ ] Update `ConfirmDestructionRequest` DTO
- [ ] Create `CertificateResponse`, `BlockchainProofResponse` DTOs
- [ ] Add certificate download + verification endpoints
- [ ] Add blockchain certificate verify endpoint
- [ ] Create Flyway migration V4
- [ ] Verify compilation + tests pass

## Phase 4: DTO Layer & Mock Elimination
- [ ] Create response DTOs: `BatchResponse`, `ReturnResponse`, `DestructionResponse`
- [ ] Update controllers to return DTOs
- [ ] Ensure no direct entity returns from controllers

## Phase 5: Supporting Systems
- [ ] Fix `GlobalExceptionHandler` consistent shape
- [ ] Tighten `SecurityConfig` RBAC
- [ ] Update `FabricEventListener` with reconciliation
- [ ] Secrets via env vars in configs

## Phase 6: Tests & Verification
- [ ] Expand test suite per Part 7 spec
- [ ] End-to-end integration test
- [ ] Create `context.md` and `progress.md` at repo root
- [ ] Manual demo verification
