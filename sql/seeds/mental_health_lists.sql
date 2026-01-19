-- ============================================
-- Mental Health EHR - Custom List Seed Data
-- ============================================
-- Lists specific to mental health practice

-- ============================================
-- Therapy Modalities
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('therapy_modality', 'cbt', 'Cognitive Behavioral Therapy (CBT)', NULL, 1, 10),
('therapy_modality', 'dbt', 'Dialectical Behavior Therapy (DBT)', NULL, 1, 20),
('therapy_modality', 'psychodynamic', 'Psychodynamic Therapy', NULL, 1, 30),
('therapy_modality', 'humanistic', 'Humanistic Therapy', NULL, 1, 40),
('therapy_modality', 'emdr', 'EMDR (Eye Movement Desensitization)', NULL, 1, 50),
('therapy_modality', 'exposure', 'Exposure Therapy', NULL, 1, 60),
('therapy_modality', 'family', 'Family Therapy', NULL, 1, 70),
('therapy_modality', 'couples', 'Couples Therapy', NULL, 1, 80),
('therapy_modality', 'group', 'Group Therapy', NULL, 1, 90),
('therapy_modality', 'play', 'Play Therapy', NULL, 1, 100),
('therapy_modality', 'art', 'Art Therapy', NULL, 1, 110),
('therapy_modality', 'mindfulness', 'Mindfulness-Based Therapy', NULL, 1, 120),
('therapy_modality', 'act', 'Acceptance and Commitment Therapy (ACT)', NULL, 1, 130),
('therapy_modality', 'solution_focused', 'Solution-Focused Brief Therapy', NULL, 1, 140),
('therapy_modality', 'motivational', 'Motivational Interviewing', NULL, 1, 150),
('therapy_modality', 'trauma_focused', 'Trauma-Focused Therapy', NULL, 1, 160),
('therapy_modality', 'other', 'Other', NULL, 1, 999);

-- ============================================
-- Treatment Goal Categories
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('treatment_goal_category', 'mood', 'Mood Regulation', NULL, 1, 10),
('treatment_goal_category', 'anxiety', 'Anxiety Management', NULL, 1, 20),
('treatment_goal_category', 'depression', 'Depression Management', NULL, 1, 30),
('treatment_goal_category', 'trauma', 'Trauma Processing', NULL, 1, 40),
('treatment_goal_category', 'relationships', 'Relationship Skills', NULL, 1, 50),
('treatment_goal_category', 'communication', 'Communication Skills', NULL, 1, 60),
('treatment_goal_category', 'coping', 'Coping Strategies', NULL, 1, 70),
('treatment_goal_category', 'self_esteem', 'Self-Esteem/Self-Worth', NULL, 1, 80),
('treatment_goal_category', 'anger', 'Anger Management', NULL, 1, 90),
('treatment_goal_category', 'substance', 'Substance Use', NULL, 1, 100),
('treatment_goal_category', 'eating', 'Eating Behaviors', NULL, 1, 110),
('treatment_goal_category', 'sleep', 'Sleep Hygiene', NULL, 1, 120),
('treatment_goal_category', 'stress', 'Stress Management', NULL, 1, 130),
('treatment_goal_category', 'family', 'Family Dynamics', NULL, 1, 140),
('treatment_goal_category', 'work_school', 'Work/School Functioning', NULL, 1, 150),
('treatment_goal_category', 'social', 'Social Skills', NULL, 1, 160),
('treatment_goal_category', 'other', 'Other', NULL, 1, 999);

-- ============================================
-- Risk Assessment Levels
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('risk_level', 'none', 'No Risk', 'No identified risk', 1, 10),
('risk_level', 'low', 'Low Risk', 'Minimal risk factors present', 1, 20),
('risk_level', 'moderate', 'Moderate Risk', 'Some risk factors present', 1, 30),
('risk_level', 'high', 'High Risk', 'Significant risk factors', 1, 40),
('risk_level', 'imminent', 'Imminent Risk', 'Immediate intervention required', 1, 50);

-- ============================================
-- Appointment Types (Mental Health Specific)
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('appointment_type', 'intake', 'Initial Intake/Assessment', '90-minute initial evaluation', 1, 10),
('appointment_type', 'individual_60', 'Individual Therapy (60 min)', 'Standard individual session', 1, 20),
('appointment_type', 'individual_45', 'Individual Therapy (45 min)', 'Brief individual session', 1, 30),
('appointment_type', 'individual_90', 'Individual Therapy (90 min)', 'Extended individual session', 1, 40),
('appointment_type', 'couples', 'Couples Therapy', '60-90 minute couples session', 1, 50),
('appointment_type', 'family', 'Family Therapy', '60-90 minute family session', 1, 60),
('appointment_type', 'group', 'Group Therapy', 'Group therapy session', 1, 70),
('appointment_type', 'medication', 'Medication Management', 'Psychiatric medication review', 1, 80),
('appointment_type', 'crisis', 'Crisis Intervention', 'Emergency/crisis appointment', 1, 90),
('appointment_type', 'follow_up', 'Follow-Up', 'Brief follow-up appointment', 1, 100),
('appointment_type', 'telehealth', 'Telehealth Session', 'Video/phone session', 1, 110),
('appointment_type', 'testing', 'Psychological Testing', 'Assessment/testing session', 1, 120);

