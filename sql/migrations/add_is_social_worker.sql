-- Migration: Add is_social_worker boolean field to users table
-- Purpose: Support social worker role with restricted access (case management, not clinical)
-- Author: Claude Code
-- Date: 2026-02-01

-- Add is_social_worker boolean field
ALTER TABLE users
ADD COLUMN is_social_worker TINYINT(1) DEFAULT 0
AFTER is_supervisor;

-- Add index for quick filtering
CREATE INDEX idx_is_social_worker ON users(is_social_worker);

-- Add comment explaining the field
-- Social workers have access to:
--   - Clients they are assigned to (via client_providers table)
--   - Their own social work notes (case management, contact logs, referrals)
--   - Basic client demographics
--   - View-only appointment info (no details)
-- Social workers CANNOT access:
--   - Clinical therapy notes from providers
--   - Billing details
--   - Admin settings
