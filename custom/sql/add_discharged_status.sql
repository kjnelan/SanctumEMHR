-- Add 'discharged' status to Care_Team_Status list
-- This allows marking clients as discharged from care

INSERT INTO `list_options`
  (`list_id`, `option_id`, `title`, `seq`, `is_default`, `option_value`, `notes`, `activity`)
VALUES
  ('Care_Team_Status', 'discharged', 'Discharged', 60, 0, 0, 'Client has been formally discharged from care services.', 1);

-- Verify the insertion
SELECT * FROM list_options WHERE list_id = 'Care_Team_Status' ORDER BY seq;
