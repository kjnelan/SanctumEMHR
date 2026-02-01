-- Add color column to users table
-- This allows assigning calendar colors to providers/clinicians
-- Colors are managed by admins only
-- Run this SQL on your database to add the color column

ALTER TABLE users
ADD COLUMN color VARCHAR(7) DEFAULT NULL
COMMENT 'Calendar color for this provider (hex format, e.g. #3B82F6)'
AFTER user_type;

-- Default colors for existing providers (a nice palette to start)
-- Admins can change these later
UPDATE users SET color = '#3B82F6' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 1; -- Blue
UPDATE users SET color = '#10B981' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 2; -- Green
UPDATE users SET color = '#8B5CF6' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 3; -- Purple
UPDATE users SET color = '#F59E0B' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 4; -- Amber
UPDATE users SET color = '#EF4444' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 5; -- Red
UPDATE users SET color = '#EC4899' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 6; -- Pink
UPDATE users SET color = '#06B6D4' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 7; -- Cyan
UPDATE users SET color = '#84CC16' WHERE is_provider = 1 AND color IS NULL AND id % 8 = 0; -- Lime
