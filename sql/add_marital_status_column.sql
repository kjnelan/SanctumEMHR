-- Add marital_status column to clients table
-- This references the 'marital-status' list in reference_lists table

ALTER TABLE clients
ADD COLUMN marital_status VARCHAR(50) DEFAULT NULL
AFTER sexual_orientation;

-- Add index for lookups
CREATE INDEX idx_marital_status ON clients(marital_status);
