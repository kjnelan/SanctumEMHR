-- Add timestamp tracking for failed login attempts
-- This allows us to expire old failed attempts automatically

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP NULL DEFAULT NULL AFTER failed_login_attempts;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_last_failed_login ON users(last_failed_login_at);

-- Add new security setting for failed attempts expiration
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_editable) VALUES
('security.failed_attempts_expiration_hours', '24', 'integer', 'security', 'Hours after which failed login attempts are reset (0 = never expire)', 1)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
