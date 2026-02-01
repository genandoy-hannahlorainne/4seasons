-- Script to automatically assign advisers to students based on grade level and section

-- Update students with matching adviser (using user_id from advisers table)
UPDATE students s
INNER JOIN advisers a ON s.grade_level = a.grade_level AND s.section = a.section
SET s.current_adviser_id = a.user_id
WHERE s.is_active = 1 
  AND a.is_active = 1
  AND s.current_adviser_id IS NULL;

-- Insert into student_adviser junction table
INSERT INTO student_adviser (student_id, adviser_id, assigned_date)
SELECT s.student_id, a.adviser_id, CURDATE()
FROM students s
INNER JOIN advisers a ON s.grade_level = a.grade_level AND s.section = a.section
WHERE s.is_active = 1 
  AND a.is_active = 1
  AND NOT EXISTS (
    SELECT 1 FROM student_adviser sa 
    WHERE sa.student_id = s.student_id AND sa.adviser_id = a.adviser_id
  );

-- Show results
SELECT 
    s.student_number,
    s.first_name,
    s.last_name,
    s.grade_level,
    s.section,
    CONCAT(a.first_name, ' ', a.last_name) as adviser_name
FROM students s
LEFT JOIN advisers a ON s.current_adviser_id = a.user_id
WHERE s.is_active = 1
ORDER BY s.grade_level, s.section, s.last_name;
