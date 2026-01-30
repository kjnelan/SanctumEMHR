-- Migration: Create appointment_attendees table
-- Purpose: Support multiple attendees for clinic-type appointments (supervision, group meetings, etc.)
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS appointment_attendees (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    role ENUM('supervisor', 'supervisee', 'attendee') NOT NULL DEFAULT 'attendee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_attendee_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointments(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendee_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Prevent duplicate attendees on the same appointment
    UNIQUE KEY unique_appointment_attendee (appointment_id, user_id),

    -- Index for efficient lookups by user (for calendar queries)
    INDEX idx_attendee_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
