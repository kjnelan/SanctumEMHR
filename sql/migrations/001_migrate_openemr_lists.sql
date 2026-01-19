-- ============================================
-- Migration: Copy Critical Lists from OpenEMR
-- ============================================
-- This migrates only the list_options we actually use
-- from OpenEMR to our new settings_lists table.

-- Migrate: Gender Identity
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order)
SELECT
    'gender_identity' as list_id,
    option_id,
    title,
    notes,
    activity as is_active,
    seq as sort_order
FROM list_options
WHERE list_id = 'gender_identity'
AND activity = 1
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    notes = VALUES(notes),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

-- Migrate: Sexual Orientation
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order)
SELECT
    'sexual_orientation' as list_id,
    option_id,
    title,
    notes,
    activity as is_active,
    seq as sort_order
FROM list_options
WHERE list_id = 'sexual_orientation'
AND activity = 1
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    notes = VALUES(notes),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

-- Migrate: Race
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order)
SELECT
    'race' as list_id,
    option_id,
    title,
    notes,
    activity as is_active,
    seq as sort_order
FROM list_options
WHERE list_id = 'race'
AND activity = 1
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    notes = VALUES(notes),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

-- Migrate: Ethnicity
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order)
SELECT
    'ethnicity' as list_id,
    option_id,
    title,
    notes,
    activity as is_active,
    seq as sort_order
FROM list_options
WHERE list_id = 'ethnicity'
AND activity = 1
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    notes = VALUES(notes),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

-- Migrate: Rooms (for appointments)
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order)
SELECT
    'rooms' as list_id,
    option_id,
    title,
    notes,
    activity as is_active,
    seq as sort_order
FROM list_options
WHERE list_id = 'rooms'
AND activity = 1
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    notes = VALUES(notes),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

-- Migrate: Publicity Code (privacy preferences)
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order)
SELECT
    'publicity_code' as list_id,
    option_id,
    title,
    notes,
    activity as is_active,
    seq as sort_order
FROM list_options
WHERE list_id = 'publicity_code'
AND activity = 1
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    notes = VALUES(notes),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

-- Migrate: Patient Protection Indicators
INSERT INTO settings_lists (list_id, option_id, title, notes, is_active, sort_order)
SELECT
    'pt_protect_indica' as list_id,
    option_id,
    title,
    notes,
    activity as is_active,
    seq as sort_order
FROM list_options
WHERE list_id = 'pt_protect_indica'
AND activity = 1
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    notes = VALUES(notes),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

-- Verification Query
SELECT
    list_id,
    COUNT(*) as option_count
FROM settings_lists
GROUP BY list_id
ORDER BY list_id;
