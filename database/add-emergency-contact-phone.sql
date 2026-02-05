-- Add emergency_contact_phone field to students table
-- This field stores the phone number of the emergency contact person

ALTER TABLE `students` 
ADD COLUMN `emergency_contact_phone` VARCHAR(20) DEFAULT NULL 
AFTER `emergency_contact_relation`;

-- Update existing records: if emergency_contact looks like a phone number, move it to the new field
-- This is a safety measure in case any records have phone numbers in the emergency_contact field
UPDATE `students` 
SET `emergency_contact_phone` = `emergency_contact`,
    `emergency_contact` = NULL
WHERE `emergency_contact` REGEXP '^[0-9+() -]+$' 
AND LENGTH(`emergency_contact`) < 20;
