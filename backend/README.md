# Pharma Reverse Chain Compliance Backend

A Spring Boot backend for the Pharma Reverse Chain Compliance & Anti-Counterfeit Platform. This backend provides the core functionality to track a pharmaceutical batch across its reverse-logistics lifecycle, reconcile returns, verify destruction, and detect fraudulent re-entry.

## Technology Stack
- Java 17
- Spring Boot 3.3.4
- Spring Data JPA
- Spring Security (JWT)
- PostgreSQL 15
- Flyway (Database Migrations)
- Maven

## Prerequisites
- Docker & Docker Compose
- JDK 17
- Maven

## Setup & Running Locally

1. **Start PostgreSQL Database**
   ```bash
   docker-compose up -d
   ```
   This starts a local PostgreSQL instance on port `5433` with database `reversechaindb`.

2. **Environment Variables**
   The application uses environment variables for configuration. You can run the application with defaults, or override them:
   ```env
   PORT=8081
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/reversechaindb
   SPRING_DATASOURCE_USERNAME=rc_user
   SPRING_DATASOURCE_PASSWORD=rc_password
   JWT_SECRET=4d284f18166d48259f63abf5bc439d57a9e52e468e82fa08842af58df24b17e4
   ```

3. **Run the Application**
   ```bash
   mvn spring-boot:run
   ```
   Flyway will automatically apply migrations (`V1__init.sql`) and seed the database (`V2__seed_data.sql`).

4. **Access API Documentation**
   Swagger UI is available at: [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)

## Demo Scenario: End-to-End Flow

The following scenario demonstrates a retailer initiating a return, a distributor receiving it with a discrepancy, the manufacturer receiving it, scheduling destruction, and finally a verification check that detects fraudulent re-entry.

The seed data provides an expiring batch with number `ABC123`.

### 1. Login as Retailer (Charlie)
```bash
curl -X POST http://localhost:8081/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"charlie@citypharmacy.com", "password":"password"}'
```
*Extract the `token` from the response for the next step.*

### 2. Retailer Initiates Return
```bash
curl -X POST http://localhost:8081/api/returns \
-H "Authorization: Bearer <RETAILER_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "batchId": "88888888-8888-8888-8888-888888888882",
  "requestedQuantity": 100,
  "reason": "Expiring Soon"
}'
```
*Extract the `returnId` from the response (e.g., `123e4567-e89b-12d3-a456-426614174000`).*

### 3. Login as Distributor (Bob)
```bash
curl -X POST http://localhost:8081/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"bob@natdist.com", "password":"password"}'
```
*Extract the `token` from the response.*

### 4. Distributor Receives Return (with discrepancy)
```bash
curl -X POST http://localhost:8081/api/returns/<RETURN_ID>/receive \
-H "Authorization: Bearer <DISTRIBUTOR_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "receivedQuantity": 94,
  "condition": "Box damaged, 6 missing"
}'
```
*The batch is now `DISPUTED` and `HIGH` risk level.*

### 5. Login as Manufacturer (Alice)
```bash
curl -X POST http://localhost:8081/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"alice@pharmacorp.com", "password":"password"}'
```
*Extract the `token` from the response.*

### 6. Manufacturer Receives Return
```bash
curl -X POST http://localhost:8081/api/returns/<RETURN_ID>/manufacturer-receive \
-H "Authorization: Bearer <MANUFACTURER_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "receivedQuantity": 94,
  "condition": "Confirmed 94 received"
}'
```
*The batch is now `WITH_MANUFACTURER`.*

### 7. Manufacturer Schedules Destruction
```bash
curl -X POST http://localhost:8081/api/destruction/schedule \
-H "Authorization: Bearer <MANUFACTURER_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "batchId": "88888888-8888-8888-8888-888888888882",
  "quantity": 94,
  "wasteFacilityId": "44444444-4444-4444-4444-444444444441",
  "scheduledDate": "2025-12-01"
}'
```
*Extract the `destructionId` from the response.*

### 8. Confirm Destruction (Waste Facility or Manufacturer)
```bash
curl -X POST http://localhost:8081/api/destruction/<DESTRUCTION_ID>/confirm \
-H "Authorization: Bearer <MANUFACTURER_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "quantityDestroyed": 94,
  "destructionDate": "2025-12-01T10:00:00",
  "destructionMethod": "Incineration",
  "facilityLicense": "FAC-12345"
}'
```
*The batch is marked `DESTROYED` and added to the Invalid Registry.*

### 9. Verify Batch (Fraud Detection)
```bash
curl -X POST http://localhost:8081/api/batches/verify \
-H "Content-Type: application/json" \
-d '{
  "manufacturerId": "11111111-1111-1111-1111-111111111111",
  "batchNumber": "ABC123",
  "manufacturingDate": "2023-06-01",
  "expiryDate": "2026-06-21",
  "location": "Some other pharmacy"
}'
```
*Response shows `allowSale: false` and `DESTROYED_BATCH_REENTRY` fraud alert created.*
