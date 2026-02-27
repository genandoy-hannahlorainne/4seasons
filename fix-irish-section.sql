-- Fix Irish's section assignment
-- Irish (student_id: 26) should be in section 63 with Heart Igot as adviser

UPDATE students 
SET current_section_id = 63 
WHERE student_id = 26 AND current_adviser_id = 60;

-- Verify the update
SELECT 
    student_id, 
    student_number, 
    first_name, 
    last_name, 
    current_section_id, 
    current_adviser_id, 
    current_school_year_id 
FROM students 
WHERE current_adviser_id = 60;