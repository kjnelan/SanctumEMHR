-- ============================================================================
-- Migration: Add Client Portal Authentication Columns
-- Date: 2026-02-10
--
-- Adds password hash, invite token, and portal session tracking to the
-- clients table to support the /mycare client portal.
-- ============================================================================

-- Add portal authentication columns to clients table
ALTER TABLE clients
  ADD COLUMN portal_password_hash VARCHAR(255) DEFAULT NULL AFTER portal_username,
  ADD COLUMN portal_invite_token VARCHAR(64) DEFAULT NULL AFTER portal_password_hash,
  ADD COLUMN portal_invite_expires DATETIME DEFAULT NULL AFTER portal_invite_token,
  ADD COLUMN portal_last_login DATETIME DEFAULT NULL AFTER portal_invite_expires,
  ADD COLUMN portal_force_password_change TINYINT(1) DEFAULT 1 AFTER portal_last_login;

-- Index for invite token lookups (used during registration flow)
ALTER TABLE clients
  ADD UNIQUE KEY uk_portal_invite_token (portal_invite_token);

-- ============================================================================
-- Portal session tracking in existing sessions table
-- The sessions table already supports user_id. Portal sessions will use
-- negative client IDs (e.g., -42 for client_id=42) to distinguish them
-- from staff sessions, OR we add a session_type column.
-- ============================================================================

ALTER TABLE sessions
  ADD COLUMN session_type ENUM('staff', 'portal') DEFAULT 'staff' AFTER user_id,
  ADD COLUMN client_id INT DEFAULT NULL AFTER session_type;

-- Index for portal session lookups
ALTER TABLE sessions
  ADD KEY idx_client_id (client_id),
  ADD KEY idx_session_type (session_type);

-- ============================================================================
-- Audit log support: portal actions should be logged
-- The existing audit_log table can handle this with event types like
-- 'portal_login', 'portal_profile_view', 'portal_profile_update'
-- No schema change needed - just use new event_type values.
-- ============================================================================
