-- Migration: Create client_providers junction table
-- Purpose: Allow multiple providers (clinicians, social workers, etc.) to be assigned to a single client
-- Author: Claude Code
-- Date: 2026-02-01

-- Junction table for client-provider assignments
CREATE TABLE IF NOT EXISTS client_providers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    provider_id BIGINT UNSIGNED NOT NULL,
    role ENUM('primary_clinician', 'clinician', 'social_worker', 'supervisor', 'intern') NOT NULL DEFAULT 'clinician',
    assigned_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    assigned_by BIGINT UNSIGNED NULL,
    ended_at DATE NULL COMMENT 'NULL means currently assigned',
    notes TEXT NULL COMMENT 'Optional notes about the assignment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_client_providers_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_providers_provider FOREIGN KEY (provider_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_providers_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES users(id) ON DELETE SET NULL,

    -- Prevent duplicate active assignments (same client-provider-role)
    UNIQUE KEY unique_active_assignment (client_id, provider_id, role, ended_at),

    -- Indexes for common queries
    INDEX idx_client_providers_client (client_id),
    INDEX idx_client_providers_provider (provider_id),
    INDEX idx_client_providers_role (role),
    INDEX idx_client_providers_active (client_id, ended_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing primary_provider_id assignments to the new table
INSERT INTO client_providers (client_id, provider_id, role, assigned_at, notes)
SELECT
    id as client_id,
    primary_provider_id as provider_id,
    'primary_clinician' as role,
    COALESCE(created_at, CURRENT_DATE) as assigned_at,
    'Migrated from primary_provider_id' as notes
FROM clients
WHERE primary_provider_id IS NOT NULL
ON DUPLICATE KEY UPDATE notes = 'Migrated from primary_provider_id';

-- Add comment to explain the relationship
ALTER TABLE client_providers
    COMMENT = 'Junction table for client-provider assignments. Supports multiple providers per client with different roles.';
