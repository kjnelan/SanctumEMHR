-- Unlock all locked user accounts
-- This will reset failed login attempts and clear lockout times

UPDATE users
SET locked_until = NULL,
    failed_login_attempts = 0
WHERE locked_until IS NOT NULL
   OR failed_login_attempts > 0;

-- Show all users and their status
SELECT
    id,
    username,
    failed_login_attempts,
    locked_until,
    last_login_at,
    is_active
FROM users
ORDER BY id;
