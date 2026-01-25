-- Add room column to appointments table
-- This stores the counseling room/office assignment for each appointment
-- Run this SQL on your database to add the room column

ALTER TABLE appointments
ADD COLUMN room VARCHAR(50) DEFAULT NULL
COMMENT 'Counseling room/office for this appointment'
AFTER status;

-- Create index for room lookups
CREATE INDEX idx_room ON appointments(room);
