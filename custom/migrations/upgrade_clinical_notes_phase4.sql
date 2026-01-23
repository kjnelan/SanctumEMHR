-- Mindline EMHR - Clinical Notes Table Migration to Phase 4
-- This migration updates the clinical_notes table from the legacy SOAP format
-- to the new Phase 4 structure with support for multiple note types and templates
--
-- Author: Kenneth J. Nelan
-- Copyright © 2026 Sacred Wandering
-- Proprietary and Confidential

-- Backup instruction: Always backup before running migrations!
-- mysqldump -u root -p openemr clinical_notes > clinical_notes_backup_$(date +%Y%m%d_%H%M%S).sql

-- ==============================================================================
-- STEP 1: Add new columns to clinical_notes table
-- ==============================================================================

-- Add UUID column for API security
ALTER TABLE clinical_notes
ADD COLUMN note_uuid VARCHAR(36) UNIQUE AFTER id;

-- Add patient_id (replacing client_id for consistency)
ALTER TABLE clinical_notes
ADD COLUMN patient_id BIGINT(20) UNSIGNED AFTER note_uuid,
ADD INDEX idx_patient_id (patient_id);

-- Add created_by (replacing provider_id for clarity)
ALTER TABLE clinical_notes
ADD COLUMN created_by BIGINT(20) UNSIGNED AFTER patient_id,
ADD INDEX idx_created_by (created_by);

-- Add appointment and billing linkage
ALTER TABLE clinical_notes
ADD COLUMN appointment_id BIGINT(20) UNSIGNED NULL AFTER created_by,
ADD COLUMN billing_id BIGINT(20) UNSIGNED NULL AFTER appointment_id,
ADD INDEX idx_appointment_id (appointment_id),
ADD INDEX idx_billing_id (billing_id);

-- Add template type for flexible note structures
ALTER TABLE clinical_notes
ADD COLUMN template_type VARCHAR(50) DEFAULT 'BIRP' AFTER note_type;

-- Add service information
ALTER TABLE clinical_notes
ADD COLUMN service_date DATE NOT NULL AFTER template_type,
ADD COLUMN service_duration INT(11) NULL COMMENT 'Duration in minutes' AFTER service_date,
ADD COLUMN service_location VARCHAR(100) NULL AFTER service_duration;

-- Add BIRP/PIRP specific fields
ALTER TABLE clinical_notes
ADD COLUMN behavior_problem TEXT NULL COMMENT 'Behavior or presenting problem' AFTER service_location,
ADD COLUMN intervention TEXT NULL COMMENT 'Intervention provided' AFTER behavior_problem,
ADD COLUMN response TEXT NULL COMMENT 'Client response to intervention' AFTER intervention;
-- Note: 'plan' column already exists

-- Add risk tracking
ALTER TABLE clinical_notes
ADD COLUMN risk_present BOOLEAN DEFAULT FALSE AFTER plan,
ADD INDEX idx_risk_present (risk_present);
-- Note: 'risk_assessment' column already exists

-- Add structured data columns (JSON)
ALTER TABLE clinical_notes
ADD COLUMN goals_addressed JSON NULL COMMENT 'Treatment goals addressed in session' AFTER risk_assessment,
ADD COLUMN interventions_selected JSON NULL COMMENT 'Specific interventions used' AFTER goals_addressed,
ADD COLUMN client_presentation JSON NULL COMMENT 'Client presentation indicators' AFTER interventions_selected,
ADD COLUMN diagnosis_codes JSON NULL COMMENT 'ICD-10 diagnosis codes' AFTER client_presentation;

-- Add additional free-form fields
ALTER TABLE clinical_notes
ADD COLUMN presenting_concerns TEXT NULL AFTER diagnosis_codes,
ADD COLUMN clinical_observations TEXT NULL AFTER presenting_concerns;
-- Note: 'mental_status_exam' already exists

-- Add Diagnosis Note specific fields (Phase 4B)
ALTER TABLE clinical_notes
ADD COLUMN symptoms_reported TEXT NULL COMMENT 'Symptoms reported by client' AFTER mental_status_exam,
ADD COLUMN symptoms_observed TEXT NULL COMMENT 'Symptoms observed by clinician' AFTER symptoms_reported,
ADD COLUMN clinical_justification TEXT NULL COMMENT 'Justification for diagnosis' AFTER symptoms_observed,
ADD COLUMN differential_diagnosis TEXT NULL COMMENT 'Differential diagnoses considered' AFTER clinical_justification,
ADD COLUMN severity_specifiers VARCHAR(200) NULL AFTER differential_diagnosis,
ADD COLUMN functional_impairment TEXT NULL AFTER severity_specifiers,
ADD COLUMN duration_of_symptoms VARCHAR(200) NULL AFTER functional_impairment,
ADD COLUMN previous_diagnoses TEXT NULL AFTER duration_of_symptoms;

