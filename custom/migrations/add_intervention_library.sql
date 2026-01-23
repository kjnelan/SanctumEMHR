-- ========================================
-- Mindline EMHR - Add Intervention Library
-- Creates intervention library and related tables
-- for clinical notes system
-- ========================================
--
-- Author: Kenneth J. Nelan
-- Copyright © 2026 Sacred Wandering
-- Proprietary and Confidential

-- ========================================
-- 1. TREATMENT GOALS (For Carry-Forward)
-- ========================================

CREATE TABLE IF NOT EXISTS treatment_goals (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    patient_id BIGINT(20) UNSIGNED NOT NULL,
    provider_id BIGINT(20) UNSIGNED NOT NULL,

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
    FOREIGN KEY (patient_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 2. INTERVENTION LIBRARY (For Quick-Select)
-- ========================================

CREATE TABLE IF NOT EXISTS intervention_library (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    intervention_name VARCHAR(100) NOT NULL UNIQUE,
    intervention_tier INT NOT NULL,
    modality VARCHAR(50) NULL,

    is_system_intervention BOOLEAN DEFAULT TRUE,
    created_by BIGINT(20) UNSIGNED NULL,

    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tier (intervention_tier),
    INDEX idx_modality (modality),
    INDEX idx_active (is_active),

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 3. USER FAVORITE INTERVENTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS user_favorite_interventions (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT(20) UNSIGNED NOT NULL,
    intervention_id BIGINT(20) UNSIGNED NOT NULL,

    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    UNIQUE KEY unique_user_intervention (user_id, intervention_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_id) REFERENCES intervention_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 4. CLINICAL SETTINGS (For Admin Choices)
-- ========================================

CREATE TABLE IF NOT EXISTS clinical_settings (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string',

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT(20) UNSIGNED NULL,

    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 5. SEED DEFAULT SETTINGS
-- ========================================

INSERT INTO clinical_settings (setting_key, setting_value, setting_type) VALUES
('default_note_template', 'BIRP', 'string'),
('require_supervisor_review', 'false', 'boolean'),
('auto_lock_notes_after_days', '7', 'string'),
('allow_post_signature_edits', 'true', 'boolean')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- ========================================
-- 6. SEED INTERVENTION LIBRARY
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

ON DUPLICATE KEY UPDATE intervention_name=intervention_name;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify tables created
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
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
