-- ========================================
-- Mindline EMHR - Clinical Notes Tables
-- Phase 4: Clinical Documentation
-- ========================================
--
-- ARCHITECTURE PHILOSOPHY:
-- Notes are independent, primary objects.
-- Appointments, billing, and supervision REFERENCE notes.
-- This allows maximum flexibility for mental health workflows.
--
-- ========================================
 
-- ========================================
-- 1. CLINICAL NOTES (Primary Entity)
-- ========================================
 
CREATE TABLE IF NOT EXISTS clinical_notes (
    id BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    note_uuid VARCHAR(36) UNIQUE NOT NULL,

    patient_id BIGINT(20) NOT NULL,
    provider_id BIGINT(20) NOT NULL,

    appointment_id BIGINT(20) NULL,
    billing_id BIGINT(20) NULL,

    note_type VARCHAR(50) NOT NULL,
    template_type VARCHAR(50) DEFAULT 'BIRP',
    service_date DATE NOT NULL,
    service_duration INT NULL,
    service_location VARCHAR(100) NULL,

    behavior_problem TEXT NULL,
    intervention TEXT NULL,
    response TEXT NULL,
    plan TEXT NULL,

    risk_assessment TEXT NULL,
    risk_present BOOLEAN DEFAULT FALSE,
    goals_addressed JSON NULL,

    interventions_selected JSON NULL,
    client_presentation JSON NULL,

    diagnosis_codes JSON NULL,

    presenting_concerns TEXT NULL,
    clinical_observations TEXT NULL,
    mental_status_exam TEXT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_locked BOOLEAN DEFAULT FALSE,

    signed_at TIMESTAMP NULL,
    signed_by BIGINT(20) NULL,
    signature_data TEXT NULL,

    supervisor_review_required BOOLEAN DEFAULT FALSE,
    supervisor_review_status VARCHAR(20) NULL,
    supervisor_signed_at TIMESTAMP NULL,
    supervisor_signed_by BIGINT(20) NULL,
    supervisor_comments TEXT NULL,

    parent_note_id BIGINT(20) NULL,
    is_addendum BOOLEAN DEFAULT FALSE,
    addendum_reason TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    locked_at TIMESTAMP NULL,
    last_autosave_at TIMESTAMP NULL,

    INDEX idx_patient (patient_id),
    INDEX idx_provider (provider_id),
    INDEX idx_appointment (appointment_id),
    INDEX idx_service_date (service_date),
    INDEX idx_note_type (note_type),
    INDEX idx_status (status),
    INDEX idx_supervisor_review (supervisor_review_status),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (patient_id) REFERENCES patient_data(id) ON DELETE RESTRICT,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (supervisor_signed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_note_id) REFERENCES clinical_notes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 
-- ========================================
-- 2. NOTE DRAFTS (Auto-save Support)
-- ========================================
 
CREATE TABLE IF NOT EXISTS note_drafts (
    id BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,

    note_id BIGINT(20) NULL,       -- FK to clinical_notes.id
    provider_id BIGINT(20) NOT NULL, -- FK to users.id
    patient_id BIGINT(20) NOT NULL,  -- FK to patient_data.id
    appointment_id BIGINT(20) NULL,  -- no FK (legacy calendar)

    -- Draft content (stored as JSON)
    draft_content JSON NOT NULL,

    -- Metadata
    note_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,

    -- Timestamps
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_note (note_id),
    INDEX idx_provider (provider_id),
    INDEX idx_patient (patient_id),
    INDEX idx_appointment (appointment_id),
    INDEX idx_saved_at (saved_at),

    -- Foreign keys
    FOREIGN KEY (note_id) REFERENCES clinical_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patient_data(id) ON DELETE CASCADE
    -- appointment_id intentionally has no FK
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 
-- ========================================
-- 3. TREATMENT GOALS (For Carry-Forward)
-- ========================================
 
CREATE TABLE IF NOT EXISTS treatment_goals (
    id BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,

    patient_id BIGINT(20) NOT NULL,   -- must match patient_data.id
    provider_id BIGINT(20) NOT NULL,  -- must match users.id

    -- Goal content
    goal_text TEXT NOT NULL,
    goal_category VARCHAR(50) NULL,

    -- Tracking
    target_date DATE NULL,
    status VARCHAR(20) DEFAULT 'active',
    progress_level INT NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    achieved_at TIMESTAMP NULL,
    discontinued_at TIMESTAMP NULL,

    -- Indexes
    INDEX idx_patient (patient_id),
    INDEX idx_provider (provider_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),

    -- Foreign keys
    FOREIGN KEY (patient_id) REFERENCES patient_data(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 
-- ========================================
-- 4. INTERVENTION LIBRARY (For Quick-Select)
-- ========================================
 
CREATE TABLE IF NOT EXISTS intervention_library (
    id BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,

    intervention_name VARCHAR(100) NOT NULL UNIQUE,
    intervention_tier INT NOT NULL,
    modality VARCHAR(50) NULL,

    is_system_intervention BOOLEAN DEFAULT TRUE,
    created_by BIGINT(20) NULL,  -- FIXED

    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tier (intervention_tier),
    INDEX idx_modality (modality),
    INDEX idx_active (is_active),

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 
-- ========================================
-- 5. USER FAVORITE INTERVENTIONS
-- ========================================
 
CREATE TABLE IF NOT EXISTS user_favorite_interventions (
    id BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT(20) NOT NULL,           -- FIXED
    intervention_id BIGINT(20) NOT NULL,   -- FIXED

    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    UNIQUE KEY unique_user_intervention (user_id, intervention_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_id) REFERENCES intervention_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 
-- ========================================
-- 6. SYSTEM SETTINGS (For Admin Choices)
-- ========================================
 
CREATE TABLE IF NOT EXISTS clinical_settings (
    id BIGINT(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string',

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT(20) NULL,  -- FIXED

    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 
-- Insert default settings
INSERT INTO clinical_settings (setting_key, setting_value, setting_type) VALUES
('default_note_template', 'BIRP', 'string'),
('require_supervisor_review', 'false', 'boolean'),
('auto_lock_notes_after_days', '7', 'string'),
('allow_post_signature_edits', 'true', 'boolean')
ON DUPLICATE KEY UPDATE setting_key=setting_key; -- No-op if exists
 
-- ========================================
-- 7. SEED INTERVENTION LIBRARY (Tier 1 - Core)
-- ========================================
 
INSERT INTO intervention_library (intervention_name, intervention_tier, modality, display_order) VALUES
-- Tier 1: Core interventions (always visible)
('Psychoeducation', 1, NULL, 1),
('Cognitive restructuring / reframing', 1, NULL, 2),
('Behavioral activation', 1, NULL, 3),
('Grounding techniques', 1, NULL, 4),
('Mindfulness / breathing exercises', 1, NULL, 5),
('Emotional regulation skills', 1, NULL, 6),
('Coping skills training', 1, NULL, 7),
('Safety planning', 1, NULL, 8),
('Supportive counseling', 1, NULL, 9),
('Validation / normalization', 1, NULL, 10),
('Motivational interviewing', 1, NULL, 11),
('Treatment plan review / goal alignment', 1, NULL, 12),
 
-- Tier 2: CBT
('Thought records', 2, 'CBT', 1),
('Cognitive distortions identification', 2, 'CBT', 2),
('Exposure planning', 2, 'CBT', 3),
 
-- Tier 2: DBT
('Distress tolerance skills', 2, 'DBT', 1),
('Interpersonal effectiveness skills', 2, 'DBT', 2),
('Chain analysis', 2, 'DBT', 3),
 
-- Tier 2: ACT
('Values clarification', 2, 'ACT', 1),
('Cognitive defusion', 2, 'ACT', 2),
('Acceptance strategies', 2, 'ACT', 3),
 
-- Tier 2: EMDR
('Resourcing / stabilization', 2, 'EMDR', 1),
('Bilateral stimulation', 2, 'EMDR', 2),
('Target identification', 2, 'EMDR', 3),
 
-- Tier 2: IFS
('Parts identification', 2, 'IFS', 1),
('Unblending', 2, 'IFS', 2),
('Self-energy access', 2, 'IFS', 3),
 
-- Tier 2: Solution-Focused
('Miracle question', 2, 'Solution-Focused', 1),
('Scaling questions', 2, 'Solution-Focused', 2),
('Exception finding', 2, 'Solution-Focused', 3),
 
-- Tier 3: Crisis/Risk (only when risk flagged)
('Suicide risk assessment', 3, NULL, 1),
('Crisis de-escalation', 3, NULL, 2),
('Safety contracting', 3, NULL, 3),
('Emergency resource coordination', 3, NULL, 4),
('Lethal means counseling', 3, NULL, 5),
 
-- Tier 4: Administrative/Clinical Process
('Coordination of care', 4, NULL, 1),
('Documentation review', 4, NULL, 2),
('Referral discussion', 4, NULL, 3),
('Medication adherence discussion', 4, NULL, 4),
('Homework assignment', 4, NULL, 5)
 
ON DUPLICATE KEY UPDATE intervention_name=intervention_name; -- No-op if exists
 
-- ========================================
-- 8. UPDATE APPOINTMENTS TABLE (Add Note Reference)
-- ========================================
 
-- ALTER TABLE openemr_postcalendar_events
-- ADD COLUMN clinical_note_id INT NULL AFTER pc_recurrspec,
-- ADD INDEX idx_clinical_note (clinical_note_id);
 
-- Note: Can't add FK constraint to openemr table safely
-- Will enforce relationship in application layer
 
-- ========================================
-- VERIFICATION QUERIES
-- ========================================
 
-- Verify tables created
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'clinical_notes',
    'note_drafts',
    'treatment_goals',
    'intervention_library',
    'user_favorite_interventions',
    'clinical_settings'
)
ORDER BY TABLE_NAME;
 
-- Verify intervention library seeded
SELECT
    intervention_tier,
    modality,
    COUNT(*) as count
FROM intervention_library
GROUP BY intervention_tier, modality
ORDER BY intervention_tier, modality;
 
-- ========================================
-- NOTES FOR ADMIN
-- ========================================
 
/*
IMPORTANT NOTES:
 
1. The clinical_notes table is the primary entity.
   - Notes can exist without appointments
   - Appointments reference notes (via clinical_note_id)
 
2. Auto-save is handled by note_drafts table
   - Drafts save every 3 seconds to this table
   - When note is officially saved, draft is linked
 
3. Intervention library is pre-seeded with common interventions
   - Tier 1: Always visible (12 core interventions)
   - Tier 2: Modality-specific (collapsible)
   - Tier 3: Crisis/Risk (triggered by risk flag)
   - Tier 4: Administrative (secondary category)
 
4. Settings table controls system behavior
   - default_note_template: BIRP or PIRP
   - require_supervisor_review: true/false
   - auto_lock_notes_after_days: number
   - allow_post_signature_edits: true/false
 
5. UUID field (note_uuid) is for API security
   - Internal ID is auto-increment
   - External references use UUID
   - Prevents ID enumeration attacks
 
6. All timestamps are auto-managed
   - created_at on INSERT
   - updated_at on UPDATE
   - Audit trail preserved
*/
