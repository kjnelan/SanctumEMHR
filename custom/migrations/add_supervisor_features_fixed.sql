-- Migration: Add supervisor features and multi-supervisor support (Fixed)
-- Date: 2026-01-13
-- Description: Adds is_supervisor flag and creates junction table for many-to-many supervisor relationships

-- Step 1: Add is_supervisor flag to users table
ALTER TABLE users
ADD COLUMN is_supervisor TINYINT(1) DEFAULT 0
AFTER authorized;

-- Step 2: Create junction table for multiple supervisors per user
-- Note: Matching the exact column type from users.id (likely BIGINT)
CREATE TABLE IF NOT EXISTS user_supervisors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'The user being supervised',
    supervisor_id BIGINT NOT NULL COMMENT 'The supervisor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_supervisor (user_id, supervisor_id),
    INDEX idx_user_id (user_id),
    INDEX idx_supervisor_id (supervisor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Junction table for user-supervisor many-to-many relationships';

-- Add foreign keys separately (more flexible)
ALTER TABLE user_supervisors
ADD CONSTRAINT fk_user_supervisors_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_supervisors
ADD CONSTRAINT fk_user_supervisors_supervisor_id
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Migrate existing supervisor_id data to the new junction table
-- Only migrate where supervisor_id is not null and greater than 0
INSERT INTO user_supervisors (user_id, supervisor_id)
SELECT id, supervisor_id
FROM users
WHERE supervisor_id IS NOT NULL
  AND supervisor_id > 0
  AND supervisor_id != 0;

-- Step 4: Mark existing supervisors (anyone who is currently assigned as a supervisor)
UPDATE users
SET is_supervisor = 1
WHERE id IN (
    SELECT DISTINCT supervisor_id
    FROM (SELECT supervisor_id FROM users WHERE supervisor_id IS NOT NULL AND supervisor_id > 0) AS supervisors
);

-- Step 5: Also mark any authorized providers as potential supervisors (optional - adjust as needed)
-- Uncomment the next line if you want all providers to be eligible as supervisors by default
-- UPDATE users SET is_supervisor = 1 WHERE authorized = 1 AND active = 1;

-- Verification queries (run these to check the migration):
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as users_with_is_supervisor_flag FROM users WHERE is_supervisor = 1;
-- SELECT COUNT(*) as supervisor_relationships FROM user_supervisors;
-- SELECT u.username, u.fname, u.lname, u.is_supervisor, COUNT(us.id) as supervising_count
-- FROM users u
-- LEFT JOIN user_supervisors us ON u.id = us.supervisor_id
-- WHERE u.is_supervisor = 1
-- GROUP BY u.id, u.username, u.fname, u.lname, u.is_supervisor;
