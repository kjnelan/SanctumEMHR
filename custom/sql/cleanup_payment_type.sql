-- Clean up redundant payment_type options
-- Keep 'insurance' and 'client' (self-pay), hide 'patient'

-- Deactivate 'patient' option (keep in DB for backwards compatibility)
UPDATE list_options
SET activity = 0,
    notes = 'Deprecated - use "Self-Pay (Client)" instead'
WHERE list_id = 'payment_type' AND option_id = 'patient';

-- Ensure 'insurance' and 'client' are active and properly ordered
UPDATE list_options SET activity = 1, seq = 10 WHERE list_id = 'payment_type' AND option_id = 'insurance';
UPDATE list_options SET activity = 1, seq = 20 WHERE list_id = 'payment_type' AND option_id = 'client';

-- Verify results
SELECT option_id, title, seq, activity, notes
FROM list_options
WHERE list_id = 'payment_type'
ORDER BY seq;
