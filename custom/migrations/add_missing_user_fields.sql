-- Migration: Add missing user fields for complete provider management
-- This adds fields expected by the frontend that were missing from the Mindline schema

USE mindline;

-- Add professional title and suffix
ALTER TABLE users
ADD COLUMN title VARCHAR(50) NULL AFTER middle_name,
ADD COLUMN suffix VARCHAR(20) NULL AFTER title;

-- Add tax and billing identifiers
ALTER TABLE users
ADD COLUMN federal_tax_id VARCHAR(20) NULL AFTER dea_number,
ADD COLUMN ein VARCHAR(20) NULL AFTER federal_tax_id,
ADD COLUMN ssn VARCHAR(11) NULL AFTER ein,
ADD COLUMN taxonomy VARCHAR(20) NULL AFTER ssn;

-- Add organizational relationships
ALTER TABLE users
ADD COLUMN facility_id BIGINT UNSIGNED NULL AFTER taxonomy,
ADD COLUMN supervisor_id BIGINT UNSIGNED NULL AFTER facility_id;

-- Add user capability flags
ALTER TABLE users
ADD COLUMN is_supervisor TINYINT(1) DEFAULT 0 AFTER is_provider,
ADD COLUMN portal_user TINYINT(1) DEFAULT 0 AFTER is_supervisor;

-- Add notes field for admin comments
ALTER TABLE users
ADD COLUMN notes TEXT NULL AFTER mobile;

-- Add foreign key constraints
ALTER TABLE users
ADD CONSTRAINT fk_users_facility
    FOREIGN KEY (facility_id) REFERENCES facilities(id)
    ON DELETE SET NULL,
ADD CONSTRAINT fk_users_supervisor
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
    ON DELETE SET NULL;

-- Add indexes for performance
ALTER TABLE users
ADD INDEX idx_facility_id (facility_id),
ADD INDEX idx_supervisor_id (supervisor_id),
ADD INDEX idx_is_supervisor (is_supervisor),
ADD INDEX idx_portal_user (portal_user);

-- Update existing users to have sensible defaults
UPDATE users SET
    is_supervisor = 1
WHERE user_type = 'admin' OR is_provider = 1;

UPDATE users SET
    portal_user = 0;
