-- Add emergency_contact_relation_other column if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS emergency_contact_relation_other VARCHAR(100) NULL 
AFTER emergency_contact_relation;

-- Verify the column was added
DESCRIBE students;
