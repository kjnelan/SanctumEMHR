-- Migration: Complete RBAC Role System - Phase 1.1
-- Purpose: Add Front Desk (staff), Biller (billing), and Intern support
-- Author: Claude Code
-- Date: 2026-02-14

-- Add 'intern' to user_type enum (front desk uses existing 'staff', biller uses existing 'billing')
-- Current enum: 'admin', 'provider', 'social_worker', 'staff', 'billing'
-- We already have staff and billing, just need to clarify their usage

-- Add is_intern flag to users table for supervised providers
-- Interns are providers who require supervision and have limited autonomy
ALTER TABLE users
ADD COLUMN is_intern TINYINT(1) DEFAULT 0 COMMENT 'Intern status - supervised provider requiring review';

-- Add index for quick intern lookups
CREATE INDEX idx_is_intern ON users(is_intern);

-- Add comment to user_type to document role purposes
ALTER TABLE users MODIFY COLUMN user_type
  ENUM('admin', 'provider', 'social_worker', 'staff', 'billing')
  NOT NULL
  COMMENT 'User role: admin=full access, provider=clinical, social_worker=case mgmt, staff=front desk/scheduling, billing=billing only';

-- Create audit log table for permission-related actions
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL COMMENT 'Action type: view_client, edit_demographics, delete_note, etc.',
  resource_type VARCHAR(50) NOT NULL COMMENT 'Resource affected: client, note, appointment, user, etc.',
  resource_id BIGINT UNSIGNED COMMENT 'ID of affected resource',
  details TEXT COMMENT 'Additional context (JSON)',
  ip_address VARCHAR(45) COMMENT 'User IP address',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit log for security-sensitive actions';
