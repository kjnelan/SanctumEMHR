-- Mindline Test Data - Users and Clients
-- Run this after the database schema is created

-- =====================================================
-- USERS (Clinicians and Admin)
-- =====================================================

-- Insert test users (all passwords are: TestPass123!)
INSERT INTO users (uuid, username, email, password_hash, first_name, last_name, user_type, is_active, is_provider, npi, created_at, updated_at) VALUES
-- Admin user
(UUID(), 'dr.admin', 'admin@mindline.test', '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV', 'Sarah', 'Administrator', 'admin', 1, 0, NULL, NOW(), NOW()),

-- Provider users (clinicians)
(UUID(), 'dr.smith', 'jsmith@mindline.test', '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV', 'John', 'Smith', 'provider', 1, 1, '1234567890', NOW(), NOW()),

(UUID(), 'dr.johnson', 'mjohnson@mindline.test', '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV', 'Maria', 'Johnson', 'provider', 1, 1, '1234567891', NOW(), NOW()),

(UUID(), 'dr.williams', 'dwilliams@mindline.test', '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV', 'David', 'Williams', 'provider', 1, 1, '1234567892', NOW(), NOW()),

(UUID(), 'dr.brown', 'jbrown@mindline.test', '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV', 'Jennifer', 'Brown', 'provider', 1, 1, '1234567893', NOW(), NOW()),

-- Staff users
(UUID(), 'staff.jones', 'ajones@mindline.test', '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV', 'Alice', 'Jones', 'staff', 1, 0, NULL, NOW(), NOW()),

(UUID(), 'staff.davis', 'rdavis@mindline.test', '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw3Nw$8TQkQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVVVQvVV', 'Robert', 'Davis', 'staff', 1, 0, NULL, NOW(), NOW());

-- =====================================================
-- CLIENTS (Test Patients)
-- =====================================================

-- Get provider IDs for assignment
SET @provider1 = (SELECT id FROM users WHERE username = 'dr.smith');
SET @provider2 = (SELECT id FROM users WHERE username = 'dr.johnson');
SET @provider3 = (SELECT id FROM users WHERE username = 'dr.williams');
SET @provider4 = (SELECT id FROM users WHERE username = 'dr.brown');

INSERT INTO clients (
    uuid, first_name, middle_name, last_name, date_of_birth,
    gender_identity, sexual_orientation, pronouns,
    phone_home, phone_mobile, email,
    address_line1, address_city, address_state, address_zip,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    provider_id, status, is_active,
    created_at, updated_at
) VALUES
-- Client 1
(UUID(), 'Michael', 'James', 'Anderson', '1985-03-15',
 'male', 'heterosexual', 'he/him',
 '555-0101', '555-0102', 'michael.anderson@email.test',
 '123 Main Street', 'Portland', 'OR', '97201',
 'Susan Anderson', '555-0103', 'Spouse',
 @provider1, 'active', 1,
 NOW(), NOW()),

-- Client 2
(UUID(), 'Emily', 'Rose', 'Martinez', '1992-07-22',
 'female', 'bisexual', 'she/her',
 '555-0201', '555-0202', 'emily.martinez@email.test',
 '456 Oak Avenue', 'Portland', 'OR', '97202',
 'Carlos Martinez', '555-0203', 'Father',
 @provider1, 'active', 1,
 NOW(), NOW()),

-- Client 3
(UUID(), 'Christopher', NULL, 'Taylor', '1978-11-08',
 'male', 'homosexual', 'he/him',
 '555-0301', '555-0302', 'chris.taylor@email.test',
 '789 Pine Road', 'Portland', 'OR', '97203',
 'Mark Stevens', '555-0303', 'Partner',
 @provider2, 'active', 1,
 NOW(), NOW()),

-- Client 4
(UUID(), 'Sarah', 'Lynn', 'Wilson', '1988-05-30',
 'female', 'heterosexual', 'she/her',
 '555-0401', '555-0402', 'sarah.wilson@email.test',
 '321 Elm Street', 'Portland', 'OR', '97204',
 'David Wilson', '555-0403', 'Spouse',
 @provider2, 'active', 1,
 NOW(), NOW()),

-- Client 5
(UUID(), 'Alex', 'Jordan', 'Thompson', '1995-09-12',
 'non_binary', 'pansexual', 'they/them',
 '555-0501', '555-0502', 'alex.thompson@email.test',
 '654 Maple Drive', 'Portland', 'OR', '97205',
 'Jamie Thompson', '555-0503', 'Sibling',
 @provider3, 'active', 1,
 NOW(), NOW()),

-- Client 6
(UUID(), 'Jessica', 'Marie', 'Garcia', '1990-02-18',
 'female', 'heterosexual', 'she/her',
 '555-0601', '555-0602', 'jessica.garcia@email.test',
 '987 Cedar Lane', 'Portland', 'OR', '97206',
 'Miguel Garcia', '555-0603', 'Brother',
 @provider3, 'active', 1,
 NOW(), NOW()),

-- Client 7
(UUID(), 'Daniel', 'Robert', 'Lee', '1982-12-25',
 'male', 'heterosexual', 'he/him',
 '555-0701', '555-0702', 'daniel.lee@email.test',
 '147 Birch Court', 'Portland', 'OR', '97207',
 'Michelle Lee', '555-0703', 'Spouse',
 @provider4, 'active', 1,
 NOW(), NOW()),

-- Client 8
(UUID(), 'Rachel', 'Ann', 'White', '1986-08-05',
 'female', 'lesbian', 'she/her',
 '555-0801', '555-0802', 'rachel.white@email.test',
 '258 Spruce Avenue', 'Portland', 'OR', '97208',
 'Laura White', '555-0803', 'Partner',
 @provider4, 'active', 1,
 NOW(), NOW()),

-- Client 9
(UUID(), 'Kevin', 'Paul', 'Harris', '1993-04-17',
 'male', 'heterosexual', 'he/him',
 '555-0901', '555-0902', 'kevin.harris@email.test',
 '369 Willow Street', 'Portland', 'OR', '97209',
 'Linda Harris', '555-0903', 'Mother',
 @provider1, 'active', 1,
 NOW(), NOW()),

-- Client 10
(UUID(), 'Amanda', 'Grace', 'Clark', '1991-06-28',
 'female', 'heterosexual', 'she/her',
 '555-1001', '555-1002', 'amanda.clark@email.test',
 '741 Ash Boulevard', 'Portland', 'OR', '97210',
 'James Clark', '555-1003', 'Father',
 @provider2, 'active', 1,
 NOW(), NOW());

-- Display summary
SELECT 'Test data inserted successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_clients FROM clients;
SELECT CONCAT(first_name, ' ', last_name) AS provider_name, COUNT(c.id) AS client_count
FROM users u
LEFT JOIN clients c ON c.provider_id = u.id
WHERE u.is_provider = 1
GROUP BY u.id, u.first_name, u.last_name;
