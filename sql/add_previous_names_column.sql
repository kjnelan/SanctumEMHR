-- Add previous_names column to clients table
-- Stores previous names as JSON array for clients who have changed their name
-- Examples: maiden name, legal name changes, preferred name changes, etc.

ALTER TABLE clients
ADD COLUMN previous_names JSON DEFAULT NULL
COMMENT 'JSON array of previous names (maiden names, legal name changes, etc.)'
AFTER middle_name;

-- Example JSON structure:
-- [
--   {"name": "Jane Smith", "type": "maiden", "date_changed": "2020-01-15"},
--   {"name": "Jane Doe", "type": "legal", "date_changed": "2022-06-30"}
-- ]