-- ============================================
-- Mental Status Exam Components
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
-- Appearance
('mse_appearance', 'well_groomed', 'Well-groomed', NULL, 1, 10),
('mse_appearance', 'disheveled', 'Disheveled', NULL, 1, 20),
('mse_appearance', 'appropriate', 'Appropriate dress', NULL, 1, 30),
('mse_appearance', 'inappropriate', 'Inappropriate dress', NULL, 1, 40),

-- Behavior
('mse_behavior', 'cooperative', 'Cooperative', NULL, 1, 10),
('mse_behavior', 'uncooperative', 'Uncooperative', NULL, 1, 20),
('mse_behavior', 'agitated', 'Agitated', NULL, 1, 30),
('mse_behavior', 'calm', 'Calm', NULL, 1, 40),
('mse_behavior', 'withdrawn', 'Withdrawn', NULL, 1, 50),

-- Mood
('mse_mood', 'euthymic', 'Euthymic (normal)', NULL, 1, 10),
('mse_mood', 'depressed', 'Depressed', NULL, 1, 20),
('mse_mood', 'anxious', 'Anxious', NULL, 1, 30),
('mse_mood', 'angry', 'Angry/Irritable', NULL, 1, 40),
('mse_mood', 'elevated', 'Elevated', NULL, 1, 50),
('mse_mood', 'labile', 'Labile', NULL, 1, 60),

-- Affect
('mse_affect', 'appropriate', 'Appropriate', NULL, 1, 10),
('mse_affect', 'flat', 'Flat', NULL, 1, 20),
('mse_affect', 'blunted', 'Blunted', NULL, 1, 30),
('mse_affect', 'constricted', 'Constricted', NULL, 1, 40),
('mse_affect', 'labile', 'Labile', NULL, 1, 50),

-- Thought Process
('mse_thought_process', 'logical', 'Logical/Coherent', NULL, 1, 10),
('mse_thought_process', 'tangential', 'Tangential', NULL, 1, 20),
('mse_thought_process', 'circumstantial', 'Circumstantial', NULL, 1, 30),
('mse_thought_process', 'disorganized', 'Disorganized', NULL, 1, 40),
('mse_thought_process', 'racing', 'Racing thoughts', NULL, 1, 50),

-- Insight
('mse_insight', 'good', 'Good', NULL, 1, 10),
('mse_insight', 'fair', 'Fair', NULL, 1, 20),
('mse_insight', 'poor', 'Poor', NULL, 1, 30),
('mse_insight', 'absent', 'Absent', NULL, 1, 40),

-- Judgment
('mse_judgment', 'good', 'Good', NULL, 1, 10),
('mse_judgment', 'fair', 'Fair', NULL, 1, 20),
('mse_judgment', 'poor', 'Poor', NULL, 1, 30),
('mse_judgment', 'impaired', 'Impaired', NULL, 1, 40);

-- ============================================
-- Progress Indicators
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('progress_indicator', 'significant_improvement', 'Significant Improvement', NULL, 1, 10),
('progress_indicator', 'moderate_improvement', 'Moderate Improvement', NULL, 1, 20),
('progress_indicator', 'minimal_improvement', 'Minimal Improvement', NULL, 1, 30),
('progress_indicator', 'no_change', 'No Change', NULL, 1, 40),
('progress_indicator', 'regression', 'Regression/Decline', NULL, 1, 50);

-- ============================================
-- Clinical Note Types
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('note_type', 'progress_note', 'Progress Note', 'Standard therapy session note', 1, 10),
('note_type', 'intake', 'Intake Assessment', 'Initial evaluation', 1, 20),
('note_type', 'psychiatric_eval', 'Psychiatric Evaluation', 'Comprehensive psychiatric assessment', 1, 30),
('note_type', 'treatment_plan', 'Treatment Plan', 'Treatment planning document', 1, 40),
('note_type', 'discharge_summary', 'Discharge Summary', 'Summary at end of treatment', 1, 50),
('note_type', 'crisis_note', 'Crisis Note', 'Emergency/crisis documentation', 1, 60),
('note_type', 'phone_note', 'Phone Contact Note', 'Telephone contact documentation', 1, 70),
('note_type', 'collateral', 'Collateral Contact', 'Contact with family/others', 1, 80),
('note_type', 'supervision', 'Supervision Note', 'Clinical supervision documentation', 1, 90);

-- ============================================
-- Discharge Reasons
-- ============================================
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order) VALUES
('discharge_reason', 'goals_met', 'Treatment Goals Met', NULL, 1, 10),
('discharge_reason', 'mutual', 'Mutual Agreement', NULL, 1, 20),
('discharge_reason', 'client_request', 'Client Request', NULL, 1, 30),
('discharge_reason', 'no_show', 'Repeated No-Shows', NULL, 1, 40),
('discharge_reason', 'non_payment', 'Non-Payment', NULL, 1, 50),
('discharge_reason', 'relocation', 'Client Relocated', NULL, 1, 60),
('discharge_reason', 'higher_level', 'Referred to Higher Level of Care', NULL, 1, 70),
('discharge_reason', 'other', 'Other', NULL, 1, 999);

-- Verification: Show all lists
SELECT list_id, COUNT(*) as count
FROM settings_lists
GROUP BY list_id
ORDER BY list_id;
