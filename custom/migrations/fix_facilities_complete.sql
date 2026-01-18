-- Complete Facilities Table Migration
-- Adds all missing fields for proper facility management

USE mindline;

-- Step 1: Create facility_types reference table
CREATE TABLE IF NOT EXISTS facility_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default facility types
INSERT INTO facility_types (name, description, sort_order) VALUES
('Main Office', 'Primary practice location', 1),
('Satellite Office', 'Additional practice location', 2),
('Telehealth Location', 'Virtual/telehealth services location', 3),
('Laboratory', 'Laboratory services', 4),
('Imaging Center', 'Diagnostic imaging services', 5),
('Administrative Office', 'Administrative/billing office only', 6),
('Hospital', 'Hospital-based practice', 7),
('Clinic', 'Outpatient clinic', 8)
ON DUPLICATE KEY UPDATE name=name;

-- Step 2: Add facility_type_id to facilities table
ALTER TABLE facilities
ADD COLUMN facility_type_id BIGINT UNSIGNED NULL AFTER facility_type,
ADD CONSTRAINT fk_facilities_facility_type
    FOREIGN KEY (facility_type_id) REFERENCES facility_types(id)
    ON DELETE SET NULL;

-- Migrate existing facility_type VARCHAR to facility_type_id
-- (Map common values, rest will be NULL and can be set manually)
UPDATE facilities f
LEFT JOIN facility_types ft ON LOWER(f.facility_type) = LOWER(ft.name)
SET f.facility_type_id = ft.id
WHERE f.facility_type IS NOT NULL;

-- Step 3: Add mailing address fields
ALTER TABLE facilities
ADD COLUMN mailing_address_line1 VARCHAR(255) NULL AFTER zip,
ADD COLUMN mailing_address_line2 VARCHAR(255) NULL AFTER mailing_address_line1,
ADD COLUMN mailing_city VARCHAR(100) NULL AFTER mailing_address_line2,
ADD COLUMN mailing_state VARCHAR(2) NULL AFTER mailing_city,
ADD COLUMN mailing_zip VARCHAR(10) NULL AFTER mailing_state,
ADD COLUMN mailing_same_as_physical TINYINT(1) DEFAULT 1 AFTER mailing_zip;

-- Step 4: Add billing address fields
ALTER TABLE facilities
ADD COLUMN billing_address_line1 VARCHAR(255) NULL AFTER mailing_same_as_physical,
ADD COLUMN billing_address_line2 VARCHAR(255) NULL AFTER billing_address_line1,
ADD COLUMN billing_city VARCHAR(100) NULL AFTER billing_address_line2,
ADD COLUMN billing_state VARCHAR(2) NULL AFTER billing_city,
ADD COLUMN billing_zip VARCHAR(10) NULL AFTER billing_state,
ADD COLUMN billing_same_as_physical TINYINT(1) DEFAULT 1 AFTER billing_zip;

-- Step 5: Add billing/service flags
ALTER TABLE facilities
ADD COLUMN billing_location TINYINT(1) DEFAULT 0 AFTER billing_same_as_physical,
ADD COLUMN service_location TINYINT(1) DEFAULT 1 AFTER billing_location,
ADD COLUMN accepts_assignment TINYINT(1) DEFAULT 1 AFTER service_location,
ADD COLUMN primary_business_entity TINYINT(1) DEFAULT 0 AFTER accepts_assignment;

-- Step 6: Add other missing fields
ALTER TABLE facilities
ADD COLUMN color VARCHAR(7) DEFAULT '#99FFFF' AFTER primary_business_entity,
ADD COLUMN notes TEXT NULL AFTER color,
ADD COLUMN attn VARCHAR(100) NULL AFTER notes;

-- Step 7: Remove redundant npi column (keep only facility_npi)
ALTER TABLE facilities
DROP COLUMN npi;

-- Step 8: Add indexes for performance
ALTER TABLE facilities
ADD INDEX idx_facility_type_id (facility_type_id),
ADD INDEX idx_billing_location (billing_location),
ADD INDEX idx_service_location (service_location);

-- Step 9: Set sensible defaults for existing facilities
UPDATE facilities
SET
    service_location = 1,
    accepts_assignment = 1,
    mailing_same_as_physical = 1,
    billing_same_as_physical = 1,
    color = '#99FFFF'
WHERE color IS NULL OR color = '';

-- Step 10: Mark first facility as primary if none exist
UPDATE facilities
SET primary_business_entity = 1
WHERE is_primary = 1
LIMIT 1;

-- If no primary exists, set the first active one
UPDATE facilities
SET primary_business_entity = 1
WHERE is_active = 1
AND primary_business_entity = 0
ORDER BY id ASC
LIMIT 1;

-- Step 11: Drop old facility_type VARCHAR column (data migrated to facility_type_id)
-- Commented out for safety - uncomment after verifying migration worked
-- ALTER TABLE facilities DROP COLUMN facility_type;

-- Verification queries (run these to check migration)
-- SELECT * FROM facility_types;
-- SELECT id, name, facility_type, facility_type_id, is_active FROM facilities;
-- DESCRIBE facilities;
