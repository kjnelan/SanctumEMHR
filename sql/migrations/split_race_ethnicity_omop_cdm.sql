-- ============================================================================
-- Migration: Split Race and Ethnicity into Distinct Reference Lists
-- Standard: OMOP Common Data Model v5.4 + HIPAA/ONC USCDI v3 (OMB categories)
-- Date: 2026-02-09
--
-- BACKGROUND:
-- Per OMB Statistical Directive 15 (revised 1997), race and ethnicity are two
-- separate concepts. Ethnicity captures Hispanic/Latino origin while Race
-- captures racial categories. The OMOP CDM maps these to distinct concept
-- domains (Race: concept_class_id='Race', Ethnicity: concept_class_id='Ethnicity').
--
-- BEFORE: Both race and ethnicity shared list_type = 'ethnicity' in reference_lists.
-- AFTER:  Race uses list_type = 'race'; Ethnicity keeps list_type = 'ethnicity'.
-- ============================================================================

-- Step 1: Move racial categories from list_type='ethnicity' to list_type='race'
-- These IDs (44-49) are OMB race categories that were incorrectly stored under 'ethnicity'
UPDATE reference_lists SET list_type = 'race', updated_at = NOW()
WHERE list_type = 'ethnicity'
  AND name IN (
    'American Indian or Alaska Native',
    'Asian',
    'Black or African American',
    'Native Hawaiian or Pacific Islander',
    'White',
    'Two or More Races'
  );

-- Step 2: Rename to match exact OMOP CDM / OMB terminology
-- "Native Hawaiian or Pacific Islander" -> "Native Hawaiian or Other Pacific Islander" (OMB standard)
UPDATE reference_lists SET name = 'Native Hawaiian or Other Pacific Islander', updated_at = NOW()
WHERE list_type = 'race' AND name = 'Native Hawaiian or Pacific Islander';

-- Step 3: Add race-specific 'Other', 'Unknown', and 'Prefer not to say' entries
-- (The existing 'Other' ID 50 and 'Prefer not to say' ID 51 stay under 'ethnicity')
INSERT INTO reference_lists (list_type, name, description, is_active, sort_order, created_at, updated_at)
VALUES
  ('race', 'Other', 'Race not listed above', 1, 7, NOW(), NOW()),
  ('race', 'Unknown', 'Race unknown or not reported', 1, 8, NOW(), NOW()),
  ('race', 'Prefer not to say', 'Client declined to specify race', 1, 9, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Step 4: Add 'Unknown' to ethnicity list (OMOP CDM concept_id 0 mapping)
INSERT INTO reference_lists (list_type, name, description, is_active, sort_order, created_at, updated_at)
VALUES
  ('ethnicity', 'Unknown', 'Ethnicity unknown or not reported', 1, 4, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Step 5: Set proper sort orders for ethnicity (OMB order)
UPDATE reference_lists SET sort_order = 1, updated_at = NOW() WHERE list_type = 'ethnicity' AND name = 'Hispanic or Latino';
UPDATE reference_lists SET sort_order = 2, updated_at = NOW() WHERE list_type = 'ethnicity' AND name = 'Not Hispanic or Latino';
UPDATE reference_lists SET sort_order = 3, updated_at = NOW() WHERE list_type = 'ethnicity' AND name = 'Other';
UPDATE reference_lists SET sort_order = 4, updated_at = NOW() WHERE list_type = 'ethnicity' AND name = 'Unknown';
UPDATE reference_lists SET sort_order = 5, updated_at = NOW() WHERE list_type = 'ethnicity' AND name = 'Prefer not to say';

-- Step 6: Set proper sort orders for race (OMB order)
UPDATE reference_lists SET sort_order = 1, updated_at = NOW() WHERE list_type = 'race' AND name = 'American Indian or Alaska Native';
UPDATE reference_lists SET sort_order = 2, updated_at = NOW() WHERE list_type = 'race' AND name = 'Asian';
UPDATE reference_lists SET sort_order = 3, updated_at = NOW() WHERE list_type = 'race' AND name = 'Black or African American';
UPDATE reference_lists SET sort_order = 4, updated_at = NOW() WHERE list_type = 'race' AND name = 'Native Hawaiian or Other Pacific Islander';
UPDATE reference_lists SET sort_order = 5, updated_at = NOW() WHERE list_type = 'race' AND name = 'White';
UPDATE reference_lists SET sort_order = 6, updated_at = NOW() WHERE list_type = 'race' AND name = 'Two or More Races';
UPDATE reference_lists SET sort_order = 7, updated_at = NOW() WHERE list_type = 'race' AND name = 'Other';
UPDATE reference_lists SET sort_order = 8, updated_at = NOW() WHERE list_type = 'race' AND name = 'Unknown';
UPDATE reference_lists SET sort_order = 9, updated_at = NOW() WHERE list_type = 'race' AND name = 'Prefer not to say';

-- ============================================================================
-- DATA INTEGRITY NOTE:
-- If any clients.ethnicity column contains IDs that were just moved to 'race'
-- (e.g., a client's ethnicity was set to 'White'), those values should be
-- reviewed and corrected manually. The query below can help identify them:
--
--   SELECT c.id, c.first_name, c.last_name, c.ethnicity, c.race,
--          rl_e.name AS ethnicity_resolved, rl_r.name AS race_resolved
--   FROM clients c
--   LEFT JOIN reference_lists rl_e ON rl_e.id = c.ethnicity AND rl_e.list_type = 'ethnicity'
--   LEFT JOIN reference_lists rl_r ON rl_r.id = c.race AND rl_r.list_type = 'race'
--   WHERE c.ethnicity IS NOT NULL
--     AND c.ethnicity NOT IN (SELECT id FROM reference_lists WHERE list_type = 'ethnicity');
--
-- ============================================================================
-- FINAL STATE after migration:
--
-- list_type = 'ethnicity':
--   - Hispanic or Latino          (OMOP concept_id: 38003563)
--   - Not Hispanic or Latino      (OMOP concept_id: 38003564)
--   - Other
--   - Unknown                     (OMOP concept_id: 0)
--   - Prefer not to say
--
-- list_type = 'race':
--   - American Indian or Alaska Native    (OMOP concept_id: 8657)
--   - Asian                                (OMOP concept_id: 8515)
--   - Black or African American            (OMOP concept_id: 8516)
--   - Native Hawaiian or Other Pacific Islander (OMOP concept_id: 8557)
--   - White                                (OMOP concept_id: 8527)
--   - Two or More Races
--   - Other
--   - Unknown                              (OMOP concept_id: 0)
--   - Prefer not to say
-- ============================================================================
