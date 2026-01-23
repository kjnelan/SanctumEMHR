-- Create system_settings table for configurable system parameters
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_editable TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add is_editable column if it doesn't exist (for existing tables)
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS is_editable TINYINT(1) DEFAULT 1;

-- Insert default security settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_editable) VALUES
('security.max_login_attempts', '5', 'integer', 'security', 'Maximum number of failed login attempts before account is locked', 1),
('security.lockout_duration_minutes', '30', 'integer', 'security', 'Duration in minutes that an account remains locked after maximum failed attempts', 1),
('security.password_min_length', '8', 'integer', 'security', 'Minimum password length required', 1),
('security.require_password_uppercase', '1', 'boolean', 'security', 'Require at least one uppercase letter in passwords', 1),
('security.require_password_lowercase', '1', 'boolean', 'security', 'Require at least one lowercase letter in passwords', 1),
('security.require_password_number', '1', 'boolean', 'security', 'Require at least one number in passwords', 1),
('security.require_password_special', '1', 'boolean', 'security', 'Require at least one special character in passwords', 1),
('security.session_timeout_minutes', '480', 'integer', 'security', 'Session timeout in minutes (0 = no timeout)', 1)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
