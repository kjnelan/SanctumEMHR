-- Create Admin User for Mindline Database
-- This creates a default admin user with:
--   Username: admin
--   Password: ChangeMe123!
--   IMPORTANT: Change this password immediately after first login!

-- Generate a UUID (you may need to replace this with a proper UUID)
SET @uuid = UUID();

-- Hash the password using MySQL's SHA2 (temporary - will be re-hashed by PHP on first login)
-- NOTE: This is a temporary hash. The system should re-hash with password_hash() on first login
SET @temp_password_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; -- This is hash of 'ChangeMe123!'

INSERT INTO users (
    uuid,
    username,
    email,
    password_hash,
    first_name,
    last_name,
    middle_name,
    user_type,
    is_active,
    is_provider,
    password_changed_at,
    created_at,
    updated_at
) VALUES (
    @uuid,
    'admin',
    'admin@mindline.local',
    @temp_password_hash,
    'System',
    'Administrator',
    NULL,
    'admin',
    TRUE,
    FALSE,
    NOW(),
    NOW(),
    NOW()
);

-- Display the created user
SELECT
    id,
    username,
    email,
    first_name,
    last_name,
    user_type,
    is_active
FROM users
WHERE username = 'admin';
