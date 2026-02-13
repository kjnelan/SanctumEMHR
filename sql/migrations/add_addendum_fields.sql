-- Migration: Add addendum support to clinical_notes table
-- Date: 2026-02-13
-- Purpose: Enable addenda as first-class notes with parent-child relationships

-- Add columns to support addenda
ALTER TABLE clinical_notes
ADD COLUMN parent_note_id BIGINT UNSIGNED NULL COMMENT 'Links addendum to parent note',
ADD COLUMN is_addendum TINYINT(1) DEFAULT 0 COMMENT 'Flag indicating this is an addendum';

-- Add foreign key constraint
ALTER TABLE clinical_notes
ADD CONSTRAINT fk_clinical_notes_parent
FOREIGN KEY (parent_note_id) REFERENCES clinical_notes(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Add index for performance when querying addenda
CREATE INDEX idx_clinical_notes_parent ON clinical_notes(parent_note_id);
CREATE INDEX idx_clinical_notes_is_addendum ON clinical_notes(is_addendum);

-- Note: The addendum_reason column already exists in the clinical_notes table
-- No need to add it again
