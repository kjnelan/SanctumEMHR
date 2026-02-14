-- ============================================================================
-- Migration: Create Secure Messaging System
-- Date: 2026-02-14
--
-- Creates tables for secure messaging between staff and clients in the
-- SanctumEMHR patient portal. Supports threaded conversations, unread badges,
-- RBAC-aware visibility, and full audit logging.
--
-- PHASE 2.1 — Portal Tier 2: Secure Messaging
-- ============================================================================

-- ============================================================================
-- Table: messages
-- Stores all messages between staff and clients
-- ============================================================================
CREATE TABLE `messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,

  -- Participants
  `sender_type` enum('staff', 'client') NOT NULL COMMENT 'Who sent this message',
  `sender_user_id` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID if sender is staff',
  `sender_client_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Client ID if sender is client',

  `recipient_type` enum('staff', 'client') NOT NULL COMMENT 'Who receives this message',
  `recipient_user_id` bigint(20) unsigned DEFAULT NULL COMMENT 'User ID if recipient is staff',
  `recipient_client_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Client ID if recipient is client',

  -- Message content
  `subject` varchar(255) DEFAULT NULL COMMENT 'Subject line (null for replies in thread)',
  `body` text NOT NULL COMMENT 'Message body',

  -- Threading
  `thread_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Root message ID for threading',
  `parent_message_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Direct parent message ID for replies',

  -- Status tracking
  `status` enum('draft', 'sent', 'read', 'archived') DEFAULT 'sent' COMMENT 'Message status',
  `is_read` tinyint(1) DEFAULT 0 COMMENT 'Whether recipient has read the message',
  `read_at` timestamp NULL DEFAULT NULL COMMENT 'When message was read',

  -- Metadata
  `priority` enum('normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'Message priority',
  `requires_response` tinyint(1) DEFAULT 0 COMMENT 'Flag if response needed',

  -- Clinical context
  `related_client_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Client this message is about (for RBAC)',
  `related_appointment_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Related appointment if any',

  -- Audit fields
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete',
  `deleted_by` bigint(20) unsigned DEFAULT NULL COMMENT 'Who soft-deleted this message',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),

  -- Sender indices
  KEY `idx_sender_user` (`sender_user_id`),
  KEY `idx_sender_client` (`sender_client_id`),

  -- Recipient indices
  KEY `idx_recipient_user` (`recipient_user_id`),
  KEY `idx_recipient_client` (`recipient_client_id`),

  -- Threading indices
  KEY `idx_thread` (`thread_id`),
  KEY `idx_parent` (`parent_message_id`),

  -- Query optimization indices
  KEY `idx_related_client` (`related_client_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),

  -- Foreign key constraints
  CONSTRAINT `fk_msg_sender_user` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_sender_client` FOREIGN KEY (`sender_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_recipient_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_recipient_client` FOREIGN KEY (`recipient_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_related_client` FOREIGN KEY (`related_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_related_appointment` FOREIGN KEY (`related_appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_thread` FOREIGN KEY (`thread_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_parent` FOREIGN KEY (`parent_message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Secure messaging between staff and clients';

-- ============================================================================
-- Table: message_attachments
-- Stores file attachments for messages (optional - for future enhancement)
-- ============================================================================
CREATE TABLE `message_attachments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `message_id` bigint(20) unsigned NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'Encrypted storage path',
  `file_size` int(11) NOT NULL COMMENT 'Size in bytes',
  `mime_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),

  PRIMARY KEY (`id`),
  KEY `idx_message` (`message_id`),

  CONSTRAINT `fk_attachment_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='File attachments for secure messages';

-- ============================================================================
-- Table: message_read_receipts
-- Tracks when each participant reads each message (for group messages future)
-- ============================================================================
CREATE TABLE `message_read_receipts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `message_id` bigint(20) unsigned NOT NULL,
  `reader_type` enum('staff', 'client') NOT NULL,
  `reader_user_id` bigint(20) unsigned DEFAULT NULL,
  `reader_client_id` bigint(20) unsigned DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT current_timestamp(),

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_read_receipt` (`message_id`, `reader_type`, `reader_user_id`, `reader_client_id`),
  KEY `idx_message` (`message_id`),
  KEY `idx_reader_user` (`reader_user_id`),
  KEY `idx_reader_client` (`reader_client_id`),

  CONSTRAINT `fk_receipt_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receipt_reader_user` FOREIGN KEY (`reader_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receipt_reader_client` FOREIGN KEY (`reader_client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Read receipts for message tracking';

-- ============================================================================
-- Audit log event types for secure messaging
-- These will be used with the existing audit_logs table
-- No schema changes needed - just documenting event types:
--
-- - 'message_sent'         - Message sent
-- - 'message_read'         - Message marked as read
-- - 'message_deleted'      - Message soft-deleted
-- - 'message_archived'     - Message archived
-- - 'thread_created'       - New conversation thread started
-- - 'thread_replied'       - Reply added to thread
-- ============================================================================

-- ============================================================================
-- Initial data / validation
-- ============================================================================

-- Verify no orphaned records
-- (This is a new table, so should be empty)
SELECT 'Migration complete: Secure Messaging tables created' AS status;
