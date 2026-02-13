-- Migration: Add pronoun visibility controls for client safety
-- Date: 2026-02-13
-- Purpose: Enable pronoun storage with visibility controls, especially for minor protection

-- Add pronoun fields to clients table
ALTER TABLE clients
ADD COLUMN pronouns INT DEFAULT NULL COMMENT 'FK to reference_lists for pronoun preference',
ADD COLUMN pronouns_visibility ENUM('clinician_only', 'client_visible', 'parent_visible')
    DEFAULT 'clinician_only' COMMENT 'Controls who can see pronouns - critical for minor safety',
ADD CONSTRAINT fk_clients_pronouns
    FOREIGN KEY (pronouns) REFERENCES reference_lists(id);

-- Add index for performance
CREATE INDEX idx_clients_pronouns ON clients(pronouns);

-- Note: Pronoun reference list entries already exist (IDs 22-29)
-- Default visibility is 'clinician_only' to protect minors by default
