-- Migration: Add social_worker to user_type enum
-- Purpose: Support social worker role with restricted access
-- Author: Claude Code
-- Date: 2026-02-01

-- Add 'social_worker' to the user_type enum
ALTER TABLE users
MODIFY COLUMN user_type ENUM('admin', 'provider', 'social_worker', 'staff', 'billing') NOT NULL;

-- Add comment explaining the roles
-- admin: Full system access
-- provider: Clinicians/therapists with full clinical access to assigned clients
-- social_worker: Case management access, no clinical notes from other providers
-- staff: Front desk, scheduling, demographics
-- billing: Billing and financial access
