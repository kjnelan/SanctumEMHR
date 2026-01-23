-- Create reference_lists table for managing clinical and demographic lookup lists
-- This table consolidates management of all lookup lists (Sexual Orientation, Gender Identity, etc.)
--
-- Author: Kenneth J. Nelan
-- Copyright © 2026 Sacred Wandering

CREATE TABLE IF NOT EXISTS `reference_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `list_type` varchar(50) NOT NULL COMMENT 'Type of list: sexual-orientation, gender-identity, marital-status, etc.',
  `name` varchar(100) NOT NULL COMMENT 'Display name of the item',
  `description` text DEFAULT NULL COMMENT 'Optional description or clarification',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether this item is active and should appear in selection lists',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT 'Sort order within list type',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_name` (`list_type`, `name`),
  KEY `idx_list_type` (`list_type`),
  KEY `idx_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reference lists for clinical and demographic data';

-- Insert default Sexual Orientation values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('sexual-orientation', 'Heterosexual', 'Attracted to opposite sex', 1, 1),
('sexual-orientation', 'Gay', 'Attracted to same sex', 1, 2),
('sexual-orientation', 'Lesbian', 'Woman attracted to women', 1, 3),
('sexual-orientation', 'Bisexual', 'Attracted to both sexes', 1, 4),
('sexual-orientation', 'Pansexual', 'Attracted to all genders', 1, 5),
('sexual-orientation', 'Asexual', 'Limited or no sexual attraction', 1, 6),
('sexual-orientation', 'Queer', 'Non-heterosexual orientation', 1, 7),
('sexual-orientation', 'Questioning', 'Exploring sexual orientation', 1, 8),
('sexual-orientation', 'Other', 'Other sexual orientation', 1, 9),
('sexual-orientation', 'Prefer not to say', NULL, 1, 10);

-- Insert default Gender Identity values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('gender-identity', 'Male', 'Identifies as male', 1, 1),
('gender-identity', 'Female', 'Identifies as female', 1, 2),
('gender-identity', 'Transgender Male', 'Assigned female at birth, identifies as male', 1, 3),
('gender-identity', 'Transgender Female', 'Assigned male at birth, identifies as female', 1, 4),
('gender-identity', 'Non-binary', 'Gender identity outside male/female binary', 1, 5),
('gender-identity', 'Genderqueer', 'Gender identity that is not exclusively male or female', 1, 6),
('gender-identity', 'Genderfluid', 'Gender identity that varies over time', 1, 7),
('gender-identity', 'Agender', 'Without gender identity', 1, 8),
('gender-identity', 'Two-Spirit', 'Indigenous gender identity', 1, 9),
('gender-identity', 'Other', 'Other gender identity', 1, 10),
('gender-identity', 'Prefer not to say', NULL, 1, 11);

-- Insert default Pronoun values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('pronouns', 'He/Him/His', NULL, 1, 1),
('pronouns', 'She/Her/Hers', NULL, 1, 2),
('pronouns', 'They/Them/Theirs', NULL, 1, 3),
('pronouns', 'Ze/Zir/Zirs', NULL, 1, 4),
('pronouns', 'Ze/Hir/Hirs', NULL, 1, 5),
('pronouns', 'Xe/Xem/Xyrs', NULL, 1, 6),
('pronouns', 'Other', 'Other pronouns', 1, 7),
('pronouns', 'Prefer not to say', NULL, 1, 8);

-- Insert default Marital Status values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('marital-status', 'Single', 'Never married', 1, 1),
('marital-status', 'Married', 'Currently married', 1, 2),
('marital-status', 'Domestic Partnership', 'In domestic partnership', 1, 3),
('marital-status', 'Separated', 'Legally separated', 1, 4),
('marital-status', 'Divorced', 'Legally divorced', 1, 5),
('marital-status', 'Widowed', 'Spouse deceased', 1, 6),
('marital-status', 'Other', 'Other marital status', 1, 7);

-- Insert default Client Status values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('client-status', 'Active', 'Currently receiving services', 1, 1),
('client-status', 'Inactive', 'Not currently receiving services', 1, 2),
('client-status', 'On Hold', 'Temporarily paused services', 1, 3),
('client-status', 'Waitlist', 'Awaiting intake or services', 1, 4),
('client-status', 'Discharged', 'Completed or terminated services', 1, 5);

-- Insert default Ethnicity/Race values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('ethnicity', 'Hispanic or Latino', NULL, 1, 1),
('ethnicity', 'Not Hispanic or Latino', NULL, 1, 2),
('ethnicity', 'American Indian or Alaska Native', NULL, 1, 3),
('ethnicity', 'Asian', NULL, 1, 4),
('ethnicity', 'Black or African American', NULL, 1, 5),
('ethnicity', 'Native Hawaiian or Pacific Islander', NULL, 1, 6),
('ethnicity', 'White', NULL, 1, 7),
('ethnicity', 'Two or More Races', NULL, 1, 8),
('ethnicity', 'Other', NULL, 1, 9),
('ethnicity', 'Prefer not to say', NULL, 1, 10);

-- Insert default Insurance Type values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('insurance-type', 'Commercial', 'Private health insurance', 1, 1),
('insurance-type', 'Medicare', 'Federal health insurance', 1, 2),
('insurance-type', 'Medicaid', 'State health insurance', 1, 3),
('insurance-type', 'Medicare Advantage', 'Medicare through private insurer', 1, 4),
('insurance-type', 'Tricare', 'Military health insurance', 1, 5),
('insurance-type', 'VA Benefits', 'Veterans Affairs benefits', 1, 6),
('insurance-type', 'Self-Pay', 'No insurance, paying out of pocket', 1, 7),
('insurance-type', 'Sliding Scale', 'Income-based fee', 1, 8),
('insurance-type', 'Other', 'Other insurance type', 1, 9);

-- Insert default Referral Source values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('referral-source', 'Self-Referral', 'Client self-referred', 1, 1),
('referral-source', 'Family/Friend', 'Referred by family or friend', 1, 2),
('referral-source', 'Primary Care Physician', 'Referred by PCP', 1, 3),
('referral-source', 'Psychiatrist', 'Referred by psychiatrist', 1, 4),
('referral-source', 'Therapist/Counselor', 'Referred by another therapist', 1, 5),
('referral-source', 'School', 'Referred by school counselor/staff', 1, 6),
('referral-source', 'Court/Legal', 'Court-ordered or legal system', 1, 7),
('referral-source', 'Hospital/Emergency', 'Hospital or emergency services', 1, 8),
('referral-source', 'Employee Assistance Program', 'Referred by EAP', 1, 9),
('referral-source', 'Insurance Provider', 'Insurance referral', 1, 10),
('referral-source', 'Online Search', 'Found via internet search', 1, 11),
('referral-source', 'Social Media', 'Found via social media', 1, 12),
('referral-source', 'Community Organization', 'Referred by community org', 1, 13),
('referral-source', 'Other', 'Other referral source', 1, 14);

-- Insert default Treatment Modality values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('treatment-modality', 'CBT', 'Cognitive Behavioral Therapy', 1, 1),
('treatment-modality', 'DBT', 'Dialectical Behavior Therapy', 1, 2),
('treatment-modality', 'ACT', 'Acceptance and Commitment Therapy', 1, 3),
('treatment-modality', 'EMDR', 'Eye Movement Desensitization and Reprocessing', 1, 4),
('treatment-modality', 'Psychodynamic', 'Psychodynamic therapy', 1, 5),
('treatment-modality', 'Humanistic', 'Humanistic/Person-centered therapy', 1, 6),
('treatment-modality', 'Motivational Interviewing', 'MI approach', 1, 7),
('treatment-modality', 'Family Systems', 'Family therapy approach', 1, 8),
('treatment-modality', 'Solution-Focused', 'Solution-focused brief therapy', 1, 9),
('treatment-modality', 'Narrative Therapy', 'Narrative approach', 1, 10),
('treatment-modality', 'Mindfulness-Based', 'Mindfulness-based interventions', 1, 11),
('treatment-modality', 'Trauma-Focused', 'Trauma-focused therapy', 1, 12),
('treatment-modality', 'Eclectic/Integrative', 'Integrated approach', 1, 13),
('treatment-modality', 'Other', 'Other modality', 1, 14);

-- Insert default Discharge Reason values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('discharge-reason', 'Treatment goals achieved', 'Successfully completed treatment', 1, 1),
('discharge-reason', 'Client request', 'Client chose to discontinue', 1, 2),
('discharge-reason', 'Mutual agreement', 'Agreed to end services', 1, 3),
('discharge-reason', 'Client no-show', 'Client stopped attending', 1, 4),
('discharge-reason', 'Administrative discharge', 'Discharged for administrative reasons', 1, 5),
('discharge-reason', 'Transfer to another provider', 'Transferring care', 1, 6),
('discharge-reason', 'Moved out of area', 'Client relocated', 1, 7),
('discharge-reason', 'Insurance/financial reasons', 'Unable to continue due to payment', 1, 8),
('discharge-reason', 'Other', 'Other discharge reason', 1, 9);

-- Insert default Calendar Category values
INSERT INTO `reference_lists` (`list_type`, `name`, `description`, `is_active`, `sort_order`) VALUES
('calendar-category', 'Individual Therapy', '1:1 therapy session', 1, 1),
('calendar-category', 'Group Therapy', 'Group therapy session', 1, 2),
('calendar-category', 'Family Therapy', 'Family/couples session', 1, 3),
('calendar-category', 'Intake/Assessment', 'Initial intake or assessment', 1, 4),
('calendar-category', 'Follow-up', 'Follow-up appointment', 1, 5),
('calendar-category', 'Crisis', 'Crisis intervention', 1, 6),
('calendar-category', 'Case Management', 'Case management services', 1, 7),
('calendar-category', 'Medication Management', 'Psychiatric medication appointment', 1, 8),
('calendar-category', 'Testing', 'Psychological testing', 1, 9),
('calendar-category', 'Consultation', 'Consultation appointment', 1, 10),
('calendar-category', 'Administrative', 'Administrative meeting', 1, 11),
('calendar-category', 'Other', 'Other appointment type', 1, 12);

-- Success message
SELECT 'Reference Lists table created successfully!' AS message;