-- Add supervision tracking
ALTER TABLE clinical_notes
ADD COLUMN supervisor_review_required BOOLEAN DEFAULT FALSE AFTER previous_diagnoses,
ADD COLUMN supervisor_reviewed_at TIMESTAMP NULL AFTER supervisor_review_required,
ADD COLUMN supervisor_reviewed_by BIGINT(20) UNSIGNED NULL AFTER supervisor_reviewed_at,
ADD COLUMN supervisor_comments TEXT NULL AFTER supervisor_reviewed_by,
ADD INDEX idx_supervisor_review (supervisor_review_required),
ADD INDEX idx_supervisor_reviewed_by (supervisor_reviewed_by);

-- Add auto-save tracking
ALTER TABLE clinical_notes
ADD COLUMN last_autosave_at TIMESTAMP NULL AFTER supervisor_comments;

-- ==============================================================================
-- STEP 2: Migrate existing data from old columns to new columns
-- ==============================================================================

-- Copy client_id to patient_id
UPDATE clinical_notes SET patient_id = client_id WHERE patient_id IS NULL;

-- Copy provider_id to created_by
UPDATE clinical_notes SET created_by = provider_id WHERE created_by IS NULL;

-- Set service_date from created_at for existing records
UPDATE clinical_notes SET service_date = DATE(created_at) WHERE service_date IS NULL;

-- Generate UUIDs for existing records
UPDATE clinical_notes
SET note_uuid = UUID()
WHERE note_uuid IS NULL OR note_uuid = '';

-- Migrate SOAP notes to BIRP format (best effort conversion)
-- Subjective + Objective → Behavior/Problem
-- Assessment → Response
-- Plan → Plan (already exists)
UPDATE clinical_notes
SET
    behavior_problem = CONCAT_WS('\n\n', subjective, objective),
    response = assessment,
    template_type = 'BIRP'
WHERE template_type IS NULL AND (subjective IS NOT NULL OR objective IS NOT NULL);

-- ==============================================================================
-- STEP 3: Set NOT NULL constraints where appropriate (after data migration)
-- ==============================================================================

-- Make UUID NOT NULL now that all records have one
ALTER TABLE clinical_notes
MODIFY COLUMN note_uuid VARCHAR(36) NOT NULL;

-- Make patient_id NOT NULL
ALTER TABLE clinical_notes
MODIFY COLUMN patient_id BIGINT(20) UNSIGNED NOT NULL;

-- Make created_by NOT NULL
ALTER TABLE clinical_notes
MODIFY COLUMN created_by BIGINT(20) UNSIGNED NOT NULL;

-- ==============================================================================
-- STEP 4: Keep legacy columns for backward compatibility (mark as deprecated)
-- ==============================================================================

-- Rename old columns to indicate they're deprecated
ALTER TABLE clinical_notes
CHANGE COLUMN client_id client_id_legacy BIGINT(20) UNSIGNED NULL COMMENT 'DEPRECATED: Use patient_id',
CHANGE COLUMN provider_id provider_id_legacy BIGINT(20) UNSIGNED NULL COMMENT 'DEPRECATED: Use created_by',
CHANGE COLUMN encounter_id encounter_id_legacy BIGINT(20) UNSIGNED NULL COMMENT 'DEPRECATED: Use appointment_id',
CHANGE COLUMN subjective subjective_legacy TEXT NULL COMMENT 'DEPRECATED: Use behavior_problem',
CHANGE COLUMN objective objective_legacy TEXT NULL COMMENT 'DEPRECATED: Use intervention',
CHANGE COLUMN assessment assessment_legacy TEXT NULL COMMENT 'DEPRECATED: Use response';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

-- Verify migration
SELECT
    COUNT(*) as total_notes,
    COUNT(note_uuid) as notes_with_uuid,
    COUNT(patient_id) as notes_with_patient_id,
    COUNT(created_by) as notes_with_creator
FROM clinical_notes;

-- Show sample of migrated data
SELECT
    id,
    note_uuid,
    patient_id,
    created_by,
    note_type,
    template_type,
    service_date,
    status
FROM clinical_notes
LIMIT 5;
