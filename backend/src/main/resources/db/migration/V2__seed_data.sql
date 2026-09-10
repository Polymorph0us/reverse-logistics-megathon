-- Password for all seed users is 'password'
-- Hash: $2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq

-- Organizations
INSERT INTO organizations (id, name, type, license_number, city, state) VALUES
('11111111-1111-1111-1111-111111111111', 'PharmaCorp Inc', 'MANUFACTURER', 'MFG-1001', 'Mumbai', 'MH'),
('22222222-2222-2222-2222-222222222221', 'National C&F', 'C_AND_F', 'CF-2001', 'Mumbai', 'MH'),
('22222222-2222-2222-2222-222222222222', 'Regional Distributors', 'DISTRIBUTOR', 'DIST-2002', 'Pune', 'MH'),
('22222222-2222-2222-2222-222222222223', 'Local Wholesalers', 'WHOLESALER', 'WHL-2003', 'Pune', 'MH'),
('33333333-3333-3333-3333-333333333331', 'City Pharmacy', 'RETAILER', 'RET-3001', 'Pune', 'MH'),
('33333333-3333-3333-3333-333333333332', 'HealthPlus Store', 'RETAILER', 'RET-3002', 'Mumbai', 'MH'),
('44444444-4444-4444-4444-444444444441', 'EcoWaste Disposal', 'WASTE_FACILITY', 'WST-4001', 'Nagpur', 'MH'),
('55555555-5555-5555-5555-555555555551', 'CDSCO Regulator', 'REGULATOR', 'REG-5001', 'Delhi', 'DL');

-- Waste Facility Authorizations
INSERT INTO waste_facility_authorizations (id, facility_id, spcb_authorization_id, cbwtf_license_number, authorizing_authority, authorization_valid_from, authorization_valid_to) VALUES
('44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444441', 'SPCB/MH/2023/89', 'CBWTF-MH-902', 'Maharashtra Pollution Control Board', '2023-01-01', '2028-12-31');

-- Users
INSERT INTO users (id, name, email, password_hash, role, organization_id) VALUES
('66666666-6666-6666-6666-666666666661', 'Alice Manufacturer', 'alice@pharmacorp.com', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'MANUFACTURER', '11111111-1111-1111-1111-111111111111'),
('66666666-6666-6666-6666-666666666662', 'Bob C&F', 'bob@natcf.com', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'C_AND_F', '22222222-2222-2222-2222-222222222221'),
('66666666-6666-6666-6666-666666666663', 'Charlie Distributor', 'charlie@regdist.com', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'DISTRIBUTOR', '22222222-2222-2222-2222-222222222222'),
('66666666-6666-6666-6666-666666666664', 'Dave Wholesaler', 'dave@localws.com', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'WHOLESALER', '22222222-2222-2222-2222-222222222223'),
('66666666-6666-6666-6666-666666666665', 'Eve Pharmacy', 'eve@citypharmacy.com', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'RETAILER', '33333333-3333-3333-3333-333333333331'),
('66666666-6666-6666-6666-666666666666', 'Frank Waste', 'frank@ecowaste.com', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'WASTE_FACILITY', '44444444-4444-4444-4444-444444444441'),
('66666666-6666-6666-6666-666666666667', 'Grace Regulator', 'grace@cdsco.gov.in', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'REGULATOR', '55555555-5555-5555-5555-555555555551'),
('66666666-6666-6666-6666-666666666668', 'Mike MedRep', 'mike@pharmacorp.com', '$2a$10$n/P912O4LntVp.yFmZ.E9.O/eG6pXWp3.K8q43f2j.B03o.h4S1Pq', 'MEDICAL_REP', '11111111-1111-1111-1111-111111111111');

-- Products
INSERT INTO products (product_id, product_name, generic_name, brand_name, manufacturer_id, dosage_form, strength, unit_type) VALUES
('77777777-7777-7777-7777-777777777771', 'Paracetamol 500mg', 'Paracetamol', 'Crocin', '11111111-1111-1111-1111-111111111111', 'Tablet', '500mg', 'STRIP'),
('77777777-7777-7777-7777-777777777772', 'Amoxicillin 250mg', 'Amoxicillin', 'Amoxil', '11111111-1111-1111-1111-111111111111', 'Capsule', '250mg', 'BOTTLE');

-- Batches
INSERT INTO batches (batch_id, batch_number, product_id, manufacturer_id, manufacturing_date, expiry_date, original_quantity, current_quantity, unit, current_status, current_owner_id, risk_score, risk_level) VALUES
('88888888-8888-8888-8888-888888888881', 'P12345', '77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '2023-01-01', CURRENT_DATE + INTERVAL '12 days', 500, 420, 'STRIP', 'ACTIVE', '33333333-3333-3333-3333-333333333331', 0, 'LOW'),
('88888888-8888-8888-8888-888888888882', 'A98765', '77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '2021-01-01', '2023-01-01', 1000, 1000, 'BOTTLE', 'DESTROYED', '11111111-1111-1111-1111-111111111111', 0, 'LOW');

-- Tracking Records (Medicine Passports)
INSERT INTO tracking_records (tracking_id, batch_id, product_id, batch_number, manufacturer_id, manufacturing_date, expiry_date, current_holder, current_location, current_quantity, original_quantity, status, risk_level, risk_score, next_action) VALUES
('RP-IND-P12345', '88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777771', 'P12345', '11111111-1111-1111-1111-111111111111', '2023-01-01', CURRENT_DATE + INTERVAL '12 days', '33333333-3333-3333-3333-333333333331', 'Pune', 420, 500, 'EXPIRING_SOON', 'HIGH', 80, 'INITIATE_RETURN'),
('RP-IND-A98765', '88888888-8888-8888-8888-888888888882', '77777777-7777-7777-7777-777777777772', 'A98765', '11111111-1111-1111-1111-111111111111', '2021-01-01', '2023-01-01', '11111111-1111-1111-1111-111111111111', 'Mumbai', 0, 1000, 'DESTROYED', 'LOW', 0, 'CLOSED');

-- Movement Events
INSERT INTO movement_events (tracking_id, from_organization, to_organization, quantity_sent, quantity_received, difference, location, actor, event_type, notes) VALUES
('RP-IND-P12345', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 500, 500, 0, 'Mumbai', 'Alice', 'HANDOFF', 'Sent to C&F'),
('RP-IND-P12345', '22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 500, 500, 0, 'Pune', 'Bob', 'HANDOFF', 'Sent to Distributor'),
('RP-IND-P12345', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222223', 500, 500, 0, 'Pune', 'Charlie', 'HANDOFF', 'Sent to Wholesaler'),
('RP-IND-P12345', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333331', 420, 420, 0, 'Pune', 'Dave', 'HANDOFF', 'Sent to Pharmacy');

-- Invalid Registry
INSERT INTO invalid_registry (manufacturer_id, batch_number, manufacturing_date, expiry_date, invalidated_quantity, reason) VALUES
('11111111-1111-1111-1111-111111111111', 'A98765', '2021-01-01', '2023-01-01', 1000, 'DESTROYED_CERT_A98765');
